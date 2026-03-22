import {
  Actor,
  CollisionType,
  Color,
  Component,
  Engine,
  Entity,
  ExcaliburGraphicsContext,
  Graphic,
  Random,
  Vector,
  Animation,
  RentalPool,
} from "excalibur";
import { PlayerAnimations } from "../Animations/boom";

const MIN_SIZE = 5;
const MAX_SIZE = 15;
const MIN_LIFETIME = 1000;
const MAX_LIFETIME = 2000;

const DestructionRNG = new Random();
const Boomcolors: Color[] = [
  Color.fromHex("#FFFFFF"),
  Color.fromHex("#F8F8FF"),
  Color.fromHex("#EAF6FF"),
  Color.fromHex("#D6ECFF"),
  Color.fromHex("#FFFACD"),
  Color.fromHex("#FFF176"),
  Color.fromHex("#FFE066"),
  Color.fromHex("#FFD54F"),
  Color.fromHex("#FFB347"),
  Color.fromHex("#FFA726"),
  Color.fromHex("#FF9800"),
  Color.fromHex("#FB8C00"),
  Color.fromHex("#F4511E"),
  Color.fromHex("#E53935"),
  Color.fromHex("#D32F2F"),
];

export class DestructiveComponent extends Component {
  minpieces: number;
  maxpieces: number;
  minforce: number;
  maxforce: number;
  rng: Random = new Random();

  constructor(minpieces: number, maxpieces: number, minforce: number, maxforce: number) {
    super();
    this.minpieces = minpieces;
    this.maxpieces = maxpieces;
    this.minforce = minforce;
    this.maxforce = maxforce;
  }

  onAdd(owner: Entity): void {
    this.owner = owner;
  }

  onRemove(previousOwner: Entity): void {}

  public explode() {
    if (!this.owner) return;
    if (!(this.owner instanceof Actor)) return;

    const origin = this.owner.pos.clone();
    //kill parent
    this.owner.kill();
    //spawn pieces
    let pieces = this.rng.integer(this.minpieces, this.maxpieces);

    for (let i = 0; i < pieces; i++) {
      //   const fragment = new Fragment({
      //     pos: origin,
      //     size: w / (pieces / 2),
      //     color: Color.fromHex("#943904"),
      //     index: i,
      //     total: pieces,
      //     lifetime: this.rng.integer(this.minforce, this.maxforce),
      //     angleJitter: 0.8,
      //     speedMin: 80,
      //     speedMax: 260,
      //     spinMax: 8,
      //     spinDamping: 0.97,
      //     inwardBias: 0,
      //   });

      const fragment = DestructionPool.rent();

      fragment.configure(origin, i, pieces);
      fragment.reset();
      this.owner.scene!.add(fragment);
    }

    //GPU particle burst?
  }
}

export interface FragmentOptions {
  pos: Vector;
  size: number; // radius of the fragment
  color: Color;
  index: number;
  total: number;
  lifetime: number; // ms before fade begins
  angleJitter: number; // radians of random spread (default: 0.8)
  speedMin: number; // (default: 80)
  speedMax: number; // (default: 260)
  spinMax: number; // max angular velocity rad/s (default: 8)
  spinDamping: number; // multiplier per second, 0–1 (default: 0.97)
  inwardBias: number; // 0–1 chance a fragment fires inward (default: 0)
}

export class Fragment extends Actor {
  private lifetime: number;
  private spinDamping: number;
  private tiks: number = 0;
  private fading: boolean = false;
  options: FragmentOptions;

  constructor({
    pos,
    size,
    color,
    index,
    total,
    lifetime,
    angleJitter = 0.8,
    speedMin = 80,
    speedMax = 260,
    spinMax = 8,
    spinDamping = 0.97,
    inwardBias = 0,
  }: FragmentOptions) {
    super({
      pos,
      radius: size,
      collisionType: CollisionType.Active,
    });
    this.options = { pos, size, color, index, total, lifetime, angleJitter, speedMin, speedMax, spinMax, spinDamping, inwardBias };
    this.body.useGravity = true;
    this.lifetime = lifetime;
    this.spinDamping = spinDamping;

    this.graphics.use(
      new FragmentPolygonGraphic({
        vertexCount: DestructionRNG.integer(3, 8),
        radius: size * 2,
        color,
        strokeColor: Color.Black,
        strokeWidth: 1,
      }),
    );

    const baseAngle = (index / total) * Math.PI * 2;
    const angle = baseAngle + (DestructionRNG.next() - 0.5) * angleJitter;
    const speed = DestructionRNG.floating(speedMin, speedMax);
    const direction = DestructionRNG.next() < inwardBias ? -1 : 1;

    this.vel = new Vector(Math.cos(angle) * speed * direction, Math.sin(angle) * speed * direction);

    this.angularVelocity = (DestructionRNG.next() - 0.5) * 2 * spinMax;
  }

