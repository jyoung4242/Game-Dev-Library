# CRT PostProcessor for ExcaliburJS

A customizable CRT (Cathode Ray Tube) shader post-processor that adds authentic retro monitor effects to your ExcaliburJS games.

## Features

- **Screen Curvature** - Simulates the curved glass of vintage CRT monitors
- **Scanlines** - Classic horizontal scan lines for that authentic retro look
- **Chromatic Aberration** - RGB color separation at screen edges
- **Vignette Effect** - Natural darkening around the edges
- **Screen Flicker** - Subtle brightness variation for realism
- **Black Borders** - Proper letterboxing outside the curved screen area

## Installation

Copy `CRTPostProcessor.ts` into your project.

## Usage

```typescript
import { Engine } from "excalibur";
import { CRTPostProcessor } from "./CRTPostProcessor";

const game = new Engine({
  // your game config
});

// Add the CRT effect
game.graphicsContext.addPostProcessor(new CRTPostProcessor());

game.start();
```

That's it! Your game now has a CRT effect applied to the entire screen.

## Customization

Want to tweak the effect? Edit the constants at the top of the shader in `CRTPostProcessor.ts`:

```glsl
const float SCANLINE_INTENSITY = 0.15;  // 0.0 = no scanlines, 1.0 = very strong
const float CURVATURE = 4.0;            // Higher = less curve (try 2.0-8.0)
const float VIGNETTE_INTENSITY = 0.3;   // 0.0 = no vignette, 1.0 = very dark edges
const float CHROMATIC_ABERRATION = 0.001; // RGB color separation strength
const float BRIGHTNESS = 1.05;          // Overall brightness multiplier
const float FLICKER_AMOUNT = 0.01;      // Screen flicker intensity
```

### Recommended Presets

**Subtle Modern CRT:**

```glsl
CURVATURE = 6.0
SCANLINE_INTENSITY = 0.1
VIGNETTE_INTENSITY = 0.2
```

**Heavy Arcade CRT:**

```glsl
CURVATURE = 3.0
SCANLINE_INTENSITY = 0.25
VIGNETTE_INTENSITY = 0.5
CHROMATIC_ABERRATION = 0.002
```

**Flat Screen (no curve):**

```glsl
CURVATURE = 100.0  // Effectively disables curvature
```

## Performance

This is a screen-space shader that runs once per frame on the final rendered image. Performance impact is minimal on modern hardware.

## Technical Details

The shader uses GLSL ES 3.00 and processes the final framebuffer with these effects in order:

1. Apply barrel distortion for screen curvature
2. Sample RGB channels with slight offsets (chromatic aberration)
3. Apply scanline pattern based on screen resolution
4. Apply vignette darkening
5. Add subtle time-based brightness flicker

## Troubleshooting

**Screen looks distorted/weird:** Make sure you're using the latest version with the corrected `curveScreen` function.

**Scanlines too thick/thin:** The scanline effect is resolution-dependent. Adjust `SCANLINE_INTENSITY` or modify the `scanline()`
function's multiplier.

**Effect too strong:** Reduce the intensity constants - start by halving them and adjust to taste.

## License

MIT — free to use in commercial and personal projects.

## Contributing

Contributions welcome! Feel free to submit issues or pull requests.

---

Made with ❤️ for the retro gaming and ExcaliburJS community
