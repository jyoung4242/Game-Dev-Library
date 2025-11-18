# Signals – Lightweight Event Signals for Game Dev

The Signal class provides a simple, decoupled way to communicate between systems in your game. It wraps the browser’s native
CustomEvent + AbortController APIs to give you an easy signal/slot–style workflow without needing a full event bus or external library.

Great for:

- UI → game logic communication
- Decoupling gameplay systems
- Docking to ExcaliburJS, vanilla JS engines, or your own framework
- Replacing long chains of callbacks or global state listeners

## ✨ Features

Lightweight: No dependencies, built entirely on native browser APIs.

Decoupled architecture: Send and listen for named events without needing direct references.

Automatic cleanup: Listener teardown via AbortController.

Optional payloads: Pass arbitrary parameters when sending.

## 📦 Installation

Include the module in your project:

```ts
import { Signal } from "./Signal";
```

## 🚀 Usage

Creating a Signal

```ts
const playerHit = new Signal("player:hit", "combat-system");
```

You may optionally specify a from string to identify the sender.

### Sending a Signal

```ts
playerHit.send([damageAmount, hitSource]);
```

The listener receives a CustomEvent with a detail object:

```ts
{
  who: string;         // whatever 'from' was set to
  params?: any[];      // array of parameters if passed
}
```

### Listening for a Signal

```ts
playerHit.listen((event: CustomEvent) => {
  const { who, params } = event.detail;
  console.log(`Hit event from: ${who}`, params);
});
```

Listeners automatically use an AbortController so they can be removed cleanly.

### Stopping a Listener

```ts
playerHit.stopListening();
```

This immediately aborts the internal AbortController, removing the event listener from document.

## 🧠 How It Works

Under the hood:

- send() dispatches a CustomEvent on document.
- listen() wires up an event listener with { signal: AbortController.signal }, allowing auto-cleanup.
- stopListening() aborts the controller and removes the listener.

Because it’s based on browser primitives, it works in:

- Native DOM code
- Canvas-based engines
- ExcaliburJS or similar JS game frameworks
- Electron apps

## 🧩 API Reference

`constructor(name: string, from?: string)`

Creates a new Signal.

| Parameter | Type      | Description                             |
| --------- | --------- | --------------------------------------- |
| `name`    | `string`  | Name of the signal/event to listen for. |
| `from`    | `string?` | Optional identifier for the sender.     |

`send(params?: any[])`

Dispatches a CustomEvent with the given params.

`listen(callback: Function)`

Registers a listener. Callback receives the event object:

```ts
(event: CustomEvent) => void
```

`stopListening()`

Removes the listener by aborting the underlying AbortController.

## 📝 Example: Connecting Systems

```ts
// Inventory system
const itemCollected = new Signal("item:collected");

itemCollected.listen((e: CustomEvent) => {
  const { who, params } = e.detail;
  console.log(`${who} collected`, params[0]);
});
```

// Somewhere else...

```ts
// Somewhere else
const itemCollected = new Signal("item:collected", "inventory");
itemCollected.send(["Golden Key"]);
```

Output:

`inventory collected Golden Key`

## 💡 Tips

- Use namespaces in signal names (ui:health, player:jump, system:pause) to stay organized.
- Create a shared registry of signals to avoid typo bugs.
- Combine with an enum or const object for strongly typed event names in TypeScript.

## 📄 License

MIT — Free to use in commercial and hobby projects alike.
