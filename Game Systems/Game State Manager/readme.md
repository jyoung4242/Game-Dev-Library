# `excalibur-state` — Immutable State Management for ExcaliburJS

A general-purpose, fully typed, immutable state management module built for [ExcaliburJS](https://excaliburjs.com/) games. It uses
ExcaliburJS's native `EventEmitter` for reactive subscriptions and enforces strict immutability via deep freezing and structural
copying.

---

## Table of Contents

- [Features](#features)
- [Installation](#installation)
- [Quick Start](#quick-start)
- [API Reference](#api-reference)
  - [createStateStore](#createstatestorestate)
  - [get](#get)
  - [select](#select)
  - [set](#set)
  - [update](#update)
  - [patch](#patch)
  - [batch](#batch)
  - [subscribe](#subscribe)
  - [on / off](#on--off)
  - [serialize](#serialize)
  - [reset](#reset)
- [Type Utilities](#type-utilities)
  - [Path\<T\>](#patht)
  - [PathValue\<T, K\>](#pathvaluet-k)
  - [ChangePayload\<State\>](#changepayloadstate)
- [Immutability Guarantees](#immutability-guarantees)
- [Event System](#event-system)
- [Batch Updates](#batch-updates)
- [Design Constraints](#design-constraints)
- [Examples](#examples)
- [TypeScript Configuration](#typescript-configuration)

---

## Features

- ✅ **Fully immutable** — internal state is deep-frozen; all returned values are read-only clones
- ✅ **Typed path access** — `"player.hp"` style paths with full compile-time validation and inference
- ✅ **ExcaliburJS-native events** — uses `EventEmitter` from `excalibur` directly
- ✅ **Granular subscriptions** — subscribe to `"change"` or `"change:player.hp"`
- ✅ **Shallow equality checks** — prevents redundant event emissions when value hasn't changed
- ✅ **Batch updates** — group multiple mutations into a single event cycle
- ✅ **No global singleton** — create as many independent stores as you need
- ✅ **JSON-serializable** — state must consist only of plain data (no functions, classes, or symbols)
- ✅ **Zero additional dependencies** — only requires `excalibur` as a peer dependency

---

## Installation

Copy `state-store.ts` into your project. The only dependency is ExcaliburJS itself.

```bash
npm install excalibur
```

Then import the factory function:

```ts
import { createStateStore } from "./state-store";
```

---

## Quick Start

```ts
import { createStateStore } from "./state-store";

interface GameState {
  player: {
    hp: number;
    mp: number;
    name: string;
  };
  score: number;
  paused: boolean;
}

const store = createStateStore<GameState>({
  player: { hp: 100, mp: 50, name: "Hero" },
  score: 0,
  paused: false,
});

// Subscribe to HP changes
store.on("change:player.hp", ({ previousValue, value }) => {
  console.log(`HP: ${previousValue} → ${value}`);
});

// Update state
store.set("player.hp", 80);
store.update("score", s => s + 100);
store.patch({ paused: true });
```

---

## API Reference

### `createStateStore<State>(initialState)`

Creates a new independent state store from a plain initialization object.

```ts
const store = createStateStore<GameState>(initialState);
```

**Type Parameters**

| Parameter | Description                                                                         |
| --------- | ----------------------------------------------------------------------------------- |
| `State`   | The shape of your state. Must be a plain object with JSON-serializable values only. |

**Parameters**

| Parameter      | Type    | Description                                       |
| -------------- | ------- | ------------------------------------------------- |
| `initialState` | `State` | The initial state. Cloned and frozen immediately. |

**Returns** a `StateStore<State>` instance.

---

### `get()`

Returns the entire current state as a deeply frozen, read-only object.

```ts
const state: Readonly<GameState> = store.get();
```

### `get(path)`

Returns the value at a typed dot-notation path, deeply frozen.

```ts
const hp: number = store.get("player.hp");
const name: string = store.get("player.name");
```

Invalid paths are rejected at compile time. At runtime, an error is thrown if the path does not resolve to a valid object chain.

---

### `select(selector)`

Derives a value from state using a selector function. Useful for computing derived data without subscribing to a specific path.

```ts
const isAlive = store.select(s => s.player.hp > 0); // boolean
const pos = store.select(s => s.player.position); // Readonly<{x, y}>
```

Returned objects are deep-frozen clones.

---

### `set(path, value)`

Sets the value at the given path and emits change events.

```ts
store.set("player.hp", 80); // ✅
store.set("score", 500); // ✅
store.set("player.hp", "full"); // ❌ TypeScript compile error
```

No event is emitted if the new value is shallowly equal to the current value.

---

### `update(path, fn)`

Reads the current value at `path`, passes it to `fn`, and sets the result.

```ts
store.update("player.hp", hp => Math.max(0, hp - 10));
store.update("score", s => s + 100);
```

The value passed to `fn` is a deep clone — you may mutate it freely inside the function without affecting the store.

---

### `patch(partial)`

Performs a deep merge of a partial object into the current state. Only the specified paths are updated.

```ts
store.patch({
  player: { hp: 100, mp: 50 },
  score: 999,
});
```

Change events are emitted individually for each leaf path that changed. Unchanged paths produce no events.

---

### `batch(fn)`

Groups multiple mutations into a single synchronous block. All internal state changes are collected first, then events are emitted
together after the block completes.

```ts
store.batch(ctx => {
  ctx.set("player.hp", 100);
  ctx.set("player.mp", 50);
  ctx.set("score", 0);
  ctx.patch({ paused: false });
});
```

The `ctx` object inside `batch` exposes `set`, `update`, and `patch` — with the same signatures as the store methods.

> **Note:** Events are still emitted per-path after the batch completes, but intermediate states are not observable to subscribers.

---

### `subscribe(path, handler)`

Subscribes to changes at a specific path. Returns an unsubscribe function.

```ts
const unsub = store.subscribe("player.hp", ({ previousValue, value }) => {
  console.log(`HP changed from ${previousValue} to ${value}`);
});

// Later:
unsub();
```

This is a convenience wrapper around `on("change:<path>", handler)` that also returns a cleanup function — useful for actor or scene
teardown.

---

### `on / off`

Direct access to the underlying `EventEmitter` interface.

```ts
const handler = (payload: ChangePayload<GameState>) => {
  console.log("Something changed:", payload.path);
};

store.on("change", handler);
store.on("change:player.hp", handler);

store.off("change", handler);
```

---

### `serialize()`

Returns a JSON string of the current state. Useful for save systems, debugging, or network sync.

```ts
const json = store.serialize();
// '{"player":{"hp":80,"mp":50,"name":"Hero"},"score":500,"paused":false}'
```

---

### `reset()`

Restores the store to the original `initialState` that was passed to `createStateStore`. Emits change events for every path that
differs from the initial value.

```ts
store.reset();
```

---

## Type Utilities

### `Path<T>`

Produces a union of all valid dot-notation path strings for a given type. Arrays are excluded from path traversal.

```ts
type GamePaths = Path<GameState>;
// "player" | "player.hp" | "player.mp" | "player.name" | "score" | "paused"
```

### `PathValue<T, K>`

Resolves the value type at a given path string.

```ts
type HpType = PathValue<GameState, "player.hp">; // number
type PlayerType = PathValue<GameState, "player">; // { hp: number; mp: number; name: string }
```

### `ChangePayload<State>`

The event payload emitted on all `"change"` and `"change:<path>"` events.

```ts
interface ChangePayload<State, V = unknown> {
  path: string; // The dot-notation path that changed
  previousValue: V; // The value before the change
  value: V; // The value after the change
  previousState: Readonly<State>; // Full state snapshot before change
  state: Readonly<State>; // Full state snapshot after change
}
```

---

## Immutability Guarantees

All state values are protected at multiple levels:

| Layer                    | Mechanism                                               |
| ------------------------ | ------------------------------------------------------- |
| Internal state           | `Object.freeze()` applied recursively via `deepFreeze`  |
| `get()` return values    | Deep cloned then frozen before being returned           |
| `select()` return values | Deep cloned then frozen before being returned           |
| `update()` input         | Deep cloned before being passed to your function        |
| Direct mutation          | Blocked by TypeScript `Readonly<T>` on all return types |

```ts
const state = store.get();
state.score = 999; // ❌ TypeScript error: readonly
state.player.hp = 0; // ❌ TypeScript error: readonly

const hp = store.get("player.hp");
// hp is a primitive — mutations are naturally impossible
```

---

## Event System

Events are emitted using ExcaliburJS's `EventEmitter` after every successful state mutation.

**Two event channels are always emitted together:**

| Event             | Description                                                           |
| ----------------- | --------------------------------------------------------------------- |
| `"change"`        | Emitted for every mutation regardless of path                         |
| `"change:<path>"` | Emitted for the specific path that changed, e.g. `"change:player.hp"` |

**Emission is skipped when:**

- The new value is shallowly equal to the current value (`set`)
- No leaf paths differ after a `patch` or `reset`

**Event ordering with `patch`:** When patching multiple fields, one event pair is emitted per changed leaf path in the order they are
discovered during deep traversal.

---

## Batch Updates

Use `batch` when you need to apply several changes atomically from the perspective of subscribers — for example, resetting multiple
player stats at the start of a level:

```ts
store.batch(ctx => {
  ctx.set("player.hp", 100);
  ctx.set("player.mp", 50);
  ctx.set("score", 0);
  ctx.set("level", store.get("level") + 1);
});
// All change events emitted here, after the block
```

Inside the batch block, each `ctx.set` / `ctx.update` / `ctx.patch` call updates a local pending state. Subscribers only see the final
committed state.

---

## Design Constraints

- **No global singleton.** Call `createStateStore()` once per store. Create as many as needed.
- **Serializable state only.** Do not store functions, class instances, `Map`, `Set`, `Symbol`, or `undefined` values inside state.
  These will not survive `serialize()` / `reset()` and may cause unexpected behavior.
- **Arrays.** Arrays are treated as leaf values — path traversal does not descend into array indices. To update an array, use `set` or
  `update` on its parent path.
- **No ExcaliburJS lifecycle dependency.** The store has no coupling to `Scene`, `Actor`, or the game loop. It can be instantiated and
  used anywhere.

---

## Examples

### Tracking Player Stats in an Actor

```ts
class PlayerActor extends Actor {
  private unsub!: () => void;

  onInitialize() {
    this.unsub = store.subscribe("player.hp", ({ value }) => {
      if (value <= 0) this.die();
    });
  }

  onPreKill() {
    this.unsub();
  }

  takeDamage(amount: number) {
    store.update("player.hp", hp => Math.max(0, hp - amount));
  }
}
```

### HUD Binding

```ts
store.on("change:score", ({ value }) => {
  scoreLabel.text = `Score: ${value}`;
});

store.on("change:player.hp", ({ value }) => {
  hpBar.value = value as number;
});
```

### Save and Load

```ts
// Save
localStorage.setItem("save", store.serialize());

// Load (manual rehydration)
const saved = JSON.parse(localStorage.getItem("save") ?? "{}");
store.patch(saved);
```

### Multiple Independent Stores

```ts
const uiStore = createStateStore({ menuOpen: false, activeTab: "inventory" });
const worldStore = createStateStore({ day: 1, weather: "clear", enemyCount: 12 });
const audioStore = createStateStore({ musicVolume: 0.8, sfxVolume: 1.0 });
```

---

## TypeScript Configuration

For the recursive `Path<T>` type to compile without errors, ensure your `tsconfig.json` includes:

```json
{
  "compilerOptions": {
    "strict": true,
    "strictNullChecks": true
  }
}
```

Deep path inference on very large or deeply nested state types may produce slower type-checking. For those cases, consider flattening
your state shape or splitting into multiple stores.
