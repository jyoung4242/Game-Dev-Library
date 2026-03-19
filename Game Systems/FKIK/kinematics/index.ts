/**
 * @module kinematics
 *
 * FK / IK skeletal animation module for ExcaliburJS.
 *
 * Quick-start:
 *
 *   import { Bone, BoneChain, ForwardKinematicsSolver, IKSolver, DebugRenderer, makeBone } from './kinematics';
 *
 *   const chain = new BoneChain([shoulder, upperArm, forearm, hand]);
 *   const solver = new IKSolver(chain, { algorithm: 'FABRIK', maxIterations: 20 });
 *
 *   engine.on('preupdate', () => {
 *     solver.solve(mouseTarget);
 *     ForwardKinematicsSolver.solve(chain.root);
 *   });
 */

export { Bone, makeBone } from "./Bone";
export type { BoneOptions, JointConstraint } from "./Bone";

export { BoneChain } from "./Bonechain";

export { ForwardKinematicsSolver } from "./Forwardkinematicssolver";

export { IKSolver } from "./Iksolver";
export type { IKSolverOptions, IKAlgorithm } from "./Iksolver";

export { DebugRenderer } from "./Debugrenderer";
export type { DebugRendererOptions } from "./Debugrenderer";
