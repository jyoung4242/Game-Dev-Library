# InputMapSystem

## A Context-Driven Input Mapping Layer for ExcaliburJS

InputMapSystem is a flexible, event-driven input management layer for ExcaliburJS that unifies keyboard, gamepad, and pointer input
under a clean, context-based API.

It allows you to:

- Define input contexts (gameplay, menus, inventory, cutscenes, etc.)
- Map keyboard keys, gamepad buttons/axes, and pointer events
- Cleanly switch contexts at runtime
- Choose between event-driven and per-frame polling
- Work with 8-directional analog stick output
- Subscribe to all input through a single EventEmitter

Designed to completely decouple your input logic from gameplay systems through standard publish/subscribe patterns.

## ✨ Features

- ✔️ Keyboard press / release / hold events
- ✔️ Gamepad events: axes, directional sticks, connection/disconnection, buttons
- ✔️ Pointer input: up, down, move, cancel, wheel
- ✔️ Polling & event-driven modes for gamepad
- ✔️ Multiple contexts with dynamic switching
- ✔️ 8-way stick direction detection (with deadzone & threshold)
- ✔️ Lightweight + Excalibur-native (EventEmitter, Engine, PointerEvent, etc.)

## 📦 Installation

Add this module to your project (production or tooling):

```ts
import { InputMapSystem } from "./InputMapSystem";
```

It requires ExcaliburJS and uses its built-in input/event classes.

## 🚀 Quick Start

1. Create the input system

```ts
const game = new Engine({ width: 800, height: 600 });
const inputMapper = new InputMapSystem(game);
```

2. Register a context

```ts
inputMapper.registerMap({
  name: "gameplay",
  inputMap: {
    KeyPresses: new Set([Keys.W, Keys.A, Keys.S, Keys.D]),
    GamepadAxesPolling: new Set([Axes.LeftStickX, Axes.LeftStickY]),
  },
});
```

3. Switch Context

```ts
inputMapper.switchContext("gameplay");
```

4. Listen for events

```ts
inputMapper.inputMapEmitter.on("keyPress", e => {
  console.log("Pressed:", e.key, "in context:", e.ctx);
});

inputMapper.inputMapEmitter.on("gamepadStick", e => {
  console.log(`Left stick is pointing: ${e.direction}`);
});
```

## 🧠 Input Concepts

### InputContext

Contexts define what inputs are active at any given time.

```ts
type InputContext = {
  KeyPresses?: Set<Keys>;
  KeyReleases?: Set<Keys>;
  KeyHolds?: Set<Keys>;

  GamepadAxesTriggers?: Set<Axes>;
  GamepadButtonsTriggers?: Set<Buttons>;

  GamepadAxesPolling?: Set<Axes>;
  GamepadButtonsPolling?: Set<Buttons>;

  PointerTriggers?: Set<"up" | "down" | "move" | "wheel" | "cancel">;
};
```

This lets you create isolated input layers:

- "gameplay" listens to WASD + left stick
- "menu" listens to arrow keys + D-pad buttons
- "cutscene" listens only to Escape

Switching is instant and automatic.

### 🎮 Gamepad Stick Directions

Analog stick input is normalized to 8 directions + idle:

```md
up, down, left, right, upLeft, upRight, downLeft, downRight, idle
```

These output through:

```ts
inputMapper.inputMapEmitter.on("gamepadStick", ({ direction }) => {
  console.log(direction);
});
```

Includes:

    - Deadzone filtering (prevents drift)
    - Threshold logic (controls when diagonal vs cardinal triggers)

### 📡 Event Types

Your game can subscribe to:

#### Keyboard:

    - keyPress
    - keyRelease
    - keyHold

#### Gamepad:

    - gamepadStick
    - gamepadButton
    - gamepadConnect
    - gamepadDisconnect

#### Pointer:

    - pointer (up, down, move, cancel)
    - wheel

#### Example:

```ts
inputMapper.inputMapEmitter.on("pointer", e => {
  console.log(e.event, e.screenPos);
});
```

## 🧩 Example: Defining Multiple Contexts

```ts
inputMapper.registerMap({
  name: "menu",
  inputMap: {
    KeyPresses: new Set([Keys.Enter]),
    GamepadButtonsTriggers: new Set([Buttons.Face1]),
  },
});

inputMapper.registerMap({
  name: "inventory",
  inputMap: {
    KeyPresses: new Set([Keys.I, Keys.Escape]),
    PointerTriggers: new Set(["move", "down"]),
  },
});
```

Switch modes anytime:

```ts
inputMapper.switchContext("inventory");
```

## 🛠️ Lifecycle Notes

The system automatically:

    - Hooks into Excalibur’s preupdate cycle
    - Registers all keyboard/gamepad/pointer events
    - Detects and manages connected gamepads
    - Rebuilds polling tables when contexts change

No cleanup necessary unless you tear down your engine.

## 📖 API Summary

`constructor(engine: Engine)`

Creates the system and attaches all listeners.

`registerMap({ name, inputMap })`

Adds a new input context.

`unregisterMap(name: string)`

Removes a context.

`switchContext(name: string)`

Activates a context.

`inputMapEmitter.on(eventName, handler)`

Subscribe to one of the provided events.

## 🤝 Contributing

Ideas welcome—this system was built to grow:

Custom mappings

Input recording/playback

UI event helpers

Action-to-command mapping layer

## 📜 License

MIT — use it freely in commercial or hobby projects.
