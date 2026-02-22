import { Entity, Engine, Vector, Actor } from "excalibur";
import { CutsceneAction } from "../CutSceneContent/SharedTypes";
import { LetterBox } from "../../Actors/LetterBox";

export class ShowLetterBox extends CutsceneAction {
  isDone: boolean = false;
  _elapsedTime: number = 0;
  _frameCount: number = 0;
  letterBox: Actor;
  widthCounter: number = 1;

  constructor() {
    super();
    this.letterBox = new LetterBox();
  }

  isCompleted(): boolean {
    return (this.letterBox as LetterBox).rectangle.height >= 40;
  }

  *execute(entity: Entity, engine: Engine): Generator<any, void, unknown> {
    const startTime = Date.now();
    this._elapsedTime = 0;
    this._frameCount = 0;
    engine.currentScene.add(this.letterBox);

    while (true) {
      this._frameCount++;

      // Check if we've reached the destination
      if (this.isCompleted()) {
        return; // End the generator
      }

      // add letterbox to scene
      engine.currentScene.add(this.letterBox);

      // When complete, set state for isComplete to return true
      this._elapsedTime = Date.now() - startTime;
      yield;
    }
  }
}

export class HideLetterBox extends CutsceneAction {
  isDone: boolean = false;
  _elapsedTime: number = 0;
  _frameCount: number = 0;
  letterBox: Actor | null = null;
  widthCounter: number = 1;

  constructor() {
    super();
    this.letterBox = new LetterBox();
  }

  isCompleted(): boolean {
    return (this.letterBox as LetterBox).rectangle.height <= 0;
  }

  *execute(entity: Entity, engine: Engine): Generator<any, void, unknown> {
    this.letterBox = engine.currentScene.entities.find(e => e.name === "LetterBox") as LetterBox | null;
    if (!this.letterBox) return;
    const startTime = Date.now();
    this._elapsedTime = 0;
    this._frameCount = 0;
    engine.currentScene.add(this.letterBox);

    while (true) {
      this._frameCount++;

      // Check if we've reached the destination
      if (this.isCompleted()) {
        return; // End the generator
      }

      (this.letterBox as LetterBox).fadeOut(engine);

      // When complete, set state for isComplete to return true
      this._elapsedTime = Date.now() - startTime;
      this.isDone = true;
      yield;
    }
  }
}
