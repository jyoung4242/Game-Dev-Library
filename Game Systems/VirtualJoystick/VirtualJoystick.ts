/**
 * VirtualJoystick.ts
 * A production-ready virtual joystick module for ExcaliburJS.
 * Supports floating/fixed modes, multitouch, snapping, and a clean output API.
 */

import { ScreenElement, Vector, Color, Canvas, Engine, PointerEvent, EventEmitter, ActorArgs } from "excalibur";

// ---------------------------------------------------------------------------
// Types & Configuration
// ---------------------------------------------------------------------------

export type JoystickMode = "floating" | "fixed";
export type SnapMode = "none" | "4-way" | "8-way";
export type SnapStrength = "preserve" | "full";
export type JoystickState = "idle" | "engaged" | "dragging" | "released";

export const JoystickMode = {
  Floating: "floating",
  Fixed: "fixed",
} as const;

export const SnapMode = {
  None: "none",
  FourWay: "4-way",
  EightWay: "8-way",
} as const;

export const SnapStrength = {
  Preserve: "preserve",
  Full: "full",
} as const;

export const JoystickState = {
  Idle: "idle",
  Engaged: "engaged",
  Dragging: "dragging",
  Released: "released",
} as const;

export interface VirtualJoystickConfig {
  /** 'floating' – base spawns at touch; 'fixed' – base stays put */
  mode: JoystickMode;

  /** The ScreenElement whose bounds define the active touch region */
  region: ScreenElement;

  // Movement
  maxRadius: number;
  deadZoneRadius: number;

  // Snapping
  snapMode?: SnapMode;
  snapStrength?: SnapStrength;

  // Fixed-mode only
  basePosition?: Vector;
  /** Touch must start within this distance of basePosition */
  activationRadius?: number;

  // Visuals
  baseRadius?: number;
  handleRadius?: number;
  color?: Color;
  opacity?: number;

  // Behaviour
  /** Reset handle to center on pointer release (default: true) */
  recenterOnRelease?: boolean;

  /**
   * Optional custom draw callback – receives the Canvas 2D context
   * plus current joystick state. When provided the default draw is skipped.
   */
  customDraw?: (ctx: CanvasRenderingContext2D, state: JoystickDrawState) => void;
}

/** Snapshot passed to customDraw each frame */
export interface JoystickDrawState {
  basePos: Vector; // screen-space base center
  handlePos: Vector; // screen-space handle center
  baseRadius: number;
  handleRadius: number;
  color: Color;
  opacity: number;
  active: boolean;
}

/** Joystick-specific events emitted via Excalibur's EventEmitter */
export interface JoystickEvents {
  joystickstart: JoystickEventData;
  joystickmove: JoystickEventData;
  joystickend: JoystickEventData;
}

export interface JoystickEventData {
  vector: Vector;
  magnitude: number;
  angle: number;
}

// ---------------------------------------------------------------------------
// Snap helpers
// ---------------------------------------------------------------------------

const SNAP_ANGLES_4 = [0, Math.PI / 2, Math.PI, (3 * Math.PI) / 2];
const SNAP_ANGLES_8 = [
  0,
  Math.PI / 4,
  Math.PI / 2,
  (3 * Math.PI) / 4,
  Math.PI,
  (5 * Math.PI) / 4,
  (3 * Math.PI) / 2,
  (7 * Math.PI) / 4,
];

