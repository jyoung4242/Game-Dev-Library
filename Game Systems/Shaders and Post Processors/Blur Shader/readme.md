# Blur Shader

This is a simple blur shader written in GLSL for use in game development in Excalibur.js.

## Description

The blur shader applies a box blur effect to the screen texture or a specified graphic texture. It samples a 5x5 neighborhood around
each pixel, averages the colors, and applies a darkening effect.

## Usage

1. Import the shader:

```typescript
import { blurShader } from "./blur.ts";
```

2. In your game, create an actor or post-processor using this shader string.

For example, in your Actor:

```ts
  onInitialize(engine: Engine): void {
    this.material = engine.graphicsContext.createMaterial({
      name: "background",
      fragmentSource: blurShader,
    });
    this.graphics.material = this.material;
  }
```

or a post processor:

```ts
class blurPostProcessor implements PostProcessor {
  private _shader: ScreenShader;
  initialize(gl: WebGL2RenderingContext): void {
    this._shader = new ScreenShader(gl, blurShader);
  }
  getLayout(): ex.VertexLayout {
    return this._shader.getLayout();
  }
  getShader(): ex.Shader {
    return this._shader.getShader();
  }
}
```

The shader has constants: `radius` (2.5), `darkness` (0.65). You can modify these in the shader code. To blur a graphic instead of the
screen, uncomment the line in the shader that uses `u_graphic`.

## Parameters

- `u_screen_texture`: The screen texture to blur.
- `u_graphic`: Alternative texture to blur (commented out by default).
- `u_resolution`: Screen resolution (vec2).
- `radius`: Blur radius (constant, 2.5).
- `darkness`: Amount of darkening (constant, 0.65).
