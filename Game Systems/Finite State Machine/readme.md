# ExFSM — A Lightweight, Async-Friendly Finite State Machine

ExFSM is a tiny, flexible, framework-agnostic Finite State Machine designed for game development and simulation loops.

It supports:

- Synchronous or asynchronous state transitions
- Enter / Exit / Update / Repeat lifecycle methods
- Named states with easy registration
- State parameters (passed automatically from set() to update())
- Simple success/error results via FSMResult<T>

Perfect for menus, AI behaviors, combat states, cutscene logic, animation controllers, and more.

## ✨ Features

- Minimal API, no external dependencies
- Promise-aware, allowing async loading, delays, transitions, and cleanup
- Safe transition flow:
  - Exit current state → Enter next state → Update with params
- Named state registration via strings or ExState instances
- Optional params preserved across frames (update() receives them every tick)

## 📦 Installation

Just drop the module into your project:

```ts
import { ExFSM, ExState } from "./ExFSM";
```

## 🧠 The FSMResult<T> Type

Most methods return a simple, consistent structure:

```ts
type FSMResult<T> = { success: boolean; message?: string; value?: T };
```

Easy to debug and handle errors without exceptions.

🚦 Basic Usage

1. Create an FSM instance

```ts
const fsm = new ExFSM();
```

2. Define some states

```ts
class IdleState extends ExState {
  enter(prev) {
    console.log("Entering idle");
  }
  update() {
    console.log("Idling...");
  }
}

class MoveState extends ExState {
  enter(prev, direction) {
    console.log("Moving in direction:", direction);
  }
  update(direction) {
    console.log("Still moving:", direction);
  }
}
```

3. Register states

```ts
fsm.register(new IdleState("idle"), new MoveState("move"));
```

You can also register by string:

```ts
fsm.register("jump", "attack");
```

This automatically creates ExState instances with those names.

## 🔄 Switching States

### Synchronous transitions

```ts
fsm.set("idle");
fsm.update(); // calls idle.update()
```

### With parameters

```ts
fsm.set("move", { x: 1, y: 0 });
fsm.update(); // calls move.update({ x:1, y:0 })
```

### Asynchronous enter/exit

```ts
class FadeOut extends ExState {
  async exit(next) {
    await fadeScreenToBlack();
  }
}
```

ExFSM handles this automatically:

```ts
await fsm.set("nextState");
```

If a state’s enter() or exit() returns a Promise, the FSM waits before continuing.

## 🕒 Updating in Your Game Loop

Call fsm.update() every frame:

```ts
function gameLoop() {
  fsm.update();
  requestAnimationFrame(gameLoop);
}
```

If your state’s update() returns a Promise, the FSM waits for it as well.

## 🔁 repeat()

Each ExState also includes an unused optional lifecycle method:

```ts
repeat(...params): void | Promise<void>;
```

This is reserved for custom behaviors your game may need — such as repeating transitions, animation cycling, cooldown ticks, or retry
loops. (Your engine can call it manually if desired.)

## 🔧 API Summary

`register(...states)`

Registers state names or ExState instances.

`set(state, ...params)`

Transitions to another state, calling:

- current.exit()
- next.enter()
- stores params for future updates

`update()`

Calls current.update(...params).

`get()`

Returns the current state.

`has(state)`

Checks if a state is registered.

`reset()`

Clears the FSM entirely.

## 📘 Example: Enemy AI

```ts
fsm.register(new ExState("idle"), new ExState("chase"), new ExState("attack"));

fsm.set("idle");

// in your update loop: if (distanceToPlayer < 200) fsm.set("chase"); if (distanceToPlayer < 30) fsm.set("attack");

fsm.update();
```

## 🧰 Example: Async Transition (Loading Screen)

```ts
class LoadAssets extends ExState {
  async enter() {
    console.log("Loading...");
    await loadAssetsAsync();
  }

  update() {
    console.log("Done loading — switching!");
    fsm.set("mainMenu");
  }
}
```

## 📝 Notes

- If no state is active, fsm.update() returns an error.
- State names are case-sensitive.
- Registering a state with an existing name overwrites it (with a console warning).

## 📄 License

MIT — Free to use in commercial and hobby projects alike.