  onPreUpdate(_engine: Engine, elapsed: number): void {
    this.tiks += elapsed;

    // Framerate-independent damping:
    // damping^(elapsed/16.67) normalises against 60fps so behaviour
    // is consistent regardless of frame time
    this.angularVelocity *= Math.pow(this.spinDamping, elapsed / 16.67);

    if (this.tiks > this.lifetime && !this.fading) {
      this.fading = true;
      this.actions
        .fade(0, 750)
        .toPromise()
        .then(() => {
          //   this.kill();
          this.scene!.remove(this);
          DestructionPool.return(this);
        });
    }
  }

  configure(pos: Vector, index: number, total: number) {
    this.pos = pos.clone();
    this.options.index = index;
    this.options.total = total;
    this.tiks = 0;
    this.fading = false;

    let { angleJitter, speedMin, speedMax, spinMax, inwardBias } = this.options;

    const baseAngle = (index / total) * Math.PI * 2;
    const angle = baseAngle + (DestructionRNG.next() - 0.5) * angleJitter;
    const speed = DestructionRNG.floating(speedMin, speedMax);
    const direction = DestructionRNG.next() < inwardBias ? -1 : 1;

    this.vel = new Vector(Math.cos(angle) * speed * direction, Math.sin(angle) * speed * direction);

    this.angularVelocity = (DestructionRNG.next() - 0.5) * 2 * spinMax;
  }

  reset() {
    this.tiks = 0;
    this.fading = false;
    this.graphics.opacity = 1;
  }
}

export interface FragmentPolygonOptions {
  vertexCount?: number;
  radius?: number;
  irregularity?: number;
  color?: Color;
  strokeColor?: Color;
  strokeWidth?: number;
}

export class FragmentPolygonGraphic extends Graphic {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private options: FragmentPolygonOptions;
  localPoints: Vector[];

  constructor(
    options: FragmentPolygonOptions = {
      vertexCount: 6,
      radius: 20,
      irregularity: 0.45,
      color: Color.Gray,
      strokeColor: Color.Black,
      strokeWidth: 1,
    },
  ) {
    super();
    this.options = options;
    // ── 3. Create offscreen canvas ─────────────────────────────────────────
    this.canvas = document.createElement("canvas");
    this.canvas.width = options.radius ?? 20;
    this.canvas.height = options.radius ?? 20;
    this.ctx = this.canvas.getContext("2d")!;
    this.localPoints = [];
    this.init();
  }

  init() {
    const { vertexCount = 6, radius = 20, irregularity = 0.45, color = Color.Gray, strokeColor, strokeWidth = 1 } = this.options;

    // ── 1. Generate polygon points centered at (0,0) ───────────────────────
    this.localPoints = randomConvexPolygon({ vertexCount, radius, irregularity });

    // ── 2. Compute bounding box + padding ─────────────────────────────────
    const xs = this.localPoints.map(p => p.x);
    const ys = this.localPoints.map(p => p.y);
    const minX = Math.min(...xs),
      maxX = Math.max(...xs);
    const minY = Math.min(...ys),
      maxY = Math.max(...ys);
    const pad = strokeColor ? Math.ceil(strokeWidth) + 1 : 1;

    const w = Math.ceil(maxX - minX) + pad * 2;
    const h = Math.ceil(maxY - minY) + pad * 2;

    // ── 4. Shift points into canvas space ──────────────────────────────────
    const offsetX = pad - minX;
    const offsetY = pad - minY;
    const canvasPoints = this.localPoints.map(p => new Vector(p.x + offsetX, p.y + offsetY));

    // ── 5. Draw ────────────────────────────────────────────────────────────
    this.ctx.beginPath();
    canvasPoints.forEach((p, i) => {
      i === 0 ? this.ctx.moveTo(p.x, p.y) : this.ctx.lineTo(p.x, p.y);
    });
    this.ctx.closePath();

    this.ctx.fillStyle = color.toRGBA();
    this.ctx.fill();

    if (strokeColor) {
      this.ctx.strokeStyle = strokeColor.toRGBA();
      this.ctx.lineWidth = strokeWidth;
      this.ctx.lineJoin = "round";
      this.ctx.stroke();
    }

    // Tell Excalibur the logical size
    this.width = w;
    this.height = h;
    this.opacity = 1;
  }

  configure(options: FragmentPolygonOptions) {
    this.options = { ...this.options, ...options };
    this.init();
    this.opacity = 1;
  }

  protected _drawImage(ctx: ExcaliburGraphicsContext, x: number, y: number): void {
    ctx.drawImage(this.canvas, x, y);
  }

  clone(): FragmentPolygonGraphic {
    return new FragmentPolygonGraphic(this.options);
  }
}

export interface ConvexPolygonOptions {
  vertexCount?: number; // number of vertices (default: 6)
  radius?: number; // circumradius in pixels (default: 20)
  irregularity?: number; // 0 = smooth, 1 = jagged (default: 0.45)
}

