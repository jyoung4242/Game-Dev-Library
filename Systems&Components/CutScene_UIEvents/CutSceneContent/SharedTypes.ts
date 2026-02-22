// SharedTypes.ts
import { Entity, Engine } from "excalibur";
import { CutSceneStartEvent, CutSceneEndEvent, CutSceneStepEvent, CutsceneContext } from "../CutScene";

// Base interface for all cutscene actions
export interface ICutsceneAction {
  execute(entity: Entity, engine: Engine): Generator<any, void, unknown>;
}

export type CutSceneEvents = {
  onCutSceneStart: CutSceneStartEvent;
  onCutSceneEnd: CutSceneEndEvent;
  onCutSceneStepEvent: CutSceneStepEvent;
};

// Base class for cutscene actions with common functionality
export abstract class CutsceneAction implements ICutsceneAction {
  protected context: CutsceneContext = {};

  abstract execute(entity: Entity, engine: Engine): Generator<any, void, unknown>;

  // Helper to emit step events
  protected emitStepEvent(entity: Entity, stepName: string, stepData?: any): void {
    // You can emit step events here if needed
    console.log(`Step: ${stepName}`, stepData);
  }
}
