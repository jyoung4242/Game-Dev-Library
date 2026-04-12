# FogActor

A performant, procedurally-generated animated fog effect component for Excalibur.js games. Uses Perlin noise to create realistic,
scrolling fog that can be placed as a child actor on any parent.

## Overview

`FogActor` renders an animated fog overlay using Perlin noise sampling. The fog:

- Scrolls smoothly in configurable X/Y directions
- Responds to noise parameters for cloud-like appearance
- Uses pixel-block sampling and `ImageData` buffering for performance
- Supports color tinting and opacity control
- Works as a child actor with optional positional offset

## Features

- **Procedural Generation**: Perlin noise-based cloud patterns with configurable octaves, frequency, and amplitude
- **Smooth Animation**: Continuous scrolling at customizable speeds
- **Optimized Rendering**: Single `putImageData()` call per frame instead of hundreds of fill operations
- **Flexible Sizing**: Fog dimensions independent of parent actor
- **Customizable Appearance**: Color, alpha, and noise parameters
- **Seeded Randomness**: Optional seed for reproducible fog patterns

## Dependencies

- **Excalibur.js** – Game engine
- **@excaliburjs/plugin-perlin** – Perlin noise generation

## Installation

1. Copy `FogActor.ts` into your project
2. Import the `FogActor` class:

```typescript
import { FogActor } from "path/to/FogActor";
```

3. Create and add as a child actor to your scene or parent actor

## Usage

### Basic Example

```typescript
import * as ex from "excalibur";
import { FogActor } from "./FogActor";

// Create a parent actor (e.g., a room or background)
const room = new ex.Actor({
  pos: new ex.Vector(200, 200),
  width: 800,
  height: 600,
});

// Add fog as a child with default settings
const fog = new FogActor({
  fogWidth: 800,
  fogHeight: 600,
  offset: new ex.Vector(-400, -300), // Center it on parent
});

room.addChild(fog);
scene.add(room);
```

### Customized Fog

```typescript
const customFog = new FogActor({
  fogWidth: 1024,
  fogHeight: 768,
  offset: new ex.Vector(-512, -384),

  // Noise parameters
  seed: 42, // Fixed seed for consistent pattern
  octaves: 4, // More detail
  frequency: 16, // Larger cloud chunks
  amplitude: 0.8,
  persistence: 0.85,

  // Appearance
  color: ex.Color.DarkGray,
  fogAlpha: 0.5, // 50% opacity

  // Animation
  scrollSpeedX: 30, // Pixels/second
  scrollSpeedY: 10,

  // Quality vs performance
  resolution: 6, // Larger blocks = faster
  z: 10, // Draw order
});

parentActor.addChild(customFog);
```

## API Reference

### Constructor Options (`FogActorOptions`)

#### Dimensions

- **`fogWidth`** _(number, required)_  
  Width of the fog in pixels (should match parent actor width)

- **`fogHeight`** _(number, required)_  
  Height of the fog in pixels (should match parent actor height)

- **`offset`** _(ex.Vector, optional)_  
  Positional offset of fog relative to parent  
  Default: `ex.Vector.Zero`  
  Typical: `new ex.Vector(-fogWidth/2, -fogHeight/2)` if parent uses center anchor

#### Perlin Noise Parameters

- **`seed`** _(number, optional)_  
  Random seed for noise generation. Fix this value for reproducible patterns.  
  Default: Random seed

- **`octaves`** _(number, optional)_  
  Number of noise layers stacked together. Higher = more detail but slower.  
  Default: `3`

- **`frequency`** _(number, optional)_  
  Oscillation rate of the noise pattern. Higher zooms out (larger clouds).  
  Default: `12`

- **`amplitude`** _(number, optional)_  
  Peak height of noise in range [0–1].  
  Default: `0.9`

- **`persistence`** _(number, optional)_  
  How quickly amplitude drops per octave, range [0–1]. Higher = smoother; lower = spikier.  
  Default: `0.9`

#### Appearance

- **`color`** _(ex.Color, optional)_  
  Tint color of the fog. Alpha channel is ignored — use `fogAlpha` instead.  
  Default: `ex.Color.White`

- **`fogAlpha`** _(number, optional)_  
  Overall maximum opacity in range [0–1].  
  Default: `0.6`

#### Animation

- **`scrollSpeedX`** _(number, optional)_  
  Horizontal scroll speed in pixels per second.  
  Default: `20`

- **`scrollSpeedY`** _(number, optional)_  
  Vertical scroll speed in pixels per second.  
  Default: `4`

#### Performance

- **`resolution`** _(number, optional)_  
  Pixel block size for sampling the noise grid. Lower values = smoother but more expensive rendering.  
  Default: `4`  
  Recommended: `4`–`8` on modern hardware

### Inherited Properties

`FogActor` extends `ex.Actor`, so you can set standard actor properties:

- **`z`** – Draw order (default: 10)
- **`pos`**, **`rotation`**, **`scale`** – Transform properties (inherited)

## Performance Considerations

### Optimization Tips

1. **Increase `resolution`** to reduce quality but improve framerate

   ```typescript
   resolution: 8; // Faster but chunkier appearance
   ```

2. **Reduce `octaves`** to simplify noise detail

   ```typescript
   octaves: 2; // Less detail, faster
   ```

3. **Decrease `fogWidth` and `fogHeight`** if fog covers only part of screen

4. **Use the same seed** for reproducible patterns without re-computing

### How It Works (`_paintFog`)

The fog rendering is optimized as follows:

- **Noise Sampling**: Samples Perlin noise at block intervals (`resolution`×`resolution` pixels)
- **Pixel Buffer Reuse**: Allocates `ImageData` once and reuses it every frame (no GC pressure)
- **Batch Drawing**: Single `putImageData()` call instead of hundreds of `fillRect()` calls
- **Modulo Wrapping**: Scroll offsets wrap cleanly for seamless looping

## Examples

### Dense, Slow-Moving Fog

```typescript
new FogActor({
  fogWidth: 1024,
  fogHeight: 720,
  offset: new ex.Vector(-512, -360),
  octaves: 5,
  frequency: 8,
  amplitude: 0.95,
  persistence: 0.95,
  color: ex.Color.White,
  fogAlpha: 0.7,
  scrollSpeedX: 10,
  scrollSpeedY: 5,
  resolution: 4,
});
```

### Sparse, Fast-Moving Fog

```typescript
new FogActor({
  fogWidth: 800,
  fogHeight: 600,
  offset: new ex.Vector(-400, -300),
  octaves: 2,
  frequency: 20,
  amplitude: 0.8,
  persistence: 0.7,
  color: ex.Color.Black,
  fogAlpha: 0.4,
  scrollSpeedX: 50,
  scrollSpeedY: 30,
  resolution: 8,
});
```

### Purple Fog with Fixed Pattern

```typescript
new FogActor({
  fogWidth: 640,
  fogHeight: 480,
  offset: new ex.Vector(-320, -240),
  seed: 12345, // Reproducible pattern
  color: new ex.Color(200, 100, 255), // Purple tint
  fogAlpha: 0.55,
  scrollSpeedX: 25,
  scrollSpeedY: 15,
});
```

## Notes

- Fog renders each frame via `onPreUpdate()`, so it's always animating
- The `color` parameter's alpha channel is ignored; use `fogAlpha` for transparency
- The Perlin noise plugin uses "persistance" (one 'e'), which is handled internally
- Scroll offsets wrap seamlessly due to modulo operations
