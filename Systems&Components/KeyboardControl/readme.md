# KeyboardControl Component for ExcaliburJS

A lightweight ExcaliburJS component that adds keyboard-based movement to any Actor. Supports WASD and Arrow Keys, tracks held
directions, and applies velocity every frame.

This module is ideal for prototypes, top-down movement, RPGs, and any game needing simple keyboard-driven motion.

## ✨ Features

Smooth continuous movement using held keys

Supports both Arrow Keys and WASD

Automatically plugs into the owning actor’s preupdate lifecycle

Clean directional state tracking (heldDirections array)

Fully customizable movement speed

Safe cleanup when removed from an entity

## 📦 Installation

Just import the component into your Excalibur project:

```ts
import { KeyboardControl } from "./KeyboardControl";
```

## 🚀 Usage

Attach the component to any Actor:

```ts
import { Actor } from "excalibur";
import { KeyboardControl } from "./KeyboardControl";

const player = new Actor({
  x: 100,
  y: 100,
  width: 32,
  height: 32,
});

player.addComponent(new KeyboardControl(150)); // movement speed (px/sec)
engine.add(player);
```

The component will automatically:

- Detect when the actor is added to a scene
- Read keyboard input via the scene’s engine
- Apply velocity to the actor each frame
- No additional setup is required.

## ⚙️ How It Works

KeyboardControl tracks four direction strings:

```ts
heldDirections: ["left", "right", "up", "down"];
```

Every frame it:

1. Reads the current keyboard state
2. Adds or removes directions from heldDirections
3. Applies velocity to the owning Actor based on the active directions

Velocity is set using the configured speed:

```ts
this.owner.vel.x = ±this.speed;
this.owner.vel.y = ±this.speed;
```

If no directions are held, velocity resets to zero.

## 🔧 API

`constructor(speed: number)`

- speed: A movement speed in pixels per second.

### Properties

| Property         | Type             | Description                |
| ---------------- | ---------------- | -------------------------- |
| `heldDirections` | `string[]`       | Active movement directions |
| `speed`          | `number`         | Movement speed             |
| `engine`         | `Engine \| null` | Automatically set on init  |

### Lifecycle Methods

- `init(owner: Actor)` Called when component initializes; retrieves engine reference.
- `onAdd(owner: Entity)` Subscribes to preupdate for per-frame movement handling.
- `onRemove(owner: Entity)` Cleans up listeners and stops movement.
- `update()` Internal per-frame logic that reads input and applies velocity.

## 🧹 Cleanup

If the component is removed:

`owner.removeComponent(KeyboardControl);`

It will:

- Unsubscribe from preupdate
- Reset heldDirections
- Stop actor movement

## 📄 License

MIT — free to use in commercial or personal projects.
