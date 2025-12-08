# Wipe Material Shader for ExcaliburJS

A WebGL fragment shader that creates a smooth directional wipe effect for actors, revealing or hiding content with a soft-edged
transition. Useful for screen transitions, scene reveals, fade-in/out effects, and visual storytelling.

## Features

- **Four directional wipes**: Left, right, up, or down animations
- **Two modes**: Show (reveal) or hide (conceal) content
- **Soft edge transition**: Smooth `smoothstep` gradient for natural blending
- **Configurable progress**: Animate from 0.0 (no effect) to 1.0 (complete effect)
- **Excalibur integration**: Works seamlessly with ExcaliburJS actors and materials

## How It Works

The shader samples the texture UV coordinates and compares a calculated position (based on direction) against a progress value. A
`smoothstep` function creates a soft edge, blending the alpha channel to produce the wipe effect.

### Directions

- `0` = Left (wipe from left)
- `1` = Right (wipe from right)
- `2` = Up (wipe from up)
- `3` = Down (wipe from down)

### Modes

- `0` = **Hide**: Progressively hides the actor by reducing alpha
- `1` = **Show**: Progressively reveals the actor by increasing alpha

## API

### Fragment Shader Uniforms

| Uniform       | Type        | Range   | Description                              |
| ------------- | ----------- | ------- | ---------------------------------------- |
| `u_graphic`   | `sampler2D` | —       | Built-in Excalibur texture sampler       |
| `u_progress`  | `float`     | 0.0–1.0 | Animation progress; 0 = start, 1 = end   |
| `u_direction` | `int`       | 0–3     | Direction of wipe (see Directions above) |
| `u_mode`      | `int`       | 0–1     | Effect mode: 0 = hide, 1 = show          |

### Soft Edge

The shader uses a hardcoded `edgeWidth` of `0.1` (10% of the total progress range). Adjust this value in the shader source if you need
a softer or sharper transition.

## Usage

### Basic Setup

```typescript
import { Actor, Color, Engine, Material, Shader } from "excalibur";
import { wipeFragShader } from "./Wipe";

class WipeActor extends Actor {
  mat: Material | null = null;
  progress: number = 0.5; // 0.0 to 1.0
  mode: number = 0; // 0 = hide, 1 = show
  direction: number = 3; // 0 = left, 1 = right, 2 = up, 3 = down

  constructor() {
    super({
      x: 0,
      y: 0,
      width: 48,
      height: 48,
      color: Color.Transparent,
    });
    // Add your sprite or graphics here
    this.graphics.use(...);
  }

  onInitialize(engine: Engine): void {
    // Create the material with the wipe shader
    this.mat = engine.graphicsContext.createMaterial({
      fragmentSource: wipeFragShader,
    });
    this.graphics.material = this.mat;
  }

  onPreUpdate(): void {
    if (this.mat) {
      // Update uniforms each frame
      this.mat.update((s: Shader) => {
        s.trySetUniformFloat("u_progress", this.progress);
        s.trySetUniformInt("u_direction", this.direction);
        s.trySetUniformInt("u_mode", this.mode);
      });
    }
  }
}
```

### Animating a Wipe-Out (Hide)

```typescript
const actor = new WipeActor();
engine.add(actor);

// Set to hide mode (mode = 0)
actor.mode = 0;

// Animate progress from 0 to 1 over 1 second
let elapsed = 0;
const duration = 1000; // ms

actor.on("preupdate", () => {
  elapsed += engine.clock.deltaTime;
  actor.progress = Math.min(elapsed / duration, 1.0);

  if (actor.progress >= 1.0) {
    // Wipe complete
    actor.active = false;
  }
});
```

### Animating a Wipe-In (Show)

```typescript
actor.mode = 1; // Show mode
actor.direction = 0; // Wipe from left
actor.progress = 0; // Start invisible

let elapsed = 0;
const duration = 1500; // ms

actor.on("preupdate", () => {
  elapsed += engine.clock.deltaTime;
  actor.progress = Math.min(elapsed / duration, 1.0);
});
```

### Using Excalibur's Built-in Animation

If you prefer using Excalibur's animation system:

```typescript
import { EaseTo } from "excalibur";

actor.mode = 0;
actor.progress = 0;

const wipeTween = new EaseTo(actor, { progress: 1.0 }, 1500);
wipeTween.start();
```

## Customization

### Adjusting Edge Softness

Open `Wipe.ts` and modify the `edgeWidth` variable:

```glsl
float edgeWidth = 0.1; // Change this value
// 0.05 = sharper edge
// 0.2 = softer edge
```

### Reversing Direction

To reverse the wipe direction at runtime, simply swap the `u_mode`:

```typescript
actor.mode = actor.mode === 0 ? 1 : 0;
```

### Combining with Tween Duration

Match your progress animation duration with visual feedback for smooth, coordinated effects:

```typescript
const wipeDuration = 1000; // ms

actor.on("preupdate", () => {
  elapsed += engine.clock.deltaTime;
  actor.progress = Math.min(elapsed / wipeDuration, 1.0);
});
```

## Performance Notes

- The shader is lightweight and suitable for multiple actors using wipe effects simultaneously.
- Each actor with a wipe shader should have its own material instance (avoid material sharing across actors with different progress
  values).
- Use `graphicsContext.createMaterial()` once in `onInitialize` and cache it on the actor.

## Example: Screen Transition

```typescript
class ScreenWipeTransition {
  private actor: WipeActor;
  private duration: number = 2000; // 2 seconds
  private elapsed: number = 0;
  private isComplete: boolean = false;

  constructor(engine: Engine) {
    this.actor = new WipeActor();
    this.actor.mode = 0; // Hide mode
    this.actor.direction = 2; // Wipe from up
    engine.add(this.actor);
  }

  update(deltaTime: number): void {
    this.elapsed += deltaTime;
    this.actor.progress = Math.min(this.elapsed / this.duration, 1.0);

    if (this.actor.progress >= 1.0 && !this.isComplete) {
      this.isComplete = true;
      console.log("Transition complete!");
      // Perform scene change here
    }
  }

  isFinished(): boolean {
    return this.isComplete;
  }
}
```

## Troubleshooting

### Material not applying

- Ensure `onInitialize` is called before `onPreUpdate` (actors must be added to the engine first).
- Verify the graphics context is available: `engine.graphicsContext.createMaterial(...)`.

### Shader not compiling

- Check browser console for WebGL errors.
- Verify ExcaliburJS version supports custom materials.
- Confirm uniform names match exactly: `u_progress`, `u_direction`, `u_mode`.

### Effect not visible

- Confirm the actor has visible graphics (sprite or shape) assigned before adding the material.
- Check that `progress` is between 0.0 and 1.0.
- Verify `mode` is either 0 or 1.

## Files

- **`Wipe.ts`** — Fragment shader source code
- **`actor.ts`** — Example actor implementation using the shader
- **`readme.md`** — This documentation
- **`example.gif`** — Visual demonstration of the wipe effect

## Related

- [ExcaliburJS Materials & Shaders](https://excaliburjs.com/)
- [WebGL Fragment Shaders](https://khronos.org/opengl/wiki/OpenGL_Shading_Language)

## License

Part of the Game Dev Library. See repository root for license information.
