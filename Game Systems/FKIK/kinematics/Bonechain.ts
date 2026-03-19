import * as ex from "excalibur";
import { Bone } from "./Bone";

/**
 * BoneChain is an ordered list of bones that form a contiguous kinematic chain.
 *
 * Convention: bones[0] is the root (shoulder), bones[n-1] is the tip (hand).
 * Each bone must be the parent of the next bone in the chain.
 */
export class BoneChain {
  readonly bones: Bone[];

  constructor(bones: Bone[]) {
    if (bones.length === 0) throw new Error("BoneChain: chain must contain at least one bone.");
    this.bones = bones;
  }

  // ---------------------------------------------------------------------------
  // Chain properties
  // ---------------------------------------------------------------------------

  get root(): Bone {
    return this.bones[0];
  }

  get tip(): Bone {
    return this.bones[this.bones.length - 1];
  }

  get length(): number {
    return this.bones.length;
  }

  /**
   * Total reachable length of the chain (sum of all bone lengths).
   */
  get totalLength(): number {
    return this.bones.reduce((sum, b) => sum + b.length, 0);
  }

  /**
   * World-space position of the chain root's start.
   */
  get rootPosition(): ex.Vector {
    return this.root.startPosition.clone();
  }

  /**
   * World-space position of the chain tip's end.
   */
  get tipPosition(): ex.Vector {
    return this.tip.endPosition.clone();
  }

  // ---------------------------------------------------------------------------
  // Dynamic modification
  // ---------------------------------------------------------------------------

  /**
   * Append a bone to the end of the chain.
   * Automatically sets parent/child relationship.
   */
  append(bone: Bone): void {
    const current = this.tip;
    current.addChild(bone);
    this.bones.push(bone);
  }

  /**
   * Remove the last bone in the chain.
   */
  pop(): Bone | undefined {
    if (this.bones.length <= 1) return undefined;
    const removed = this.bones.pop()!;
    removed.parent?.removeChild(removed);
    return removed;
  }

  /**
   * Check whether the target is reachable (within total chain length from root).
   */
  canReach(target: ex.Vector): boolean {
    return this.rootPosition.distance(target) <= this.totalLength;
  }

  // ---------------------------------------------------------------------------
  // Iteration helpers
  // ---------------------------------------------------------------------------

  forEach(fn: (bone: Bone, index: number) => void): void {
    this.bones.forEach(fn);
  }

  map<T>(fn: (bone: Bone, index: number) => T): T[] {
    return this.bones.map(fn);
  }
}
