# TouchingComponent

A collision tracking component for [Excalibur.js](https://excaliburjs.com/) that monitors which entities are currently touching an
actor and from which direction.

## Features

- Tracks colliding entities by side (left, right, top, bottom)
- Maintains a separate set for passive (non-solid) entities
- Automatically updates collision state in real-time
- Efficient contact management using Maps and Sets

## Installation

This component requires Excalibur.js to be installed in your project:

```bash
npm install excalibur
```

## Usage

### Basic Setup

```typescript
import { Actor } from "excalibur";
import { TouchingComponent } from "./TouchingComponent";

const player = new Actor({
  pos: vec(100, 100),
  width: 32,
  height: 32,
});

// Add the component to your actor
const touching = new TouchingComponent();
player.addComponent(touching);

game.add(player);
```

### Checking Collisions

```typescript
// Check if anything is touching from the left
if (touching.left.size > 0) {
  console.log("Something is touching from the left!");
}

// Check if touching ground
if (touching.bottom.size > 0) {
  console.log("Player is on the ground");
}

// Iterate through all entities touching from the right
for (const entity of touching.right) {
  console.log("Touching entity:", entity.name);
}

// Check passive collisions (non-solid entities)
if (touching.passives.size > 0) {
  console.log("Overlapping with passive entities");
}
```

### Practical Example: Jump Only When Grounded

```typescript
import { Keys } from "excalibur";

// In your game update loop or input handler
game.input.keyboard.on("press", evt => {
  if (evt.key === Keys.Space) {
    const touching = player.get(TouchingComponent);

    // Only allow jumping if touching ground
    if (touching.bottom.size > 0) {
      player.vel.y = -300; // Jump!
    }
  }
});
```

## API Reference

### Properties

| Property   | Type                    | Description                               |
| ---------- | ----------------------- | ----------------------------------------- |
| `left`     | `Set<Actor \| TileMap>` | Entities touching from the left side      |
| `right`    | `Set<Actor \| TileMap>` | Entities touching from the right side     |
| `top`      | `Set<Actor \| TileMap>` | Entities touching from above              |
| `bottom`   | `Set<Actor \| TileMap>` | Entities touching from below              |
| `passives` | `Set<Actor \| TileMap>` | Non-solid entities overlapping this actor |

### Methods

| Method                | Description                                                                                  |
| --------------------- | -------------------------------------------------------------------------------------------- |
| `onAdd(owner: Actor)` | Automatically called when component is added to an actor. Sets up collision event listeners. |

## How It Works

1. **Collision Events**: The component listens to `collisionstart` and `collisionend` events on the owner actor
2. **Contact Tracking**: Each collision contact is stored in an internal Map with its associated actor and collision side
3. **Side Updates**: When collisions start or end, the component automatically updates the directional Sets (`left`, `right`, `top`,
   `bottom`)
4. **Efficient Queries**: Use `.size` to check if any collisions exist, or iterate through Sets to access specific entities

## Use Cases

- **Platform Game Movement**: Check if player is grounded before allowing jumps
- **Wall Detection**: Prevent movement into walls by checking directional collisions
- **Trigger Zones**: Use `passives` to detect overlaps with non-solid trigger areas
- **AI Behavior**: Enable enemies to react to collisions from specific directions
- **Climbing Mechanics**: Check for walls on left/right for wall-jumping or climbing

## Notes

- Only tracks entities with active or fixed colliders in directional sets
- Passive entities (non-solid) are tracked separately in the `passives` set
- Collision sides are determined by Excalibur's collision system
- All Sets are automatically cleared and updated each time a collision starts or ends

## License

This component is provided as-is for use with Excalibur.js projects.
