import * as ex from "excalibur";
import { Bone } from "./Bone";
import { BoneChain } from "./Bonechain";

export type IKAlgorithm = "FABRIK" | "CCD";

export interface IKSolverOptions {
  /** Maximum solver iterations per frame (default: 10) */
  maxIterations?: number;
  /** Stop iterating when tip is within this distance of target (default: 0.5px) */
  tolerance?: number;
  /** Which algorithm to use (default: 'FABRIK') */
  algorithm?: IKAlgorithm;
  /**
   * Optional pole vector — a world-space hint point that biases the chain
   * to bend towards or away from a specific side (elbow/knee direction).
   * Only used by the FABRIK solver.
   */
  poleVector?: ex.Vector;
}

/**
 * IKSolver drives a BoneChain to reach a target position in 2D world space.
 *
 * Supports two algorithms:
 *   - FABRIK (Forward And Backward Reaching Inverse Kinematics)
 *   - CCD    (Cyclic Coordinate Descent)
 *
 * After solve(), the bone.localRotation values are updated.
 * You must follow with ForwardKinematicsSolver.solve(chain.root) to push
 * those rotations into world transforms and actor positions.
 */
export class IKSolver {
  readonly chain: BoneChain;
  readonly maxIterations: number;
  readonly tolerance: number;
  readonly algorithm: IKAlgorithm;
  poleVector?: ex.Vector;

  constructor(chain: BoneChain, options: IKSolverOptions = {}) {
    this.chain = chain;
    this.maxIterations = options.maxIterations ?? 10;
    this.tolerance = options.tolerance ?? 0.5;
    this.algorithm = options.algorithm ?? "FABRIK";
    this.poleVector = options.poleVector;
  }

  // ---------------------------------------------------------------------------
  // Public API
  // ---------------------------------------------------------------------------

  /**
   * Attempt to move the chain tip to `target`.
   * Returns true if the solver converged within tolerance.
   */
  solve(target: ex.Vector): boolean {
    if (this.algorithm === "CCD") {
      return this._solveCCD(target);
    }
    return this._solveFABRIK(target);
  }

  // ---------------------------------------------------------------------------
  // FABRIK
  // ---------------------------------------------------------------------------

  /**
   * FABRIK — Forward And Backward Reaching IK
   *
   * Works on an array of joint positions (bone starts + final tip).
   * Each iteration:
   *   Backward pass: pull tip to target, drag each joint backward along its bone.
   *   Forward pass:  anchor root, push each joint forward to restore bone lengths.
   *
   * After convergence, extract angles from the final joint positions and write
   * them back to bone.localRotation.
   */
  private _solveFABRIK(target: ex.Vector): boolean {
    const bones = this.chain.bones;
    const n = bones.length;

    // Joint positions: joints[i] = bones[i].startPosition, joints[n] = tip
    const joints: ex.Vector[] = [];
    for (const b of bones) joints.push(b.startPosition.clone());
    joints.push(bones[n - 1].endPosition.clone());

    const rootPos = joints[0].clone();
    const totalLen = this.chain.totalLength;
    const distToTarget = rootPos.distance(target);

    // If target is beyond reach, fully extend chain toward target
    if (distToTarget >= totalLen) {
      const dir = target.sub(rootPos).normalize();
      for (let i = 1; i <= n; i++) {
        joints[i] = joints[i - 1].add(dir.scale(bones[i - 1].length));
      }
      this._writeAnglesFromJoints(joints);
      return false; // did not converge (target unreachable)
    }

    let converged = false;

    for (let iter = 0; iter < this.maxIterations; iter++) {
      // --- Backward pass: tip → root ---
      joints[n] = target.clone();
      for (let i = n - 1; i >= 0; i--) {
        const dir = joints[i].sub(joints[i + 1]).normalize();
        joints[i] = joints[i + 1].add(dir.scale(bones[i].length));
      }

      // --- Forward pass: root → tip ---
      joints[0] = rootPos.clone();
      for (let i = 0; i < n; i++) {
        const dir = joints[i + 1].sub(joints[i]).normalize();
        joints[i + 1] = joints[i].add(dir.scale(bones[i].length));
      }

      // Apply pole vector bias (bends chain toward poleVector if set)
      if (this.poleVector) {
        this._applyPoleVector(joints);
      }

      // Check convergence
      if (joints[n].distance(target) <= this.tolerance) {
        converged = true;
        break;
      }
    }

    this._writeAnglesFromJoints(joints);
    return converged;
  }

