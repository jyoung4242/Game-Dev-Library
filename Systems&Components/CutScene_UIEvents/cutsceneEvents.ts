// CutSceneSystem.ts
import {
  EventEmitter,
  System,
  SystemType,
  GameEvent,
  Entity,
  Query,
  World,
  Component,
  coroutine,
  Engine,
  vec,
  Actor,
} from "excalibur";
import { LogAction } from "./CutSceneContent/Log";
import { WaitAction } from "./CutSceneContent/Wait";
import { CutsceneAction, CutSceneEvents, ICutsceneAction } from "./CutSceneContent/SharedTypes";
import { MoveToAction } from "./CutSceneContent/moveTo";
import { FollowPathAction } from "./CutSceneContent/FollowPath";
import { PositionNode } from "../Lib/Graph";
import { FaceDirection } from "./CutSceneContent/FaceDirection";
import { BlinkAction } from "./CutSceneContent/BlinkAction";
import { HideLetterBox, ShowLetterBox } from "./CutSceneContent/LetterBoxing";
import { DialogAction } from "./CutSceneContent/Dialog";
import { Conversation } from "../Lib/DialogSystem";

export class CutSceneSystem extends System {
  query: Query<typeof CutSceneComponent>;
  world: World;
  engine: Engine;
  systemType: SystemType = SystemType.Update;

  // Track active cutscenes
  activeCutscenes: Set<Entity> = new Set();

  // Global event emitter
  events: EventEmitter<CutSceneEvents> = new EventEmitter();

  constructor(world: World) {
    super();

    this.world = world;
    this.query = world.query([CutSceneComponent]);
    this.engine = world.scene.engine;
  }

  update(elapsed: number): void {
    if (!this.world.scene.engine) return;
    // Check for new cutscenes to start
    for (const entity of this.query.entities) {
      const cutSceneComponent = entity.get(CutSceneComponent);

      // Start new cutscene if one is queued
      if (cutSceneComponent.coroutineToStart && !this.activeCutscenes.has(entity)) {
        this.startCutscene(entity, cutSceneComponent);
      }
    }
  }

  private startCutscene = (entity: Entity, component: CutSceneComponent): void => {
    // Mark as active
    this.activeCutscenes.add(entity);
    component.isPlaying = true;
    component.startTime = Date.now();

    // Get the coroutine function
    const coroutineFunction = component.coroutineToStart!;
    const cutsceneName = component.cutsceneName;
    component.coroutineToStart = null;

    // Emit start event with enhanced data
    this.events.emit("onCutSceneStart", new CutSceneStartEvent(entity, cutsceneName));

    // Start the coroutine using Excalibur's coroutine API
    // Parameters: thisArg, engine, coroutineGenerator, options?

    const cutsceneCoroutine = coroutine(
      this, // thisArg - set "this" context for the generator
      this.world.scene.engine, // engine - pass the engine for running the coroutine
      function* (this: CutSceneSystem) {
        // coroutineGenerator - the actual generator function
        try {
          // Execute the user-defined coroutine
          yield* coroutineFunction(entity);
        } catch (error) {
          console.error("Cutscene error:", error);
        } finally {
          // Cleanup when coroutine completes
          this.completeCutscene(entity);
        }
      }.bind(this),
    );
  };

  private completeCutscene(entity: Entity): void {
    // Update component state
    const component = entity.get(CutSceneComponent);
    if (component) {
      component.isPlaying = false;
    }

    const stopTime = Date.now();
    const duration = stopTime - component.startTime;

    // Remove from active cutscenes
    this.activeCutscenes.delete(entity);

    // Emit completion event
    this.events.emit("onCutSceneEnd", new CutSceneEndEvent(entity, duration));
  }

  // Utility methods
  public isCutsceneActive(entity?: Entity): boolean {
    if (entity) {
      return this.activeCutscenes.has(entity);
    }
    return this.activeCutscenes.size > 0;
  }

  public stopAllCutscenes(): void {
    // Note: Excalibur's coroutine manager handles stopping individual coroutines
    // This would require keeping references to the coroutine instances
    for (const entity of this.activeCutscenes) {
      this.completeCutscene(entity);
    }
  }
}

// Cutscene Events
// Cutscene Events with useful data
export class CutSceneStartEvent extends GameEvent<Entity> {
  public readonly _target: Entity;
  public readonly cutsceneName?: string;
  public readonly startTime: number;

  constructor(target: Entity, cutsceneName?: string) {
    super();
    this._target = target;
    this.cutsceneName = cutsceneName;
    this.startTime = Date.now();
  }
}

export class CutSceneEndEvent extends GameEvent<Entity> {
  public readonly _target: Entity;
  public readonly cutsceneName?: string;
  public readonly duration: number;
  public readonly completed: boolean; // true if completed normally, false if interrupted

  constructor(target: Entity, duration: number, completed: boolean = true, cutsceneName?: string) {
    super();
    this._target = target;
    this.cutsceneName = cutsceneName;
    this.duration = duration;
    this.completed = completed;
  }
}

