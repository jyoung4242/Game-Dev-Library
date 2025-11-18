# Behavior Tree System for Excalibur.js

A powerful and flexible behavior tree implementation for creating intelligent AI characters in Excalibur.js games, written in
TypeScript.

## What are Behavior Trees?

Behavior Trees are a powerful way to create AI that can make decisions and perform complex behaviors. Think of them as flowcharts that
your game characters can follow to decide what to do next.

Imagine you're creating an enemy guard in your game. Without behavior trees, you might write a bunch of if/else statements:

```typescript
if (playerNearby) {
  if (canSeePlayer) {
    attackPlayer();
  } else {
    searchForPlayer();
  }
} else {
  patrol();
}
```

With behavior trees, you create a visual tree structure that's easier to understand, modify, and expand:

```
Guard Behavior
├── Is Player Nearby?
    ├── Can See Player?
        ├── Attack Player
        └── Search for Player
    └── Patrol Area
```

## Key Concepts

### Node Types

**Composite Nodes** - These control how their children execute:

- **Selector**: Tries each child until one succeeds (like "OR" logic)
- **Sequence**: Runs children in order, all must succeed (like "AND" logic)

**Leaf Nodes** - These do the actual work:

- **Action**: Performs an action (move, attack, etc.)
- **Condition**: Checks if something is true/false

**Decorator Nodes** - These modify how their child behaves:

- **Inverter**: Flips success/failure
- **Repeater**: Repeats a behavior multiple times

### Status Types

Every node returns one of these statuses:

- **Success**: The node completed successfully
- **Failure**: The node failed
- **Running**: The node is still working
- **Ready**: The node is ready to start

## Installation

```typescript
import { BehaviorTreeComponent, createBehaviorTree, BTActions, ConditionFunction } from "./behavior-tree";
import { Actor, Action } from "excalibur";
```

## Type Definitions

```typescript
// Function that returns true/false for conditions
type ConditionFunction = () => boolean;

// Function that returns an Excalibur action
type ActionFunction = () => BTActions;

// Valid behavior tree actions
type BTActions = Action | ParallelActions;

// Status returned by nodes
type BehaviorStatusType = "Success" | "Failure" | "Running" | "Ready";
```

## Quick Start

Here's how to create a simple patrol behavior for a guard:

```typescript
import { Actor, Vector } from "excalibur";
import { createBehaviorTree } from "./behavior-tree";

// Create your actor
const guard = new Actor({
  pos: new Vector(100, 100),
});

// Define some helper functions
const distanceToPlayer = (): number => guard.pos.distance(player.pos);
const hasLineOfSight = (): boolean => !wallsBetween(guard.pos, player.pos);
const getNextPatrolPoint = (): Vector => patrolPoints[currentPatrolIndex];

// Create a behavior tree
const behaviorTree = createBehaviorTree(guard)
  .selector("Guard AI")
  .sequence("Combat")
  .condition("Player Nearby", () => distanceToPlayer() < 100)
  .condition("Can See Player", () => hasLineOfSight())
  .action("Attack", () => guard.actions.moveTo(player.pos))
  .end()
  .action("Patrol", () => guard.actions.moveTo(getNextPatrolPoint()))
  .build();

// Add the behavior tree to your actor
guard.addComponent(behaviorTree);
```

## Detailed Examples

### Example 1: Simple Enemy AI

```typescript
interface Enemy extends Actor {
  health: number;
  attackCooldown: number;
}

const createEnemyAI = (enemy: Enemy, player: Actor) => {
  return (
    createBehaviorTree(enemy)
      .selector("Enemy Behavior")
      // First try to attack if player is close
      .sequence("Attack Sequence")
      .condition("Player in Range", () => enemy.pos.distance(player.pos) < 50)
      .condition("Attack Ready", () => enemy.attackCooldown <= 0)
      .action("Attack Player", () => enemy.actions.moveTo(player.pos))
      .end()

      // If can't attack, try to chase
      .sequence("Chase Sequence")
      .condition("Player Visible", () => canSeePlayer(enemy, player))
      .condition("Player Not Too Far", () => enemy.pos.distance(player.pos) < 200)
      .action("Chase Player", () => enemy.actions.moveTo(player.pos))
      .end()

      // Default: wander around
      .action("Wander", () => enemy.actions.moveTo(getRandomNearbyPoint(enemy.pos)))
      .build()
  );
};
```

### Example 2: Complex NPC with Multiple Behaviors

