# Shockwave Post-Processor for Excalibur.js

A dynamic shockwave visual effect post-processor for the Excalibur game engine. Creates rippling distortion effects with chromatic
aberration, perfect for explosions, impacts, or other dramatic game events.

![Shockwave](./example.gif)

## Features

- **Multiple Simultaneous Shockwaves**: Support for up to 20 concurrent shockwave effects
- **Chromatic Aberration**: RGB channel separation creates a realistic light distortion effect
- **Customizable Parameters**: Control speed, radius, duration, and thickness of each wave
- **Smooth Fade In/Out**: Natural-looking wave propagation with early and late fade curves
- **Performance Optimized**: Efficient GPU shader implementation

## Installation

```bash
npm install excalibur
```

Copy the `ShockWavePostProcessor.ts` file into your project.

## Usage

### Basic Setup

```typescript
import { ShockWavePostProcessor } from "./ShockWavePostProcessor";
import { Engine, vec } from "excalibur";

// Create your game engine
const game = new Engine({
  width: 800,
  height: 600,
});

// Create and add the post-processor
const shockwave = new ShockWavePostProcessor();
game.graphicsContext.addPostProcessor(shockwave);

// Initialize with current scene
shockwave.init(game.currentScene);
```

### Triggering Shockwaves

```typescript
// Trigger a shockwave effect
shockwave.triggerShockWave(
  vec(0.5, 0.5), // location (normalized 0-1)
  1000, // duration in milliseconds
  10, // speed multiplier
  0.5, // max radius (normalized)
  0.1 // thickness
);
```

### Example: Explosion Effect

```typescript
actor.on("collisionstart", evt => {
  const screenPos = engine.worldToScreenCoordinates(actor.pos);
  const normalizedPos = vec(screenPos.x / engine.drawWidth, screenPos.y / engine.drawHeight);

  shockwave.triggerShockWave(
    normalizedPos,
    800, // 0.8 second duration
    12, // fast propagation
    0.6, // covers 60% of screen
    0.08 // thin, sharp wave
  );
});
```

## API Reference

### `triggerShockWave(location, duration, speed, maxRadius, thickness)`

Triggers a new shockwave effect.

**Parameters:**

- `location` (Vector): Normalized screen coordinates (0-1, 0-1) where 0,0 is top-left
- `duration` (number): Total duration of the effect in milliseconds
- `speed` (number): Speed multiplier for wave propagation (higher = faster)
- `maxRadius` (number): Maximum radius the wave will reach (0-1, normalized to screen)
- `thickness` (number): Thickness of the distortion band (0-1, recommended: 0.05-0.15)

### `init(scene)`

Initializes the post-processor with the current scene. Must be called before triggering shockwaves.

**Parameters:**

- `scene` (Scene): The Excalibur scene to attach to

## How It Works

The shader creates a rippling distortion effect by:

1. **Wave Propagation**: Each shockwave expands outward from its origin point over time
2. **Chromatic Aberration**: RGB channels are sampled at slightly different time offsets, creating a rainbow-like distortion
3. **Distance-Based Distortion**: Pixels closer to the wave edge are displaced more strongly
4. **Directional Displacement**: Pixels are pushed outward from the wave's center
5. **Fade Curves**: Smooth fade-in at the beginning and fade-out as the wave dissipates

## Performance Notes

- Maximum of 20 simultaneous shockwaves (configurable via `MAX_SHOCKWAVES`)
- Older shockwaves are automatically removed when limit is reached
- Completed shockwaves are cleaned up automatically
- GPU-accelerated shader implementation for smooth performance

## Customization Tips

### Subtle Impact

```typescript
shockwave.triggerShockWave(pos, 600, 8, 0.3, 0.05);
```

### Massive Explosion

```typescript
shockwave.triggerShockWave(pos, 1500, 15, 0.8, 0.12);
```

### Quick Pulse

```typescript
shockwave.triggerShockWave(pos, 300, 20, 0.4, 0.06);
```

## Requirements

- Excalibur.js (any version supporting WebGL2 post-processors)
- WebGL2-capable browser

## License

MIT — free to use in commercial and personal projects.

## Contributing

Contributions are welcome! Please open an issue or submit a pull request.

## Credits

Created for use with the Excalibur.js game engine.
