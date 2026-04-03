# Sunset Synthwave Shader

![screenshot](./ss.gif)

A developer guide for the `Sunset Synthwave` material in the `Game Systems/Shaders and Post Processors` folder. This shader is provided
as a WebGL 2.0 fragment shader string for use with Excalibur.js materials.

## Overview

`Sunset Synthwave` renders a procedural synthwave sunset scene with volumetric haze, stars, reflective surfaces, and optional
audio-reactive modulation. It is best used as a fullscreen background actor or post-process material in an Excalibur.js game.

## Files

- `sunsetShader.ts` — exports the shader source as `shader`
- `BackgroundActor.ts` — shows how to create the material, attach it to an actor, and update uniforms per frame
- `ss.gif` — visual reference for the shader effect

## Usage

### Import the shader

```ts
import { shader } from "./sunsetShader";
import { Background } from "./BackgroundActor";
```

### Setup the engine

```ts
const game = new Engine({
  width: 1500, // the width of the canvas
  height: 800, // the height of the canvas
  displayMode: DisplayMode.Fixed, // the display mode
  pixelArt: true,
  backgroundColor: Color.Black, // <---- this makes colors look mo better
});

await game.start();
```

### Apply to a fullscreen actor

```ts
const background = new Background(game); // Example background actor provided in repo
game.add(background);
```

:::note Review the Background Actor for implementation details :::

## Uniforms and Inputs

The shader uses these uniforms:

- `iTime` — elapsed time in seconds
- `iTimeDelta` — frame delta time in seconds
- `iResolution` — current screen resolution as `vec2`
- `iChannelResolution` — float array for channel resolutions
- `iChannel0` — optional texture sampler for audio or external input

### Audio / Texture input

`iChannel0` is optional and currently disabled by default using `#define disable_sound_texture_sampling`. To enable audio or
texture-driven modulation:

- remove or comment out `#define disable_sound_texture_sampling`
- provide `iChannel0` as a sampler2D
- set `iChannelResolution[0]` to the channel texture resolution

## Customization

The shader file contains several compile-time defines that alter the effect:

- `AA` — anti-aliasing sample count
- `VAPORWAVE` — alternate pastel tint mode
- `stereo` — stereo offset for cross-eyed/parallax rendering
- `wave_thing` — toggles animated wave distortion
- `city` — enables stylized city silhouette detail

Example config changes:

```glsl
#define AA 4
#define VAPORWAVE
//#define stereo 1.
//#define city
```

## Integration Tips

- Use this shader for fullscreen backgrounds or post-process passes rather than small sprites.
- Keep `iResolution` synchronized with the render surface dimensions.
- If you add `iChannel0`, ensure the texture is valid and `iChannelResolution` is set correctly.
- Use `engine.clock.now() / 1000` for consistent time-based animation.

## Example Background Actor

`BackgroundActor.ts` demonstrates:

- creating the material
- assigning it to an actor
- updating shader uniforms every frame
- preparing channel resolution data for optional input

## License

This shader is part of the Game Dev Library and follows the repository licensing terms.

## Credits

Inspired by synthwave and sunset shader styles, adapted for Excalibur.js with procedural rendering techniques. '@ Set-Content -Path
'c:\programming\Game Dev Library\Game Systems\Shaders and Post Processors\Sunset Synthwave\readme.md' -Value $content -Encoding utf8