```typescript
interface NPC extends Actor {
  inventory: Item[];
  currentTask: string;
  homePosition: Vector;
}

const createNPCAI = (npc: NPC) => {
  return (
    createBehaviorTree(npc, "Sequence") // Root is a sequence
      .sequence("Daily Routine")
      // Morning routine
      .selector("Morning Activities")
      .sequence("Go to Work")
      .condition("Is Work Time", () => getCurrentHour() >= 9 && getCurrentHour() < 17)
      .condition("Not at Work", () => !npc.pos.equals(workLocation))
      .action("Walk to Work", () => npc.actions.moveTo(workLocation))
      .end()

      // If not work time, do home activities
      .sequence("Home Activities")
      .action("Return Home", () => npc.actions.moveTo(npc.homePosition))
      .selector("Home Tasks")
      .action("Rest", () => npc.actions.delay(2000))
      .action("Read Book", () => playAnimation(npc, "reading"))
      .end()
      .end()
      .end()

      // Handle player interactions
      .selector("Player Interaction")
      .sequence("Respond to Player")
      .condition("Player Nearby", () => npc.pos.distance(player.pos) < 30)
      .condition("Player Talking", () => playerIsTalking)
      .action("Start Conversation", () => startDialogue(npc, player))
      .end()
      .end()
      .build()
  );
};
```

### Example 3: Using Decorators

```typescript
const createPatrollingGuard = (guard: Actor) => {
  return (
    createBehaviorTree(guard)
      .selector("Guard AI")
      // Combat behavior
      .sequence("Combat")
      .condition("Enemy Spotted", () => enemyInSight())
      .inverter("Not Fleeing") // Inverts the result
      .condition("Low Health", () => guard.health < 20)
      .end()
      .action("Engage Enemy", () => guard.actions.moveTo(enemy.pos))
      .end()

      // Patrol behavior that repeats 3 times then takes a break
      .repeater("Patrol Cycle", 3)
      .sequence("Single Patrol")
      .action("Move to Point A", () => guard.actions.moveTo(pointA))
      .action("Look Around", () => guard.actions.delay(1000))
      .action("Move to Point B", () => guard.actions.moveTo(pointB))
      .action("Look Around", () => guard.actions.delay(1000))
      .end()
      .end()

      // Rest after patrol
      .action("Take Break", () => guard.actions.delay(5000))
      .build()
  );
};
```

## Advanced Features

### Interrupting Behaviors

You can interrupt a behavior tree at any time:

```typescript
const behaviorTree = createBehaviorTree(actor).build();

// Interrupt current behavior (e.g., when player is spotted)
behaviorTree.interrupt({ reason: "player_spotted" });

// Reset the tree to start from the beginning
behaviorTree.reset();
```

### Custom Condition Nodes

For more complex conditions, you can create custom condition classes:

```typescript
import { ConditionNode, BehaviorStatusType, BehaviorStatus } from "./behavior-tree";

class HealthCheckCondition extends ConditionNode {
  constructor(name: string, owner: Actor, parentComponent: BehaviorTreeComponent, private minHealth: number) {
    super(name, owner, parentComponent);
  }

  evaluate(): boolean {
    return (this.owner as any).health > this.minHealth;
  }
}
```

## Tree Visualization

You can log the structure of your behavior tree:

```typescript
const behaviorTree = createBehaviorTree(actor)
  .selector("Root")
  .action("Test Action", () => actor.actions.delay(1000))
  .build();

// Print the tree structure to console
behaviorTree.logTree();
// Output:
// ├─ SelectorNode[Root]
//   ├─ ActionNode[Test Action]
```

## Best Practices

1. **Keep conditions simple**: Conditions should be fast to evaluate
2. **Use meaningful names**: Name your nodes descriptively
3. **Start simple**: Begin with basic trees and add complexity gradually
4. **Handle interruptions**: Always consider what happens when behaviors are interrupted
5. **Test edge cases**: What happens when the player does something unexpected?

## API Reference

### Core Classes

- `BehaviorTreeComponent`: The main component to add to actors
- `TreeBuilder`: Fluent interface for building trees
- `BaseNode`: Base class for all nodes
- `ActionNode`: Executes Excalibur.js actions
- `ConditionNode`: Evaluates boolean conditions
- `SequenceNode`: Runs children in sequence
- `SelectorNode`: Tries children until one succeeds
- `InverterNode`: Inverts child result
- `RepeaterNode`: Repeats child behavior

### Builder Methods

- `.sequence(name)`: Create a sequence node
- `.selector(name)`: Create a selector node
- `.action(name, action)`: Create an action node
- `.condition(name, conditionFn)`: Create a condition node
- `.inverter(name)`: Create an inverter decorator
- `.repeater(name, times?)`: Create a repeater decorator
- `.end()`: Return to parent builder
- `.build()`: Create the final BehaviorTreeComponent
