# Destructive Actor Component

A component system for the Excalibur.js game engine that enables actors to destructively explode into physics-simulated fragments upon
destruction.

![screenshot](./ss.gif)

## Overview

The Destructive Actor Component provides a way to create dramatic destruction effects in your 2D games. When an actor with this
component is destroyed, it breaks apart into multiple irregular polygon fragments that follow realistic physics, including gravity,
velocity, rotation, and fading effects.

## Features

- **Physics-based fragments**: Each fragment obeys gravity and collision physics
- **Customizable destruction**: Control the number of fragments, force, and spread
- **Irregular polygon graphics**: Fragments use procedurally generated convex polygons for realistic debris
- **Performance optimized**: Uses object pooling to minimize garbage collection
- **Explosion animations**: Optional animated explosion effects
- **Configurable parameters**: Extensive customization options for fragment behavior

## Installation

Copy the `DestructiveActorComponent.ts` file into your project's components directory. Ensure you have the required dependencies
installed.

## Dependencies

- **Excalibur.js**: Core game engine
- **PlayerAnimations** from `../Animations/boom`: Explosion animation data (you may need to adjust the import path)

## Basic Usage

### 1. Import the component

```typescript
import { DestructiveComponent } from "./path/to/DestructiveActorComponent";
```

### 2. Create and configure the component

```typescript
// Create a destructive component with 5-10 fragments and moderate force
const destructiveComp = new DestructiveComponent(5, 10, 100, 500);
```

### 3. Add to an actor

```typescript
const myActor = new Actor({
  pos: vec(100, 100),
  width: 32,
  height: 32,
  // ... other actor properties
});

// Add the destructive component
myActor.addComponent(destructiveComp);
```

### 4. Trigger destruction

```typescript
// When you want the actor to explode
destructiveComp.explode();
```

## Configuration Options

### DestructiveComponent Constructor Parameters

```typescript
new DestructiveComponent(minPieces, maxPieces, minForce, maxForce);
```

- `minPieces`: Minimum number of fragments to spawn (number)
- `maxPieces`: Maximum number of fragments to spawn (number)
- `minForce`: Minimum lifetime for fragments in milliseconds (number)
- `maxForce`: Maximum lifetime for fragments in milliseconds (number)

### Fragment Options

Fragments are automatically configured with default physics parameters, but you can customize them by modifying the `FragmentOptions`
interface:

```typescript
interface FragmentOptions {
  pos: Vector; // Starting position
  size: number; // Radius of the fragment
  color: Color; // Fragment color
  index: number; // Fragment index (auto-assigned)
  total: number; // Total fragments (auto-assigned)
  lifetime: number; // Milliseconds before fade begins
  angleJitter: number; // Random spread in radians (default: 0.8)
  speedMin: number; // Minimum initial speed (default: 80)
  speedMax: number; // Maximum initial speed (default: 260)
  spinMax: number; // Maximum angular velocity (default: 8)
  spinDamping: number; // Rotation damping per second (default: 0.97)
  inwardBias: number; // Chance fragments fire inward (default: 0)
}
```

## Advanced Usage

### Custom Fragment Graphics

You can create custom fragment shapes using the `FragmentPolygonGraphic`:

```typescript
const customGraphic = new FragmentPolygonGraphic({
  vertexCount: 5, // 5-sided polygon
  radius: 15, // Size
  irregularity: 0.3, // How irregular the shape is
  color: Color.Red,
  strokeColor: Color.Black,
  strokeWidth: 2,
});
```

### Adding Explosion Effects

The component includes a `Boom` actor for explosion animations. You can spawn these manually:

```typescript
import { BoomPool } from "./path/to/DestructiveActorComponent";

// Spawn an explosion at a position
const explosion = BoomPool.rent();
explosion.reset(vec(100, 100));
scene.add(explosion);
```

### Performance Considerations

- The component uses object pools to reuse fragments and explosions
- Fragment count directly affects performance - use reasonable limits
- Fragments automatically clean themselves up after fading
- Consider the physics simulation cost for large numbers of fragments

## Example Implementation

```typescript
import { Actor, vec, Color, Engine } from "excalibur";
import { DestructiveComponent } from "./DestructiveActorComponent";

export class DestructibleBox extends Actor {
  private destructive: DestructiveComponent;

  constructor(pos: Vector) {
    super({
      pos,
      width: 32,
      height: 32,
      color: Color.Brown,
    });

    // Configure for 3-6 fragments with 500-1000ms lifetime
    this.destructive = new DestructiveComponent(3, 6, 500, 1000);
    this.addComponent(this.destructive);
  }

  // Call this when the box should be destroyed
  destroy() {
    this.destructive.explode();
  }
}

// Usage in your game
const box = new DestructibleBox(vec(200, 200));
scene.add(box);

// Later, when hit by something...
box.destroy();
```

## API Reference

### Classes

- `DestructiveComponent`: Main component class
- `Fragment`: Individual fragment actor
- `FragmentPolygonGraphic`: Polygon graphics for fragments
- `Boom`: Explosion animation actor

### Interfaces

- `FragmentOptions`: Configuration for fragment creation
- `FragmentPolygonOptions`: Configuration for polygon graphics

### Pools

- `DestructionPool`: Pool of reusable Fragment instances
- `BoomPool`: Pool of reusable Boom instances

## Notes

- Fragments use active collision by default
- Gravity is enabled on fragments for realistic falling
- Fragments fade out over 750ms after their lifetime expires
- The component automatically removes itself and the owner actor when exploding
- Ensure your scene has appropriate physics settings for the fragments to behave correctly
