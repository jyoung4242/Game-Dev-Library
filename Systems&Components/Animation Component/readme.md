# Animation Component

A lightweight, developer-friendly animation controller for Excalibur.js entities. AnimationComponent makes it easy to manage multiple
animations, switch between them, tint them, and keep visual continuity like scale/opacity when swapping animations.

Perfect for character sprites, NPCs, VFX cycles, UI animated elements, and more.

## ✨ Features

- 🎞️ Simple animation switching via set(name)
- ⏱️ Start from a specific frame or resume from frame 0
- 🧩 Keeps scale & opacity when changing animations
- 🎨 Tint animations with a single call
- 🔍 Query current animation & frame index
- ⚙️ Works with any mapped string keys (generic Keys extends string)
- 🏎️ Adjustable playback speed

## 📦 Installation

Place this module in your project's component/system folder and import it where needed:

```ts
import { AnimationComponent } from "./AnimationComponent";
```

This component requires Excalibur:

`npm install excalibur`

## 🚀 Usage

1. Create Your Animations

```ts
import { Animation, SpriteSheet } from "excalibur";

// example sprite sheet
const sheet = SpriteSheet.fromImageSource({
  /* ... */
});

// build animations
const idle = sheet.getAnimationBetween(engine, 0, 3, 100);
const walk = sheet.getAnimationBetween(engine, 4, 9, 80);

const animations = {
  idle,
  walk,
} as const;
```

2. ## Attach the Component to an Entity

```ts
const player = new Actor();

const animComponent = new AnimationComponent(animations);
player.addComponent(animComponent);
```

## 3. Switch Animations

```ts
// play the "walk" animation
player.get(AnimationComponent).set("walk");

// start "idle" from frame 2
player.get(AnimationComponent).set("idle", 2);
```

## 🛠 API Reference

`new AnimationComponent<Record>()`

Create a new animation controller.

```ts
const ac = new AnimationComponent({
  idle: Animation,
  walk: Animation,
});
```

`set(name: Keys, startFromFrame = 0, durationLeft?)`

Switch to an animation.

name — animation key

startFromFrame — optional frame index to jump to

durationLeft — optional remaining duration for the frame

Carries over scale + opacity from the previous animation.

`reset()`

Resets the current animation back to frame 0.

`tint(color: Color | null)`

Apply a tint to the active animation. Pass null to reset to Color.White.

```ts
anim.tint(Color.Red);
anim.tint(null); // reset
```

`get(name: Keys)`

Retrieve an animation from the internal dictionary.

`current`

Reference to the current GraphicsComponent.current.

`currentFrame`

Returns the current animation's active frame index.

`is(name: Keys)`

Check if the given animation is currently playing.

`speed (getter/setter)`

Controls playback speed (your own logic may use this value on tick/update).

## 🧩 Example: Creating a Player with Animation States

```ts
player.on("preupdate", () => {
  const ac = player.get(AnimationComponent);

  if (movement.isMoving) ac.set("walk");
  else ac.set("idle");
});
```

## 📄 License

MIT — free for commercial and non-commercial use.
