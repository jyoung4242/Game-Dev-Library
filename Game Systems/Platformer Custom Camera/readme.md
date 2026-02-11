# LookAheadCameraStrategy

A custom ExcaliburJS camera strategy that provides smooth "look-ahead" functionality for side-scrolling platformers. The camera shifts
horizontally in the direction of player movement, giving players visual space to see what's ahead.

## Features

- **Horizontal-only positioning**: Only affects the X-axis, allowing composition with other camera strategies
- **Smooth transitions**: Uses linear interpolation (lerp) for natural camera movement
- **Velocity-based**: Responds to player movement direction and speed
- **Composable**: Works alongside other ExcaliburJS camera strategies like `lockToActorAxis` and `limitCameraBounds`

## Installation

Copy the `LookAheadCameraStrategy` class into your project:

```typescript
class LookAheadCameraStrategy implements CameraStrategy {
  constructor(
    private actor: Actor,
    private lookAheadDistance: number = 150,
    private lerpSpeed: number = 0.08,
  ) {}

  private currentOffset = 0;

  public action(target: Vector, camera: Camera, _engine: Engine, _delta: number) {
    // Start from camera's current focus
    const currentFocus = camera.getFocus();

    // Determine target offset based on movement
    let targetOffset = 0;
    if (this.actor.vel.x > 10) {
      targetOffset = this.lookAheadDistance;
    } else if (this.actor.vel.x < -10) {
      targetOffset = -this.lookAheadDistance;
    }

    // Smooth transition
    this.currentOffset += (targetOffset - this.currentOffset) * this.lerpSpeed;

    // Only modify X, preserve Y from current focus
    target.x = this.actor.pos.x + this.currentOffset;
    target.y = currentFocus.y;

    return target;
  }
}
```

## Usage

### Basic Setup

```typescript
// Set up your camera with zoom
engine.currentScene.camera.zoom = 2.7;

// Lock Y-axis to follow player vertically
engine.currentScene.camera.strategy.lockToActorAxis(player, Axis.Y);

// Add look-ahead strategy for horizontal positioning
engine.currentScene.camera.addStrategy(new LookAheadCameraStrategy(player, 150, 0.08));

// Limit camera bounds to your level size
engine.currentScene.camera.strategy.limitCameraBounds(new BoundingBox(0, 0, 80 * 16, 16 * 16));
```

## Configuration

### Constructor Parameters

| Parameter           | Type     | Default    | Description                                                   |
| ------------------- | -------- | ---------- | ------------------------------------------------------------- |
| `actor`             | `Actor`  | _required_ | The actor (typically the player) to follow                    |
| `lookAheadDistance` | `number` | `150`      | How far ahead (in pixels) the camera looks when moving        |
| `lerpSpeed`         | `number` | `0.08`     | Speed of camera transition (0-1, lower = smoother but slower) |

### Tuning Guide

**lookAheadDistance**

- Smaller values (50-100): Tight camera, less look-ahead
- Medium values (100-200): Balanced for most platformers
- Larger values (200-300): Wide view, good for fast-paced games

**lerpSpeed**

- Lower values (0.02-0.05): Very smooth, cinematic feel
- Medium values (0.06-0.10): Responsive but natural
- Higher values (0.10-0.20): Snappy, arcade-like

Lower thresholds make the camera respond to smaller movements, higher thresholds require more speed before the camera shifts.

## How It Works

1. **Velocity Detection**: Checks the player's horizontal velocity
2. **Target Calculation**: Sets a target camera offset based on movement direction
3. **Smooth Interpolation**: Gradually moves the current offset toward the target using lerp
4. **Position Update**: Updates camera X position while preserving Y from other strategies
5. **Composition**: Uses `camera.getFocus()` to play nicely with other camera strategies

## License

Free to use and modify for your ExcaliburJS projects.
