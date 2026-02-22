// MoveTo.TS - for move cutscene actions
import { Entity, Engine, Vector, Actor, vec } from "excalibur";
import { CutsceneAction } from "../CutSceneContent/SharedTypes";

export class MoveToAction extends CutsceneAction {
  private _speed: number;
  private endingLocation: Vector;
  private frameCount: number = 0;
  private originalVelocity: Vector | null = null;

  constructor(position: Vector, speed: number) {
    super();
    this._speed = speed;
    this.endingLocation = position;
  }

  *execute(entity: Entity, engine: Engine): Generator<any, void, unknown> {
    const actor = entity as Actor;
    const startPos = actor.pos.clone();

    // Store the original velocity to restore it later
    this.originalVelocity = actor.vel.clone();

    console.log(`[MoveToAction] Starting movement from ${startPos} to ${this.endingLocation} at speed ${this._speed}`);

    this.emitStepEvent?.(entity, "MoveTo", {
      from: startPos,
      to: this.endingLocation,
      speed: this._speed,
    });

    while (true) {
      this.frameCount++;
      const currentPosition = actor.pos;
      const remainingDistance = currentPosition.distance(this.endingLocation);
      debugger;
      console.log(
        `[MoveToAction] Frame ${this.frameCount}: Position ${currentPosition}, Distance remaining: ${remainingDistance.toFixed(2)}`
      );

      // Check if we've reached the destination
      if (remainingDistance <= 1.0) {
        // Stop the actor and set exact position
        actor.vel = vec(0, 0);
        actor.pos = this.endingLocation;
        console.log(`[MoveToAction] Movement completed in ${this.frameCount} frames`);
        return; // End the generator
      }

      // Calculate movement direction
      const direction = this.endingLocation.sub(currentPosition).normalize();

      // Yield to get the elapsed time for this frame
      let elapsed: number | unknown = yield;

      if (typeof elapsed !== "number") {
        elapsed = 0;
      }

      console.log(`[MoveToAction] Frame ${this.frameCount}: Elapsed time: ${elapsed}ms`);

      const deltaTime = (elapsed as number) / 1000; // Convert to seconds
      const distanceThisFrame = this._speed * deltaTime;

      // Check if we would overshoot the target
      if (distanceThisFrame >= remainingDistance) {
        // We'll reach the target this frame, so calculate the exact velocity needed
        const exactVelocity = direction.scale(remainingDistance / deltaTime);
        actor.vel = exactVelocity;
      } else {
        // Set velocity to move at constant speed towards target
        const velocity = direction.scale(this._speed);
        actor.vel = velocity;
      }

      console.log(`[MoveToAction] Frame ${this.frameCount}: Setting velocity to ${actor.vel}, current position: ${actor.pos}`);
    }
  }
}
