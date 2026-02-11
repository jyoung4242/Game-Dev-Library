import { Actor, BoundingBox, Camera, CameraStrategy, Engine, Vector } from "excalibur";

export class LookAheadCameraStrategy implements CameraStrategy<Vector> {
  target: Vector = Vector.Zero;
  constructor(
    private actor: Actor,
    private lookAheadDistance: number = 150,
    private lerpSpeed: number = 0.08,
  ) {}

  private currentOffset = 0;

  public action(target: Vector, camera: Camera, _engine: Engine, _delta: number) {
    // Start from camera's current focus
    const currentFocus = camera.getFocus();

    // Determine target offset based on movement
    let targetOffset = 0;
    if (this.actor.vel.x > 10) {
      targetOffset = this.lookAheadDistance;
    } else if (this.actor.vel.x < -10) {
      targetOffset = -this.lookAheadDistance;
    }

    // Smooth transition
    this.currentOffset += (targetOffset - this.currentOffset) * this.lerpSpeed;

    // Only modify X, preserve Y from current focus
    target.x = this.actor.pos.x + this.currentOffset;
    target.y = currentFocus.y;

    return target;
  }
}