function nearestAngle(angle: number, candidates: number[]): number {
  // Normalise to [0, 2π)
  const a = ((angle % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
  let best = candidates[0];
  let bestDiff = Math.abs(a - candidates[0]);
  for (let i = 1; i < candidates.length; i++) {
    const diff = Math.abs(a - candidates[i]);
    if (diff < bestDiff) {
      bestDiff = diff;
      best = candidates[i];
    }
  }
  return best;
}

function applySnap(vec: Vector, mode: SnapMode, strength: SnapStrength, mag: number): Vector {
  if (mode === "none" || mag === 0) return vec;

  const candidates = mode === "4-way" ? SNAP_ANGLES_4 : SNAP_ANGLES_8;
  const angle = nearestAngle(Math.atan2(vec.y, vec.x), candidates);
  const finalMag = strength === "full" ? 1 : mag;

  // Write into vec to avoid allocation (caller passes a reusable instance)
  vec.x = Math.cos(angle) * finalMag;
  vec.y = Math.sin(angle) * finalMag;
  return vec;
}

// ---------------------------------------------------------------------------
// VirtualJoystick
// ---------------------------------------------------------------------------

export class VirtualJoystick extends ScreenElement {
  // Public event emitter (Excalibur style)
  public joyStickEvents: EventEmitter<JoystickEvents> = new EventEmitter<JoystickEvents>();

  // ── Config ──────────────────────────────────────────────────────────────
  private _cfg: Required<VirtualJoystickConfig>;

  // ── State machine ────────────────────────────────────────────────────────
  private _state: JoystickState = "idle";

  // ── Touch tracking ───────────────────────────────────────────────────────
  /** The pointerId this joystick has captured; -1 = none */
  private _capturedPointerId = -1;

  // ── Positions (screen space, reused each frame) ──────────────────────────
  private _basePos: Vector; // where the ring is rendered
  private _handlePos: Vector; // current handle position

  // ── Output vector (reused, never re-allocated) ───────────────────────────
  private _outputVec: Vector = Vector.Zero.clone();
  private _rawVec: Vector = Vector.Zero.clone(); // scratch for math

  // ── Canvas for custom rendering ──────────────────────────────────────────
  private _canvas!: Canvas;

  constructor(config: VirtualJoystickConfig) {
    // ScreenElement needs width/height taken from region bounds
    const region = config.region;
    const superOpts: ActorArgs = {
      x: region.pos.x,
      y: region.pos.y,
      width: region.width,
      height: region.height,
      z: 999, // render above gameplay
    };
    super(superOpts);

    config.region.z = 1000;

    // Fill required fields with defaults
    this._cfg = {
      mode: config.mode,
      region: config.region,
      maxRadius: config.maxRadius,
      deadZoneRadius: config.deadZoneRadius,
      snapMode: config.snapMode ?? "none",
      snapStrength: config.snapStrength ?? "preserve",
      basePosition: config.basePosition ?? Vector.Zero.clone(),
      activationRadius: config.activationRadius ?? config.maxRadius * 1.5,
      baseRadius: config.baseRadius ?? config.maxRadius,
      handleRadius: config.handleRadius ?? config.maxRadius * 0.4,
      color: config.color ?? Color.fromRGB(255, 255, 255, 0.5),
      opacity: config.opacity ?? 0.6,
      recenterOnRelease: config.recenterOnRelease ?? true,
      customDraw: config.customDraw ?? null!,
    };

    // Initial base position: fixed uses config value; floating starts offscreen
    this._basePos = this._cfg.mode === "fixed" ? this._cfg.basePosition.clone() : new Vector(-9999, -9999);

    this._handlePos = this._basePos.clone();
  }

  // ---------------------------------------------------------------------------
  // Lifecycle – onInitialize
  // ---------------------------------------------------------------------------

  onInitialize(engine: Engine): void {
    // Create an Excalibur Canvas graphic sized to the region
    this._canvas = new Canvas({
      width: this._cfg.region.width,
      height: this._cfg.region.height,
      draw: ctx => this._draw(ctx),
    });
    this.graphics.use(this._canvas);

    // Wire up pointer events on the region element
    this._cfg.region.on("pointerdown", (evt: PointerEvent) => {
      this._onPointerDown(evt);
    });
    engine.input.pointers.on("move", (evt: PointerEvent) => this._onPointerMove(evt));
    engine.input.pointers.on("up", (evt: PointerEvent) => this._onPointerUp(evt));
    // engine.input.pointers.on("cancel", (evt: PointerEvent) => this._onPointerUp(evt));
  }

  // ---------------------------------------------------------------------------
  // Input Handlers
  // ---------------------------------------------------------------------------

  private _onPointerDown(evt: PointerEvent): void {
    // Ignore if already tracking a pointer
    if (this._capturedPointerId !== -1) return;

    const screenPos = evt.screenPos;

    if (this._cfg.mode === "fixed") {
      // Must be within activationRadius of basePosition
      const dist = screenPos.distance(this._cfg.basePosition);
      if (dist > this._cfg.activationRadius) return;
      // Base stays fixed; only handle moves
      this._basePos.setTo(this._cfg.basePosition.x, this._cfg.basePosition.y);
    } else {
      // Floating: base spawns at touch point (already verified inside region by Excalibur)
      this._basePos.setTo(screenPos.x, screenPos.y);
    }

    this._capturedPointerId = evt.pointerId;
    this._handlePos.setTo(this._basePos.x, this._basePos.y);
    this._setOutputZero();
    this._state = "engaged";

    this._emitEvent("joystickstart");
    this._canvas.flagDirty();
  }

  private _onPointerMove(evt: PointerEvent): void {
    if (evt.pointerId !== this._capturedPointerId) return;
    if (this._state === "idle" || this._state === "released") return;

    const screenPos = evt.screenPos;

    // Raw delta from base
    this._rawVec.x = screenPos.x - this._basePos.x;
    this._rawVec.y = screenPos.y - this._basePos.y;

    const rawMag = this._rawVec.magnitude;

    // Clamp handle to maxRadius
    if (rawMag > this._cfg.maxRadius) {
      const scale = this._cfg.maxRadius / rawMag;
      this._rawVec.x *= scale;
      this._rawVec.y *= scale;
    }

    // Update handle render position
    this._handlePos.setTo(this._basePos.x + this._rawVec.x, this._basePos.y + this._rawVec.y);

    // Compute normalised magnitude (0–1)
    const clampedMag = Math.min(rawMag, this._cfg.maxRadius);
    const normMag = clampedMag / this._cfg.maxRadius;

    // Deadzone check
    if (clampedMag < this._cfg.deadZoneRadius) {
      this._setOutputZero();
    } else {
      // Normalise to [-1, 1]
      this._outputVec.x = this._rawVec.x / this._cfg.maxRadius;
      this._outputVec.y = -this._rawVec.y / this._cfg.maxRadius;

      // Apply snapping (mutates _outputVec in place)
      applySnap(this._outputVec, this._cfg.snapMode, this._cfg.snapStrength, normMag);
    }

    this._state = "dragging";
    this._emitEvent("joystickmove");
    this._canvas.flagDirty();
  }

  private _onPointerUp(evt: PointerEvent): void {
    if (evt.pointerId !== this._capturedPointerId) return;

    this._capturedPointerId = -1;
    this._state = "released";

    if (this._cfg.recenterOnRelease) {
      this._handlePos.setTo(this._basePos.x, this._basePos.y);
    }

    // Floating: hide base until next touch
    if (this._cfg.mode === "floating") {
      this._basePos.setTo(-9999, -9999);
      this._handlePos.setTo(-9999, -9999);
    }

    this._setOutputZero();
    this._emitEvent("joystickend");

    // Back to idle immediately (released is a transient state)
    this._state = "idle";
    this._canvas.flagDirty();
  }

  // ---------------------------------------------------------------------------
  // Output API
  // ---------------------------------------------------------------------------

  /** Primary output: normalised vector [-1, 1] on each axis */
  getVector(): Vector {
    return this._outputVec;
  }

  /** Derived: scalar magnitude [0, 1] */
  getMagnitude(): number {
    return this._outputVec.magnitude;
  }

  /** Derived: angle in radians (0 = right, clockwise positive) */
  getAngle(): number {
    return Math.atan2(this._outputVec.y, this._outputVec.x);
  }

  /** Current state machine state */
  getState(): JoystickState {
    return this._state;
  }

  // ---------------------------------------------------------------------------
  // Rendering
  // ---------------------------------------------------------------------------

  private _draw(ctx: CanvasRenderingContext2D): void {
    const active = this._state !== "idle";

    // Custom draw override
    if (this._cfg.customDraw) {
      this._cfg.customDraw(ctx, {
        basePos: this._basePos,
        handlePos: this._handlePos,
        baseRadius: this._cfg.baseRadius,
        handleRadius: this._cfg.handleRadius,
        color: this._cfg.color,
        opacity: this._cfg.opacity,
        active,
      });
      return;
    }

    // Skip rendering if base is offscreen (hidden floating joystick)
    if (this._basePos.x < -999) return;

    // Fixed joystick always shows; floating only when active
    if (this._cfg.mode === "floating" && !active) return;

    const { baseRadius, handleRadius, color, opacity } = this._cfg;

    // Translate: Canvas origin is region top-left; positions are in screen space.
    // We need to offset by the region's position.
    const ox = this._cfg.region.pos.x;
    const oy = this._cfg.region.pos.y;
    const bx = this._basePos.x - ox;
    const by = this._basePos.y - oy;
    const hx = this._handlePos.x - ox;
    const hy = this._handlePos.y - oy;

    ctx.save();
    ctx.globalAlpha = opacity;

    // Base ring
    ctx.beginPath();
    ctx.arc(bx, by, baseRadius, 0, Math.PI * 2);
    ctx.strokeStyle = color.toRGBA();
    ctx.lineWidth = 3;
    ctx.stroke();

    // Outer fill (subtle)
    ctx.fillStyle = color.clone().darken(0.4).toRGBA();
    ctx.fill();

    // Handle circle
    ctx.beginPath();
    ctx.arc(hx, hy, handleRadius, 0, Math.PI * 2);
    ctx.fillStyle = color.toRGBA();
    ctx.fill();

    ctx.restore();
  }

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------

  private _setOutputZero(): void {
    this._outputVec.x = 0;
    this._outputVec.y = 0;
  }

  private _emitEvent(name: keyof JoystickEvents): void {
    const data: JoystickEventData = {
      vector: this._outputVec,
      magnitude: this.getMagnitude(),
      angle: this.getAngle(),
    };
    this.joyStickEvents.emit(name as string, data);
  }
}
