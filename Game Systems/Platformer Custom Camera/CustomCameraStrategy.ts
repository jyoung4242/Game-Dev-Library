// import { Actor, BoundingBox, Camera, CameraStrategy, Engine, Vector } from "excalibur";

// export class LookAheadCameraStrategy implements CameraStrategy<Vector> {
//   target: Vector = Vector.Zero;
//   constructor(
//     private actor: Actor,
//     private lookAheadDistance: number = 150,
//     private lerpSpeed: number = 0.08,
//   ) {}

//   private currentOffset = 0;

//   public action(target: Vector, camera: Camera, _engine: Engine, _delta: number) {
//     // Start from camera's current focus
//     const currentFocus = camera.getFocus();

//     // Determine target offset based on movement
//     let targetOffset = 0;
//     if (this.actor.vel.x > 10) {
//       targetOffset = this.lookAheadDistance;
//     } else if (this.actor.vel.x < -10) {
//       targetOffset = -this.lookAheadDistance;
//     }

//     // Smooth transition
//     this.currentOffset += (targetOffset - this.currentOffset) * this.lerpSpeed;

//     // Only modify X, preserve Y from current focus
//     target.x = this.actor.pos.x + this.currentOffset;
//     target.y = currentFocus.y;

//     return target;
//   }
// }

import { Actor, Camera, CameraStrategy, Engine, Vector } from "excalibur";

/**
 * A custom ExcaliburJS camera strategy that provides smooth "look-ahead" functionality
 * for side-scrolling platformers. The camera shifts horizontally in the direction of
 * player movement, giving players visual space to see what's ahead.
 *
 * Features:
 * - Horizontal-only positioning (composable with other strategies)
 * - Smooth transitions using linear interpolation
 * - Configurable delay before returning to center
 * - Velocity-based direction detection
 *
 * @example
 * ```typescript
 * // Basic usage
 * engine.currentScene.camera.zoom = 2.7;
 * engine.currentScene.camera.strategy.lockToActorAxis(player, Axis.Y);
 * engine.currentScene.camera.addStrategy(
 *   new LookAheadCameraStrategy(player, 150, 0.08, 800)
 * );
 * ```
 */
export class LookAheadCameraStrategy implements CameraStrategy<Vector> {
  target: Vector = Vector.Zero;
  private currentOffset = 0;
  private timeSinceStopped = 0;
  private wasMoving = false;

  /**
   * Creates a new LookAheadCameraStrategy
   *
   * @param actor - The actor (typically the player) to follow
   * @param lookAheadDistance - How far ahead (in pixels) the camera looks when moving (default: 150)
   * @param lerpSpeed - Speed of camera transition, 0-1 range (default: 0.08, lower = smoother)
   * @param returnDelayMs - Delay in milliseconds before camera returns to center after stopping (default: 800)
   */
  constructor(
    private actor: Actor,
    private lookAheadDistance: number = 150,
    private lerpSpeed: number = 0.08,
    private returnDelayMs: number = 800,
  ) {}

  public action(target: Vector, camera: Camera, _engine: Engine, delta: number): Vector {
    // Start from camera's current focus to compose with other strategies
    const currentFocus = camera.getFocus();

    // Check if player is moving (velocity threshold of 10)
    const isMoving = Math.abs(this.actor.vel.x) > 10;

    // Track time since player stopped moving
    if (!isMoving && this.wasMoving) {
      // Just stopped - reset timer
      this.timeSinceStopped = 0;
    } else if (!isMoving) {
      // Still stopped - increment timer
      this.timeSinceStopped += delta;
    }

    this.wasMoving = isMoving;

    // Determine target offset based on movement state
    let targetOffset = 0;
    if (this.actor.vel.x > 10) {
      // Moving right - look ahead right
      targetOffset = this.lookAheadDistance;
    } else if (this.actor.vel.x < -10) {
      // Moving left - look ahead left
      targetOffset = -this.lookAheadDistance;
    } else if (this.timeSinceStopped < this.returnDelayMs) {
      // Stopped but within delay period - maintain current offset
      targetOffset = this.currentOffset;
    }
    // else: delay expired, targetOffset stays at 0 (center)

    // Smooth transition using linear interpolation
    this.currentOffset += (targetOffset - this.currentOffset) * this.lerpSpeed;

    // Only modify X axis, preserve Y from other strategies (like lockToActorAxis)
    target.x = this.actor.pos.x + this.currentOffset;
    target.y = currentFocus.y;

    return target;
  }
}
