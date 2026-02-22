import { Entity, Engine } from "excalibur";
import { CutsceneAction } from "../CutSceneContent/SharedTypes";

/* export class LogAction extends CutsceneAction {
  logArgs: any[] = [];
  constructor(...args: any[]) {
    super();
    this.logArgs = args;
  }
  *execute(entity: Entity, engine: Engine): Generator<any, void, unknown> {
    console.log(...this.logArgs);
  }
} */

export class LogAction extends CutsceneAction {
  isDone: boolean = false;
  _elapsedTime: number = 0;
  _frameCount: number = 0;
  _args: any[] = [];

  constructor(...args: any[]) {
    super();
    this._args = args;
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

      console.log(...this._args);

      // When complete, set state for isComplete to return true
      this._elapsedTime = Date.now() - startTime;
      this.isDone = true;
      yield;
    }
  }
}
