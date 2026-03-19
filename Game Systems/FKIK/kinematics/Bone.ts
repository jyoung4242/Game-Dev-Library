import * as ex from "excalibur";

/**
 * Joint rotation constraint, expressed in local space radians.
 * min/max are relative to the bone's rest orientation.
 */
export interface JointConstraint {
  min: number; // radians (e.g. -Math.PI / 2)
  max: number; // radians (e.g.  Math.PI / 2)
}

export interface BoneOptions {
  actor: ex.Actor;
  length: number;
  localRotation?: number;
  constraint?: JointConstraint;
  /** 0 = fully stiff (ignores IK), 1 = fully flexible (default) */
  stiffness?: number;
}

/**
 * Bone represents a single skeletal segment.
 *
 * Coordinate convention (Excalibur):
 *   +x = right, +y = down, angle 0 = pointing right
 *
 * A bone's "tip" (endPosition) sits at:
 *   end = start + vec(length, 0).rotate(worldRotation)
 */
export class Bone {
  actor: ex.Actor;
  parent?: Bone;
  children: Bone[] = [];

  private _length: number;

  /**
   * Bone length in pixels. Setting this automatically resizes the actor's
   * graphic so the visual stays in sync with the kinematics.
   */
  get length(): number {
    return this._length;
  }
  set length(value: number) {
    this._length = value;
    this._syncActorGraphic();
  }

  localRotation: number;
  worldRotation: number;

  startPosition: ex.Vector;
  endPosition: ex.Vector;

  constraint?: JointConstraint;
  stiffness: number; // [0, 1]

  constructor(options: BoneOptions) {
    this.actor = options.actor;
    this._length = options.length; // direct field — actor already sized by makeBone
    this.localRotation = options.localRotation ?? 0;
    this.worldRotation = options.localRotation ?? 0;
    this.startPosition = ex.vec(options.actor.pos.x, options.actor.pos.y);
    this.endPosition = this._computeEnd(this.startPosition, this.worldRotation);
    this.constraint = options.constraint;
    this.stiffness = options.stiffness ?? 1;
  }

  // ---------------------------------------------------------------------------
  // Hierarchy
  // ---------------------------------------------------------------------------

  addChild(child: Bone): void {
    child.parent = this;
    if (!this.children.includes(child)) {
      this.children.push(child);
    }
  }

  removeChild(child: Bone): void {
    const idx = this.children.indexOf(child);
    if (idx !== -1) {
      this.children.splice(idx, 1);
      child.parent = undefined;
    }
  }

  // ---------------------------------------------------------------------------
  // Transform
  // ---------------------------------------------------------------------------

  /**
   * Set the local rotation for this bone, respecting joint constraints.
   */
  setRotation(angle: number): void {
    if (this.constraint) {
      angle = ex.clamp(angle, this.constraint.min, this.constraint.max);
    }
    this.localRotation = angle;
  }

  /**
   * Recompute worldRotation, startPosition, and endPosition from parent state.
   * Does NOT recurse — call ForwardKinematicsSolver.solve() for the full tree.
   */
  updateWorldTransform(): void {
    if (this.parent) {
      // Child starts where parent ends
      this.startPosition = this.parent.endPosition.clone();
      // World rotation is cumulative
      this.worldRotation = this.parent.worldRotation + this.localRotation;
    } else {
      // Root bone: world == local
      this.startPosition = ex.vec(this.actor.pos.x, this.actor.pos.y);
      this.worldRotation = this.localRotation;
    }

    this.endPosition = this._computeEnd(this.startPosition, this.worldRotation);

    // Mirror final world transform back to the Excalibur actor
    this.actor.pos = this.startPosition.clone();
    this.actor.rotation = this.worldRotation;
  }

  /**
   * Convenience: returns the world-space tip of this bone.
   */
  getEndPosition(): ex.Vector {
    return this.endPosition.clone();
  }

  // ---------------------------------------------------------------------------
  // Internal helpers
  // ---------------------------------------------------------------------------

  /**
   * Resize the actor's Rectangle graphic to match the current _length.
   * Excalibur stores the visual as a Rectangle inside GraphicsComponent;
   * we replace it with a fresh one so the drawn segment stays correct.
   */
  private _syncActorGraphic(): void {
    if (!this.actor) return; // guard during construction
    const color = (this.actor.color ?? ex.Color.White).clone();
    const rect = new ex.Rectangle({
      width: this._length,
      height: 6,
      color,
    });
    this.actor.graphics.use(rect);
  }

  /**
   * Tip = start + rotate(length along +x, angle)
   */
  private _computeEnd(start: ex.Vector, angle: number): ex.Vector {
    return start.add(ex.vec(Math.cos(angle) * this._length, Math.sin(angle) * this._length));
  }
}

// Helper used in actor factory pattern — build a bone around a freshly-created actor
export function makeBone(
  scene: ex.Scene,
  options: Omit<BoneOptions, "actor"> & {
    color?: ex.Color;
    name?: string;
    pos?: ex.Vector;
  },
): Bone {
  const actor = new ex.Actor({
    name: options.name ?? "bone",
    pos: options.pos ?? ex.vec(0, 0),
    color: options.color ?? ex.Color.White,
    width: options.length,
    height: 6,
    anchor: ex.vec(0, 0.5),
  });
  scene.add(actor);
  return new Bone({ ...options, actor });
}