export class CutSceneStepEvent extends GameEvent<Entity> {
  public readonly _target: Entity;
  public readonly stepName: string;
  public readonly stepIndex: number;
  public readonly totalSteps?: number;
  public readonly stepData?: any;

  constructor(target: Entity, stepName: string, stepIndex: number, totalSteps?: number, stepData?: any) {
    super();
    this._target = target;
    this.stepName = stepName;
    this.stepIndex = stepIndex;
    this.totalSteps = totalSteps;
    this.stepData = stepData;
  }
}

export class CutSceneComponent extends Component {
  isPlaying: boolean = false;
  coroutineToStart: ((entity: Entity) => Generator<any, void, unknown>) | null = null;
  startTime: number = 0;
  cutsceneName?: string = "CutScene";

  constructor() {
    super();
  }

  // Method to trigger a cutscene with a coroutine function
  triggerCutscene(coroutineFunction: (entity: Entity) => Generator<any, void, unknown>): void {
    if (!this.isPlaying) {
      this.coroutineToStart = coroutineFunction;
    }
  }
}

// Context object for sharing data between actions
export interface CutsceneContext {
  [key: string]: any;
}

export class ParallelAction extends CutsceneAction {
  constructor(
    private actions: ICutsceneAction[],
    private stepName: string = "Parallel",
  ) {
    super();
  }

  *execute(entity: Entity, engine: Engine): Generator<any, void, unknown> {
    this.emitStepEvent(entity, this.stepName, { actionCount: this.actions.length });

    // Create generators for each action
    const generators = this.actions.map(action => action.execute(entity, engine));

    // Track completion status
    const completed = new Array(this.actions.length).fill(false);

    // Execute all actions in parallel
    while (!completed.every(c => c)) {
      for (let i = 0; i < generators.length; i++) {
        if (!completed[i]) {
          const result = generators[i].next();
          if (result.done) {
            completed[i] = true;
          }
        }
      }
      yield; // Yield control back to the engine each frame
    }
  }
}

// Sequence action for chaining multiple actions
export class SequenceAction extends CutsceneAction {
  constructor(
    private actions: ICutsceneAction[],
    private stepName: string = "Sequence",
  ) {
    super();
  }

  *execute(entity: Entity, engine: Engine): Generator<any, void, unknown> {
    this.emitStepEvent(entity, this.stepName, { actionCount: this.actions.length });

    for (const action of this.actions) {
      yield* action.execute(entity, engine);
    }
  }
}

// Example usage builder class for easier cutscene creation
export class CutsceneBuilder {
  private actions: ICutsceneAction[] = [];

  wait(duration: number): this {
    this.actions.push(new WaitAction(duration));
    return this;
  }

  log(...args: any[]): this {
    this.actions.push(new LogAction(args));
    return this;
  }
  moveTo(x: number, y: number, speed: number = 50): this {
    this.actions.push(new MoveToAction(vec(x, y), speed));
    return this;
  }

  followPath(target: Actor, path: PositionNode<number>[], speed: number = 50): this {
    this.actions.push(new FollowPathAction(target, path, speed));
    return this;
  }

  faceDirection(target: Actor, direction: "up" | "down" | "left" | "right"): this {
    this.actions.push(new FaceDirection(target, direction));
    return this;
  }

  parallel(...actions: ICutsceneAction[]): this {
    this.actions.push(new ParallelAction(actions));
    return this;
  }

  blink(target: Actor, speed: number, duration: number): this {
    this.actions.push(new BlinkAction(target, speed, duration));
    return this;
  }

  showLetterBox(): this {
    this.actions.push(new ShowLetterBox());
    return this;
  }

  hideLetterBox(): this {
    this.actions.push(new HideLetterBox());
    return this;
  }

  dialog(conversation: Conversation): this {
    this.actions.push(new DialogAction(conversation));
    return this;
  }

  /*
  moveBy(deltaX: number, deltaY: number, speed: number = 50): this {
    this.actions.push(new MoveByAction(deltaX, deltaY, speed));
    return this;
  }
 

  waitFor(condition: () => boolean, timeout?: number): this {
    this.actions.push(new WaitForConditionAction(condition, timeout));
    return this;
  }

  playAnimation(animationName: string, waitForComplete: boolean = true): this {
    this.actions.push(new PlayAnimationAction(animationName, waitForComplete));
    return this;
  }

  showDialog(text: string, speaker?: string, autoAdvance: boolean = false, duration?: number): this {
    this.actions.push(new ShowDialogAction(text, speaker, autoAdvance, duration));
    return this;
  }


  conditional(condition: () => boolean, trueAction: ICutsceneAction, falseAction?: ICutsceneAction): this {
    this.actions.push(new ConditionalAction(condition, trueAction, falseAction));
    return this;
  }

  callback(callback: (entity: Entity, engine: Engine) => void | Generator<any, void, unknown>): this {
    this.actions.push(new CallbackAction(callback));
    return this;
  } */

  build(): (entity: Entity) => Generator<any, void, unknown> {
    const sequence = new SequenceAction(this.actions);
    return function* (entity: Entity) {
      const engine = entity.scene?.engine;
      if (!engine) return;
      yield* sequence.execute(entity, engine);
    };
  }
}
