import { Entity, Engine, Vector, vec, Actor } from "excalibur";
import { CutsceneAction } from "../CutSceneContent/SharedTypes";
import { Hero } from "../../Actors/Hero";

export class FaceDirection extends CutsceneAction {
  isDone: boolean = false;
  _elapsedTime: number = 0;
  _frameCount: number = 0;
  _direction: "up" | "down" | "left" | "right";
  _target: Actor;

  constructor(target: Actor, direction: "up" | "down" | "left" | "right") {
    super();
    this._direction = direction;
    this._target = target;
  }

  isCompleted(): boolean {
    return this.isDone;
  }

  *execute(entity: Entity, engine: Engine): Generator<any, void, unknown> {
    const startTime = Date.now();
    this._elapsedTime = 0;
    this._frameCount = 0;

    while (true) {
      this._frameCount++;

      // Check if we've reached the destination
      if (this.isCompleted()) {
        return; // End the generator
      }
      console.log("FaceDirection", this._direction, this._target);

      this._target.vel = vec(0, 0);
      //@ts-ignore
      this._target.oldDirection = this._direction;

      // When complete, set state for isComplete to return true
      this._elapsedTime = Date.now() - startTime;
      this.isDone = true;
      yield;
    }
  }
}