export function randomConvexPolygon({ vertexCount = 6, radius = 20, irregularity = 0.45 }: ConvexPolygonOptions = {}): Vector[] {
  const n = Math.max(3, vertexCount);

  // ── 1. Generate and sort random X and Y value chains ──────────────────────
  const xs = Array.from({ length: n }, () => DestructionRNG.next()).sort((a, b) => a - b);
  const ys = Array.from({ length: n }, () => DestructionRNG.next()).sort((a, b) => a - b);

  const xMin = xs[0],
    xMax = xs[n - 1];
  const yMin = ys[0],
    yMax = ys[n - 1];

  // ── 2. Build delta vectors from the two chains ─────────────────────────────
  const xVecs: number[] = [];
  const yVecs: number[] = [];
  let xLast = xMin,
    yLast = yMin;
  let xLastTop = xMin,
    yLastTop = yMin;

  for (let i = 1; i < n - 1; i++) {
    if (DestructionRNG.next() > 0.5) {
      xVecs.push(xs[i] - xLast);
      xLast = xs[i];
      yVecs.push(ys[i] - yLast);
      yLast = ys[i];
    } else {
      xVecs.push(xLastTop - xs[i]);
      xLastTop = xs[i];
      yVecs.push(yLastTop - ys[i]);
      yLastTop = ys[i];
    }
  }
  xVecs.push(xMax - xLast, xLastTop - xMax);
  yVecs.push(yMax - yLast, yLastTop - yMax);

  // ── 3. Shuffle Y components (Fisher-Yates) ─────────────────────────────────
  for (let i = yVecs.length - 1; i > 0; i--) {
    const j = Math.floor(DestructionRNG.next() * (i + 1));
    [yVecs[i], yVecs[j]] = [yVecs[j], yVecs[i]];
  }

  // ── 4. Pair X+Y, sort by angle — guarantees convex winding ────────────────
  const vecs = xVecs.map((x, i) => ({ x, y: yVecs[i] }));
  vecs.sort((a, b) => Math.atan2(a.y, a.x) - Math.atan2(b.y, b.x));

  // ── 5. Accumulate into points, then center at (0,0) ───────────────────────
  let px = 0,
    py = 0;
  let cx = 0,
    cy = 0;
  const pts = vecs.map(v => {
    px += v.x;
    py += v.y;
    cx += px;
    cy += py;
    return { x: px, y: py };
  });
  cx /= n;
  cy /= n;

  const centered = pts.map(p => ({ x: p.x - cx, y: p.y - cy }));

  // ── 6. Scale to desired radius ─────────────────────────────────────────────
  const maxDist = Math.max(...centered.map(p => Math.hypot(p.x, p.y)));

  // ── 7. Apply irregularity — nudge each vertex radially inward ─────────────
  return centered.map(p => {
    const angle = Math.atan2(p.y, p.x);
    const dist = Math.hypot(p.x, p.y) / maxDist;
    const r = dist * radius * (1 - irregularity * DestructionRNG.next() * 0.6);
    return new Vector(Math.cos(angle) * r, Math.sin(angle) * r);
  });
}

export class Boom extends Actor {
  public anim: Animation;
  boomColor: Color;

  constructor(pos: Vector) {
    super({
      pos,
      width: 64,
      height: 64,
    });
    this.anim = PlayerAnimations.Animation1.clone();
    this.boomColor = DestructionRNG.pickOne(Boomcolors);
    this.anim.events.on("end", () => {
      this.scene!.remove(this);
      BoomPool.return(this);
      //   this.kill();
    });
  }
  onInitialize(engine: Engine): void {
    this.graphics.use(this.anim);
    this.graphics.current!.tint = this.boomColor;
  }
  onAdd(engine: Engine): void {
    this.anim.reset();
  }
  reset(pos: Vector) {
    this.pos = pos;
    this.anim.reset();
  }
}

const DestructionBuilder = () => {
  const fragment = new Fragment({
    pos: Vector.Zero,
    size: DestructionRNG.integer(MIN_SIZE, MAX_SIZE),
    color: Color.fromHex("#943904"),
    index: 0,
    total: 1,
    lifetime: DestructionRNG.integer(MIN_LIFETIME, MAX_LIFETIME),
    angleJitter: 0.8,
    speedMin: 80,
    speedMax: 260,
    spinMax: 8,
    spinDamping: 0.97,
    inwardBias: 0,
  });
  return fragment;
};
const DestructionCleener = (used: Fragment) => {
  used.reset();
  return used;
};
const DestructionPool: RentalPool<Fragment> = new RentalPool<Fragment>(DestructionBuilder, DestructionCleener, 5000);

const BoomBuilder = () => {
  const boom = new Boom(Vector.Zero);
  return boom;
};
const BoomCleaner = (used: Boom) => {
  return used;
};
export const BoomPool: RentalPool<Boom> = new RentalPool<Boom>(BoomBuilder, BoomCleaner, 500);
