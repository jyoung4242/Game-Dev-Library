import { Entity, Engine } from "excalibur";
import { CutsceneAction } from "..//CutSceneContent/SharedTypes";

export class WaitAction extends CutsceneAction {
  constructor(public duration: number) {
    super();
  }

  *execute(entity: Entity, engine: Engine): Generator<any, void, unknown> {
    // use a timeout for this yield
    yield new Promise(resolve => setTimeout(resolve, this.duration));
  }
}
