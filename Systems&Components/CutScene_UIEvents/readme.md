# CutScene System Documentation

A powerful, coroutine-based cutscene system for Excalibur.js games that allows you to create complex sequences of actions using a
fluent builder pattern.

## Overview

The CutScene system provides a way to create scripted sequences in your game using Excalibur's coroutine system. It supports both
sequential and parallel execution of actions, with built-in event handling and state management.

## Core Components

### CutSceneSystem

The main system that manages all active cutscenes in your game world.

```typescript
export class CutSceneSystem extends System {
  // Tracks active cutscenes
  activeCutscenes: Set<Entity> = new Set();

  // Global event emitter for cutscene events
  events: EventEmitter<CutSceneEvents> = new EventEmitter();
}
```

**Key Methods:**

- `isCutsceneActive(entity?: Entity)` - Check if cutscenes are running
- `stopAllCutscenes()` - Emergency stop for all active cutscenes

### CutSceneComponent

Add this component to any entity that needs to run cutscenes.

```typescript
export class CutSceneComponent extends Component {
  isPlaying: boolean = false;
  cutsceneName?: string = "CutScene";

  // Trigger a cutscene with a coroutine function
  triggerCutscene(coroutineFunction: (entity: Entity) => Generator<any, void, unknown>): void;
}
```

## Event System

The system emits three types of events:

### CutSceneStartEvent

Fired when a cutscene begins execution.

```typescript
{
  _target: Entity;
  cutsceneName?: string;
  startTime: number;
}
```

### CutSceneEndEvent

Fired when a cutscene completes or is interrupted.

```typescript
{
  _target: Entity;
  cutsceneName?: string;
  duration: number;
  completed: boolean;
}
```

### CutSceneStepEvent

Fired for individual action steps within a cutscene.

```typescript
{
  _target: Entity;
  stepName: string;
  stepIndex: number;
  totalSteps?: number;
  stepData?: any;
}
```

## Creating Actions

All cutscene actions implement the `ICutsceneAction` interface:

```typescript
export interface ICutsceneAction {
  execute(entity: Entity, engine: Engine): Generator<any, void, unknown>;
}
```

### Base CutsceneAction Class

Extend this class for common functionality:

```typescript
export abstract class CutsceneAction implements ICutsceneAction {
  protected context: CutsceneContext = {};

  abstract execute(entity: Entity, engine: Engine): Generator<any, void, unknown>;

  // Helper to emit step events
  protected emitStepEvent(entity: Entity, stepName: string, stepData?: any): void;
}
```

### Example Action Implementation

```typescript
export class MoveToAction extends CutsceneAction {
  constructor(
    private position: Vector,
    private speed: number,
  ) {
    super();
  }

  *execute(entity: Entity, engine: Engine): Generator<any, void, unknown> {
    const actor = entity as Actor;

    this.emitStepEvent(entity, "MoveTo", {
      from: actor.pos,
      to: this.position,
      speed: this.speed,
    });

    while (actor.pos.distance(this.position) > 1.0) {
      const direction = this.position.sub(actor.pos).normalize();
      const elapsed: number = yield; // Get frame time
      const deltaTime = elapsed / 1000;

      actor.vel = direction.scale(this.speed);

      // Check if we'll overshoot and adjust accordingly
      if (actor.vel.scale(deltaTime).size >= actor.pos.distance(this.position)) {
        actor.pos = this.position;
        actor.vel = vec(0, 0);
        break;
      }
    }
  }
}
```

## Built-in Actions

The system comes with several pre-built actions:

- **LogAction** - Console logging for debugging
- **WaitAction** - Pause execution for a duration
- **MoveToAction** - Move entity to a position
- **FollowPathAction** - Follow a path of waypoints
- **FaceDirection** - Change entity facing direction
- **BlinkAction** - Make entity blink/flash
- **ShowLetterBox/HideLetterBox** - Cinematic letterboxing
- **DialogAction** - Display dialog conversations

## Composition Actions

### ParallelAction

Execute multiple actions simultaneously:

```typescript
const parallel = new ParallelAction([new MoveToAction(vec(100, 100), 50), new BlinkAction(target, 0.5, 2000), new WaitAction(1000)]);
```

### SequenceAction

Execute actions one after another:

