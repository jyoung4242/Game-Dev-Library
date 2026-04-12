import * as ex from "excalibur";
import { PerlinGenerator } from "@excaliburjs/plugin-perlin";

// ---------------------------------------------------------------------------
// FogActorOptions
// ---------------------------------------------------------------------------
export type FogActorOptions = ex.ActorArgs & {
  /** Width of the fog in pixels (should match the parent actor's width) */
  fogWidth: number;
  /** Height of the fog in pixels (should match the parent actor's height) */
  fogHeight: number;

  /**
   * Positional offset applied to the child actor so it lines up with the
   * parent. Typically (-parent.width / 2, -parent.height / 2) when the
   * parent uses a centre anchor. Default: ex.Vector.Zero
   */
  offset?: ex.Vector;

  // --- PerlinGenerator knobs ---
  /** Random seed — fix this for a consistent fog shape. Default: random */
  seed?: number;
  /**
   * Number of noise octaves layered together.
   * More octaves → more detail, more cost. Default: 3
   */
  octaves?: number;
  /**
   * How many times the pattern oscillates — higher zooms out (chunkier clouds).
   * Default: 12
   */
  frequency?: number;
  /**
   * Peak height of the noise [0–1]. Default: 0.9
   */
  amplitude?: number;
  /**
   * How quickly amplitude drops per octave [0–1].
   * High → smoother; low → spikier. Default: 0.9
   */
  persistence?: number;

  // --- Fog appearance ---
  /**
   * Tint color of the fog. Alpha is ignored — use fogAlpha instead.
   * Default: ex.Color.White
   */
  color?: ex.Color;
  /**
   * Overall max opacity of the fog [0–1]. Default: 0.6
   */
  fogAlpha?: number;

  // --- Scroll speed (pixels / second) ---
  scrollSpeedX?: number; // Default: 20
  scrollSpeedY?: number; // Default: 4

  /**
   * Pixel block size used when sampling the noise grid.
   * Lower = smoother but more expensive. Default: 4
   */
  resolution?: number;
};

// ---------------------------------------------------------------------------
// FogActor — add as a child Actor on your Fox or Room actor
// ---------------------------------------------------------------------------
export class FogActor extends ex.Actor {
  private _generator: PerlinGenerator;

  private _fogWidth: number;
  private _fogHeight: number;
  private _fogColor: ex.Color;
  private _fogAlpha: number;
  private _scrollSpeedX: number;
  private _scrollSpeedY: number;
  private _resolution: number;

  private _scrollOffsetX = 0;
  private _scrollOffsetY = 0;

  /** Reusable pixel buffer — allocated once on first paint, reused every frame */
  private _imageData: ImageData | null = null;

  private _excaliburCanvas: ex.Canvas;

  constructor(options: FogActorOptions) {
    const {
      fogWidth,
      fogHeight,
      offset = ex.Vector.Zero,
      seed,
      octaves = 3,
      frequency = 12,
      amplitude = 0.9,
      persistence = 0.9,
      color = ex.Color.White,
      fogAlpha = 0.6,
      scrollSpeedX = 20,
      scrollSpeedY = 4,
      resolution = 4,
      ...actorArgs
    } = options;

    super({
      anchor: ex.Vector.Zero,
      z: actorArgs.z ?? 10,
      pos: offset,
      ...actorArgs,
    });

    this._fogWidth = fogWidth;
    this._fogHeight = fogHeight;
    this._fogColor = color;
    this._fogAlpha = fogAlpha;
    this._scrollSpeedX = scrollSpeedX;
    this._scrollSpeedY = scrollSpeedY;
    this._resolution = resolution;

    // PerlinGenerator — note the plugin spells it "persistance" (one 'e')
    this._generator = new PerlinGenerator({
      seed: seed ?? Math.floor(Math.random() * 65536),
      octaves,
      frequency,
      amplitude,
      persistance: persistence,
    });

    // ex.Canvas with cache:false → draw() is called every frame automatically
    this._excaliburCanvas = new ex.Canvas({
      width: fogWidth,
      height: fogHeight,
      cache: false,
      draw: (ctx: CanvasRenderingContext2D) => {
        this._paintFog(ctx);
      },
    });

    this.graphics.use(this._excaliburCanvas);
  }

  // -------------------------------------------------------------------------
  // Paint the fog into the canvas context each frame
  // -------------------------------------------------------------------------
  private _paintFog(ctx: CanvasRenderingContext2D): void {
    const w = this._fogWidth;
    const h = this._fogHeight;
    const res = this._resolution;

    // Allocate once, reuse forever — avoids GC pressure each frame
    if (!this._imageData) {
      this._imageData = ctx.createImageData(w, h);
    }
    const data = this._imageData.data;

    const cr = (this._fogColor.r * 255) | 0;
    const cg = (this._fogColor.g * 255) | 0;
    const cb = (this._fogColor.b * 255) | 0;

    const cols = Math.ceil(w / res) + 1;
    const rows = Math.ceil(h / res) + 1;

    // Sample the noise at grid intervals, stamp each sample as a res×res
    // block into the pixel buffer, then flush with a single putImageData.
    // This replaces hundreds of fillStyle + fillRect calls per frame.
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const nx = ((col * res + this._scrollOffsetX) % w) / w;
        const ny = ((row * res + this._scrollOffsetY) % h) / h;

        const value = this._generator.noise(nx, ny);
        const a = (Math.max(0, (value - 0.3) / 0.7) * this._fogAlpha * 255) | 0;

        // Clamp block edges to canvas bounds
        const px0 = col * res;
        const py0 = row * res;
        const px1 = Math.min(px0 + res, w);
        const py1 = Math.min(py0 + res, h);

        for (let py = py0; py < py1; py++) {
          const rowBase = py * w;
          for (let px = px0; px < px1; px++) {
            const i = (rowBase + px) << 2; // index = (py * w + px) * 4
            data[i] = cr;
            data[i + 1] = cg;
            data[i + 2] = cb;
            data[i + 3] = a;
          }
        }
      }
    }

    // Single draw call to flush the whole buffer
    ctx.putImageData(this._imageData, 0, 0);
  }

  // -------------------------------------------------------------------------
  // Advance scroll offsets each frame
  // -------------------------------------------------------------------------
  onPreUpdate(_engine: ex.Engine, delta: number): void {
    const dt = delta / 1000;
    this._scrollOffsetX = (this._scrollOffsetX + this._scrollSpeedX * dt) % this._fogWidth;
    this._scrollOffsetY = (this._scrollOffsetY + this._scrollSpeedY * dt) % this._fogHeight;
    // ex.Canvas cache:false will automatically re-invoke draw() this frame
  }
}
