import { Bone } from "./Bone";

/**
 * ForwardKinematicsSolver propagates transforms down a bone hierarchy.
 *
 * Algorithm:
 *   1. Update the root bone's world transform from its local rotation + actor position.
 *   2. For each child, set:
 *        child.startPosition = parent.endPosition
 *        child.worldRotation  = parent.worldRotation + child.localRotation
 *   3. Recurse depth-first through all descendants.
 *
 * Time complexity: O(n) where n = total bones in hierarchy.
 */
export class ForwardKinematicsSolver {
  /**
   * Recursively solve FK for the entire subtree rooted at `rootBone`.
   * Call this after modifying any localRotation values.
   */
  static solve(rootBone: Bone): void {
    ForwardKinematicsSolver._solveRecursive(rootBone);
  }

  private static _solveRecursive(bone: Bone): void {
    // Update this bone's world transform based on parent state
    bone.updateWorldTransform();

    // Propagate to children
    for (const child of bone.children) {
      ForwardKinematicsSolver._solveRecursive(child);
    }
  }
}
