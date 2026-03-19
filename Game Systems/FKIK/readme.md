# Kinematics Library

A Forward Kinematics (FK) and Inverse Kinematics (IK) library for 2D skeletal animation in ExcaliburJS.

## Overview

This library provides tools for creating and animating bone-based skeletons in 2D games. It supports:

- **Forward Kinematics (FK)**: Propagating rotations from parent bones to children.
- **Inverse Kinematics (IK)**: Solving for bone rotations to reach a target position.
- **Bone Chains**: Managing connected sequences of bones.
- **Debug Rendering**: Visualizing bones, joints, and IK targets.

## Installation

Copy the `kinematics/` directory into your ExcaliburJS project.

## Import

```typescript
import { Bone, BoneChain, ForwardKinematicsSolver, IKSolver, DebugRenderer, makeBone } from './kinematics';
```

## Basic Usage

### Creating Bones

Use the `makeBone` helper to create bones with associated Excalibur actors:

```typescript
import * as ex from 'excalibur';

const scene = engine.currentScene;

// Create bones
const shoulder = makeBone(scene, { length: 50, pos: ex.vec(100, 100), color: ex.Color.Red });
const upperArm = makeBone(scene, { length: 40, pos: ex.vec(150, 100), color: ex.Color.Blue });
const forearm = makeBone(scene, { length: 30, pos: ex.vec(190, 100), color: ex.Color.Green });
const hand = makeBone(scene, { length: 20, pos: ex.vec(220, 100), color: ex.Color.Yellow });

// Set up hierarchy
shoulder.addChild(upperArm);
upperArm.addChild(forearm);
forearm.addChild(hand);
```

### Creating a Bone Chain

```typescript
const chain = new BoneChain([shoulder, upperArm, forearm, hand]);
```

### Forward Kinematics

Update bone positions based on rotations:

```typescript
// Modify rotations
shoulder.localRotation = Math.PI / 4; // 45 degrees

// Solve FK
ForwardKinematicsSolver.solve(chain.root);
```

### Inverse Kinematics

Make the chain reach for a target:

```typescript
const solver = new IKSolver(chain, { algorithm: 'FABRIK', maxIterations: 20 });

// In game loop
engine.on('preupdate', () => {
  const mouseTarget = engine.input.pointers.primary.lastWorldPos;
  solver.solve(mouseTarget);
  ForwardKinematicsSolver.solve(chain.root);
});
```

### Debug Rendering

Visualize the skeleton:

```typescript
const debug = new DebugRenderer(engine, chain);

// In postdraw
engine.on('postdraw', (evt) => {
  debug.draw(evt.ctx, mouseTarget);
});
```

## API Reference

### Bone

Represents a single skeletal segment.

#### Constructor
```typescript
new Bone(options: BoneOptions)
```

#### Properties
- `actor: ex.Actor` - The associated Excalibur actor.
- `length: number` - Bone length in pixels.
- `localRotation: number` - Rotation relative to parent (radians).
- `worldRotation: number` - Absolute world rotation (radians).
- `startPosition: ex.Vector` - World position of bone start.
- `endPosition: ex.Vector` - World position of bone end.
- `constraint?: JointConstraint` - Optional rotation limits.
- `stiffness: number` - IK flexibility (0-1, default 1).

#### Methods
- `addChild(child: Bone)` - Add a child bone.
- `removeChild(child: Bone)` - Remove a child bone.
- `setRotation(angle: number)` - Set local rotation, respecting constraints.
- `updateWorldTransform()` - Update world transform from parent.
- `getEndPosition(): ex.Vector` - Get world position of bone tip.

### BoneChain

Manages an ordered sequence of connected bones.

#### Constructor
```typescript
new BoneChain(bones: Bone[])
```

#### Properties
- `bones: Bone[]` - Array of bones in the chain.
- `root: Bone` - First bone in the chain.
- `tip: Bone` - Last bone in the chain.
- `totalLength: number` - Sum of all bone lengths.

#### Methods
- `append(bone: Bone)` - Add bone to end of chain.
- `pop(): Bone | undefined` - Remove last bone.
- `canReach(target: ex.Vector): boolean` - Check if target is reachable.

### ForwardKinematicsSolver

Propagates transforms down the bone hierarchy.

#### Methods
- `static solve(rootBone: Bone)` - Update all transforms from root.

### IKSolver

Solves inverse kinematics for a bone chain.

#### Constructor
```typescript
new IKSolver(chain: BoneChain, options?: IKSolverOptions)
```

#### Options
- `maxIterations?: number` - Max iterations per solve (default: 10).
- `tolerance?: number` - Convergence threshold (default: 0.5).
- `algorithm?: IKAlgorithm` - 'FABRIK' or 'CCD' (default: 'FABRIK').
- `poleVector?: ex.Vector` - Bias direction for chain bending.

#### Methods
- `solve(target: ex.Vector): boolean` - Solve for target, returns convergence status.

### DebugRenderer

Renders debug visuals for bones and IK.

#### Constructor
```typescript
new DebugRenderer(engine: ex.Engine, chain: BoneChain, options?: DebugRendererOptions)
```

#### Options
- `boneColor?: ex.Color` - Color for bone segments.
- `jointColor?: ex.Color` - Color for joints.
- `targetColor?: ex.Color` - Color for IK target.
- `showAngles?: boolean` - Display rotation angles.
- `showRing?: boolean` - Show reach circle.

#### Methods
- `draw(ctx: ex.ExcaliburGraphicsContext, target?: ex.Vector)` - Render debug visuals.

## Developer Guidelines

### Coordinate System

- Uses Excalibur's coordinate system: +x right, +y down.
- Angles in radians, 0 = pointing right.
- Bone tips are at `start + vec(length, 0).rotate(worldRotation)`.

### Workflow

1. Create bones with `makeBone` or manually.
2. Set up parent-child relationships.
3. Create `BoneChain` for IK.
4. In game loop:
   - Update IK solver with target.
   - Solve forward kinematics.
   - Update debug renderer.

### Performance

- FK is O(n) for n bones.
- IK iterations depend on `maxIterations` (default 10).
- Use `stiffness` < 1 for partial IK influence.
- Apply constraints to prevent unnatural poses.

### Best Practices

- Keep bone lengths reasonable for your game's scale.
- Use constraints to limit joint ranges.
- Pole vectors help control chain bending direction.
- Debug rendering is essential during development.

### Common Issues

- Bones not updating: Ensure `ForwardKinematicsSolver.solve()` is called after IK.
- Unreachable targets: Check `chain.canReach(target)`.
- Jerky animation: Increase `maxIterations` or adjust `tolerance`.
- Wrong hierarchy: Verify parent-child relationships match bone order in chain.</content>
<parameter name="filePath">c:\programming\Game Dev Library\Game Systems\FKIK\kinematics\readme.md