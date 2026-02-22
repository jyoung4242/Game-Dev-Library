import { Entity, Engine, Vector, Actor } from "excalibur";
import { CutsceneAction } from "./SharedTypes";

export class BlinkAction extends CutsceneAction {
  isDone: boolean = false;
  _elapsedTime: number = 0;
  _lastBlinkTime: number = 0;
  _isVisible: boolean = true;
  _duration: number = 0;
  _blinkInterval: number = 0;

  constructor(targetEntity: Actor, blinkInterval: number, duration: number) {
    super();
    this._blinkInterval = blinkInterval; // Time between blinks in milliseconds
    this._duration = duration;
  }

  isCompleted(): boolean {
    return this.isDone;
  }

  *execute(entity: Entity, engine: Engine): Generator<any, void, unknown> {
    const startTime = Date.now();
    this._elapsedTime = 0;
    this._lastBlinkTime = 0;
    this._isVisible = true;

    while (!this.isDone) {
      this._elapsedTime = Date.now() - startTime;

      // Check if it's time to blink (toggle visibility)
      if (this._elapsedTime - this._lastBlinkTime >= this._blinkInterval) {
        this._isVisible = !this._isVisible;
        (entity as Actor).graphics.isVisible = this._isVisible;
        this._lastBlinkTime = this._elapsedTime;
      }

      // Check if duration is complete
      if (this._elapsedTime >= this._duration) {
        this.isDone = true;
        (entity as Actor).graphics.isVisible = true; // Ensure visible when done
      }

      yield;
    }
  }
}