```typescript
const sequence = new SequenceAction([new MoveToAction(vec(50, 50), 50), new WaitAction(500), new MoveToAction(vec(100, 100), 50)]);
```

## CutsceneBuilder - Fluent API

The `CutsceneBuilder` provides a chainable API for easy cutscene creation:

```typescript
const cutscene = new CutsceneBuilder()
  .showLetterBox()
  .log("Starting cutscene...")
  .wait(1000)
  .moveTo(100, 100, 50)
  .faceDirection(hero, "up")
  .dialog(conversation)
  .parallel(new BlinkAction(hero, 0.5, 1000), new WaitAction(1000))
  .hideLetterBox()
  .build();

// Trigger the cutscene
cutSceneComponent.triggerCutscene(cutscene);
```

### Available Builder Methods

- `wait(duration: number)` - Pause for milliseconds
- `log(...args: any[])` - Console log (debugging)
- `moveTo(x: number, y: number, speed?: number)` - Move to position
- `followPath(target: Actor, path: PositionNode[], speed?: number)` - Follow waypoint path
- `faceDirection(target: Actor, direction: "up" | "down" | "left" | "right")` - Change facing
- `parallel(...actions: ICutsceneAction[])` - Execute actions in parallel
- `blink(target: Actor, speed: number, duration: number)` - Blink effect
- `showLetterBox()` / `hideLetterBox()` - Cinematic bars
- `dialog(conversation: Conversation)` - Show dialog

## Usage Example

Here's how to integrate the cutscene system into your game:

### 1. Add System to Scene

```typescript
export class GameScene extends Scene {
  onInitialize(engine: Engine) {
    // Add the cutscene system
    this.world.add(new CutSceneSystem(this.world));
  }
}
```

### 2. Add Component to Entities

```typescript
export class Hero extends Actor {
  cs: CutSceneComponent;

  constructor() {
    super();
    this.cs = new CutSceneComponent();
    this.addComponent(this.cs);
  }
}
```

### 3. Create and Trigger Cutscenes

```typescript
// In your game logic (e.g., Hero's update method)
if (keys.includes("Space") && !this.cs.isPlaying) {
  const cutscene = new CutsceneBuilder()
    .showLetterBox()
    .log("Dialog Test")
    .wait(1000)
    .dialog(TestConversation)
    .hideLetterBox()
    .build();

  this.cs.triggerCutscene(cutscene);
}
```

## Advanced Features

### Context Sharing

Actions can share data through the context object:

```typescript
export abstract class CutsceneAction implements ICutsceneAction {
  protected context: CutsceneContext = {};

  // Access shared context data
  protected getContext(key: string): any {
    return this.context[key];
  }

  protected setContext(key: string, value: any): void {
    this.context[key] = value;
  }
}
```

### Event Handling

Listen to cutscene events for additional game logic:

```typescript
// In your system or component
cutSceneSystem.events.on("onCutSceneStart", event => {
  console.log(`Cutscene ${event.cutsceneName} started on entity`, event._target);
});

cutSceneSystem.events.on("onCutSceneEnd", event => {
  console.log(`Cutscene completed in ${event.duration}ms`, event.completed);
});
```

## Best Practices

1. **Error Handling**: Always wrap cutscene logic in try-catch blocks
2. **Performance**: Use `yield` appropriately to avoid blocking the game loop
3. **State Management**: Check `cs.isPlaying` before starting new cutscenes
4. **Debugging**: Use `LogAction` and step events for troubleshooting
5. **Cleanup**: The system automatically handles cleanup, but be mindful of references

## Extending the System

To create custom actions:

1. Extend `CutsceneAction`
2. Implement the `execute` generator method
3. Use `yield` for frame-based timing
4. Emit step events for debugging
5. Add builder methods if desired

```typescript
export class CustomAction extends CutsceneAction {
  *execute(entity: Entity, engine: Engine): Generator<any, void, unknown> {
    this.emitStepEvent(entity, "CustomAction", {
      /* data */
    });

    // Your custom logic here
    let elapsed: number = yield;

    // Continue yielding until complete
  }
}
```

The CutScene system provides a robust foundation for creating engaging scripted sequences in your Excalibur.js games. Its
coroutine-based approach ensures smooth execution without blocking gameplay, while the builder pattern makes complex cutscenes easy to
create and maintain.
