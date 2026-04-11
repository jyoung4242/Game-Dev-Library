# DefaultSceneLoader Guide

A flexible scene loader for Excalibur that handles resource loading with progress tracking and customizable UI.

## Overview

`DefaultSceneLoader` is a base class that extends Excalibur's `Scene` to provide a robust resource loading system. It automatically
loads resources, tracks progress, handles audio context unlocking, and provides lifecycle hooks for customization.

## Key Features

- **Automatic Resource Loading**: Loads all provided resources in parallel
- **Progress Tracking**: Access loading progress via the `progress` getter (0-1)
- **Lazy Loading Support**: Add resources dynamically and reload
- **Audio Context Unlocking**: Automatically unlocks Web Audio on initial load
- **Concurrent Call Coalescing**: Multiple `load()` calls coalesce onto a single in-flight promise
- **Lifecycle Hooks**: Customizable hooks for before/after loading

## Getting Started

### Basic Usage

```typescript
import { Loader } from "./Scenes/Loader";
import { resources } from "./resources";

// Create a loader scene with your resources
const loaderScene = new Loader(resources);

// Add it to your engine
engine.addScene("loader", loaderScene);

// Go to the loader scene
engine.goToScene("loader");
```

### Creating a Custom Loader

Extend `DefaultSceneLoader` and override lifecycle hooks to customize the loading experience:

```typescript
import { Engine, Color, vec, Font, SceneActivationContext, Loadable, Util } from "excalibur";
import { UIButton } from "../UI/uiButton";
import { UIProgressBar } from "../UI/uiProgress";
import { UILabel } from "../UI/uiLabel";
import { DefaultSceneLoader } from "./DefaultSceneLoader";

export class Loader extends DefaultSceneLoader {
  button: UIButton | null = null;
  pbar: UIProgressBar | null = null;
  label: UILabel | null = null;

  constructor(resources: any) {
    super(resources);
  }

  // Set up UI elements
  onInitialize(engine: Engine): void {
    this.pbar = new UIProgressBar({
      ... // user defined progress bar details
    });

    this.button = new UIButton({
       ... // user defined button details
       // button callback to switch to first playable scene...
    });

    this.label = new UILabel({
        ... // user defined label details
    });

    this.add(this.pbar);
    this.add(this.label);
  }

  // Display the start button after resources are loaded
  showPlayButton(): Promise<void> {
    return new Promise(resolve => {
      this.add(this.button!);
      resolve();
    });
  }

  // Handle post-load transitions
  public onAfterLoad(_loaded: Loadable<any>[], isInitialLoad: boolean): Promise<void> {
    return new Promise(async resolve => {
      if (isInitialLoad) {
        await this.showPlayButton();
      } else {
        Util.delay(1000, this.engine?.clock).then(() => {
          this.engine?.goToScene("main");
        });
      }
      resolve();
    });
  }

  // Update progress bar during loading
  onPreUpdate(engine: Engine, elapsed: number): void {
    if (this.pbar) {
      const percent = this.progress;
      this.pbar.value = percent * 100;
    }
  }
}
```

## Lifecycle Hooks

### `onBeforeLoad(pending: Loadable<any>[], isInitialLoad: boolean)`

Called before resource loading begins. Use this to prepare UI or log loading start.

**Parameters:**

- `pending`: Array of resources about to be loaded
- `isInitialLoad`: `true` if this is the first load batch, `false` for subsequent loads

### `onUserAction()`

Called after resources are loaded (only on initial load) to prompt user interaction for audio context unlocking. Override to display a
"Click to continue" button or similar.

**Default behavior:** Delays 200ms then calls `showPlayButton()`

### `onAfterLoad(loaded: Loadable<any>[], isInitialLoad: boolean)`

Called after resources are loaded and audio context is unlocked. Use this to trigger scene transitions or cleanup.

**Parameters:**

- `loaded`: Array of resources that were loaded
- `isInitialLoad`: `true` if this is the first load batch

### `onInitialLoadComplete()`

Called once after the very first load batch completes. Use this to trigger scene transitions.

### `showPlayButton()`

Override to display a button that allows users to proceed. Must return a promise.

### `dispose()`

Called after initial load completes. Use this for cleanup.

## Public API

### `isLoaded(): boolean`

Returns `true` if all current resources are loaded.

### `progress: number`

Returns loading progress as a decimal (0-1). Use this to update progress bars or other UI.

```typescript
onPreUpdate(engine: Engine, elapsed: number): void {
  const percent = this.progress; // Value from 0 to 1
  // Update UI based on progress
}
```

### `load(): Promise<Loadable<any>[]>`

Loads all unloaded resources. Safe to call multiple times — concurrent calls coalesce onto a single promise.

Returns a promise resolving to the array of all loaded resources.

### `addResource(loadable: Loadable<any>): void`

Dynamically add a resource to be loaded. Marks the loader as needing to reload.

## Events

The loader emits events for fine-grained control:

- `"beforeload"`: Fired before loading starts. Payload: `{ resources: Loadable<any>[], isInitialLoad: boolean }`
- `"loadresourcestart"`: Fired before a resource starts loading. Payload: `resource: Loadable<any>`
- `"loadresourceend"`: Fired after a resource finishes loading. Payload: `resource: Loadable<any>`
- `"useraction"`: Fired after user action. Payload: `none`
- `"afterload"`: Fired after loading completes. Payload: `{ resources: Loadable<any>[], isInitialLoad: boolean }`

### Example Event Listener

```typescript
const loader = new Loader(resources);

loader.events.on("loadresourcestart", resource => {
  console.log(`Loading: ${resource.name}`);
});

loader.events.on("afterload", event => {
  console.log(`Load complete. Initial load: ${event.isInitialLoad}`);
});
```

## Constructor Options

The `DefaultSceneLoader` constructor accepts optional parameters:

```typescript
const loader = new DefaultSceneLoader(resources, {
  suppressPlayButton: false, // Set to true to skip showing play button
  nextScene: "main", // Scene to transition to (optional)
});
```

## Tips & Best Practices

1. **Use Object Format for Named Resources**: Pass resources as an object for easy reference:

   ```typescript
   const resources = {
     background: new ImageSource("./background.png"),
     music: new Sound("./music.mp3"),
   };
   const loader = new Loader(resources);
   ```

2. **Track Progress**: Use the `progress` property and `onPreUpdate()` to smoothly update UI:

   ```typescript
   onPreUpdate(engine: Engine, elapsed: number): void {
     this.progressBar.value = this.progress * 100;
   }
   ```

3. **Handle Initial vs Reload**: Use the `isInitialLoad` parameter to show UI only once:

   ```typescript
   onAfterLoad(_loaded: Loadable<any>[], isInitialLoad: boolean) {
     if (isInitialLoad) {
       // Show start button
       this.showPlayButton();
     } else {
       // Auto-transition on reload
       this.engine?.goToScene("main");
     }
   }
   ```

## Example: Complete Integration

```typescript
import { Engine, ImageSource, Sound } from "excalibur";
import { Loader } from "./Scenes/Loader";
import { resources } from "./resources";

const engine = new Engine({
  width: 800,
  height: 600,
  scenes: {
    loader: new Loader(resources),
    main: new MainScene(),
  },
});

// Start with the loader
engine.goToScene("loader");
engine.start();
```