  /**
   * Redistribute joints slightly toward the pole vector plane.
   * This is a simplified "pole hint" — projects mid-chain joints
   * toward the pole while preserving bone lengths.
   */
  private _applyPoleVector(joints: ex.Vector[]): void {
    if (!this.poleVector || joints.length < 3) return;
    const root = joints[0];
    const tip = joints[joints.length - 1];
    const pole = this.poleVector;

    // Blend interior joints a small amount toward the pole plane
    const blend = 0.15;
    for (let i = 1; i < joints.length - 1; i++) {
      const t = i / (joints.length - 1);
      // Linear interpolation anchor along root→tip
      const anchor = root.lerp(tip, t);
      // Direction toward pole from anchor
      const toPole = pole.sub(anchor);
      const poleDir = toPole.size > 0 ? toPole.normalize() : ex.vec(0, 0);
      joints[i] = joints[i].add(poleDir.scale(blend * toPole.size));
    }

    // Re-normalize bone lengths after the nudge
    const bones = this.chain.bones;
    for (let i = 0; i < joints.length - 1; i++) {
      const dir = joints[i + 1].sub(joints[i]).normalize();
      joints[i + 1] = joints[i].add(dir.scale(bones[i].length));
    }
  }

  /**
   * Given final joint positions from FABRIK, compute the angle each bone segment
   * makes in world space, then convert to local rotations and write to bones.
   *
   * Joint constraints and stiffness are applied here.
   */
  private _writeAnglesFromJoints(joints: ex.Vector[]): void {
    const bones = this.chain.bones;

    let parentWorldRot = 0;
    for (let i = 0; i < bones.length; i++) {
      const bone = bones[i];
      const seg = joints[i + 1].sub(joints[i]);
      const worldAngle = Math.atan2(seg.y, seg.x);

      // Convert world angle to local angle relative to parent
      let local = worldAngle - parentWorldRot;

      // Stiffness: interpolate toward rest (0)
      local = local * bone.stiffness;

      // Apply joint constraint
      if (bone.constraint) {
        local = ex.clamp(local, bone.constraint.min, bone.constraint.max);
      }

      bone.localRotation = local;
      parentWorldRot += local;
    }
  }

  // ---------------------------------------------------------------------------
  // CCD — Cyclic Coordinate Descent
  // ---------------------------------------------------------------------------

  /**
   * CCD iterates from the tip bone back toward the root.
   * Each bone is rotated so that, if it alone were to pivot,
   * the tip would point at the target.
   *
   * Per-bone:
   *   vec_to_tip    = tip - bone.start
   *   vec_to_target = target - bone.start
   *   delta_angle   = angle between those two vectors
   *   rotate bone by delta_angle, recompute all descendants via FK
   */
  private _solveCCD(target: ex.Vector): boolean {
    const bones = this.chain.bones;
    let converged = false;

    for (let iter = 0; iter < this.maxIterations; iter++) {
      // Re-run FK to get fresh world positions each iteration
      this._updateChainFK();

      const tipPos = this.chain.tip.endPosition;
      if (tipPos.distance(target) <= this.tolerance) {
        converged = true;
        break;
      }

      // Iterate bones from tip-parent back to root
      for (let i = bones.length - 1; i >= 0; i--) {
        const bone = bones[i];
        const boneOrigin = bone.startPosition;

        const toTip = this.chain.tip.endPosition.sub(boneOrigin);
        const toTarget = target.sub(boneOrigin);

        if (toTip.size < 0.001 || toTarget.size < 0.001) continue;

        // Signed angle from toTip to toTarget
        const angTip = Math.atan2(toTip.y, toTip.x);
        const angTarget = Math.atan2(toTarget.y, toTarget.x);
        let delta = angTarget - angTip;

        // Stiffness damping
        delta *= bone.stiffness;

        // Apply rotation
        bone.setRotation(bone.localRotation + delta);

        // Re-propagate FK for this subtree
        this._updateChainFK();
      }
    }

    return converged;
  }

  /**
   * Lightweight FK update limited to bones in this chain (no full tree walk).
   */
  private _updateChainFK(): void {
    for (const bone of this.chain.bones) {
      bone.updateWorldTransform();
    }
  }
}
