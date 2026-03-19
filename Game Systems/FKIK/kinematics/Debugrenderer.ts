import * as ex from "excalibur";
import { Bone } from "./Bone";
import { BoneChain } from "./Bonechain";

export interface DebugRendererOptions {
  boneColor?: ex.Color;
  jointColor?: ex.Color;
  targetColor?: ex.Color;
  ringColor?: ex.Color;
  boneThickness?: number;
  jointRadius?: number;
  targetRadius?: number;
  /** Show local rotation angle text at each joint */
  showAngles?: boolean;
  /** Draw total-reach circle around the root bone */
  showRing?: boolean;
}

export class DebugRenderer {
  private engine: ex.Engine;
  private chain: BoneChain;
  private opts: Required<DebugRendererOptions>;

  private extraBones: Bone[] = [];

  constructor(engine: ex.Engine, chain: BoneChain, options: DebugRendererOptions = {}) {
    this.engine = engine;
    this.chain = chain;
    this.opts = {
      boneColor: options.boneColor ?? ex.Color.fromHex("#00ff99"),
      jointColor: options.jointColor ?? ex.Color.fromHex("#ffff00"),
      targetColor: options.targetColor ?? ex.Color.fromHex("#ff4466"),
      ringColor: options.ringColor ?? ex.Color.fromHex("#ffffff44"),
      boneThickness: options.boneThickness ?? 3,
      jointRadius: options.jointRadius ?? 6,
      targetRadius: options.targetRadius ?? 10,
      showAngles: options.showAngles ?? false,
      showRing: options.showRing ?? false,
    };
  }

  // ---------------------------------------------------------------------------
  // Public toggles — wire these to the controls panel
  // ---------------------------------------------------------------------------

  get showAngles() {
    return this.opts.showAngles;
  }
  set showAngles(v: boolean) {
    this.opts.showAngles = v;
  }

  get showRing() {
    return this.opts.showRing;
  }
  set showRing(v: boolean) {
    this.opts.showRing = v;
  }

  addBone(bone: Bone): void {
    this.extraBones.push(bone);
  }

  // ---------------------------------------------------------------------------
  // Main draw — call inside engine.on('postdraw')
  // ---------------------------------------------------------------------------

  draw(ctx: ex.ExcaliburGraphicsContext, target?: ex.Vector): void {
    const allBones = [...this.chain.bones, ...this.extraBones];

    if (this.opts.showRing) {
      this._drawReachRing(ctx);
    }

    for (const bone of allBones) {
      this._drawBoneSegment(ctx, bone);
      this._drawJoint(ctx, bone.startPosition);

      if (this.opts.showAngles) {
        this._drawAngleLabel(ctx, bone);
      }
    }

    // Tip joint
    if (this.chain.bones.length > 0) {
      this._drawJoint(ctx, this.chain.tip.endPosition);
    }

    if (target) {
      this._drawTarget(ctx, target);
    }
  }

  // ---------------------------------------------------------------------------
  // Private helpers
  // ---------------------------------------------------------------------------

  /**
   * Dashed circle showing maximum reach from the root bone's start position.
   * Drawn as a 64-segment polygon since ExcaliburGraphicsContext has no
   * native unfilled arc — every other segment is skipped for a dashed look.
   */
  private _drawReachRing(ctx: ex.ExcaliburGraphicsContext): void {
    const origin = this.chain.root.startPosition;
    const radius = this.chain.totalLength;
    const color = this.opts.ringColor;
    const segments = 64;

    for (let i = 0; i < segments; i++) {
      if (i % 2 === 0) continue; // skip alternating segments → dashed

      const a0 = (i / segments) * Math.PI * 2;
      const a1 = ((i + 1) / segments) * Math.PI * 2;

      ctx.drawLine(
        ex.vec(origin.x + Math.cos(a0) * radius, origin.y + Math.sin(a0) * radius),
        ex.vec(origin.x + Math.cos(a1) * radius, origin.y + Math.sin(a1) * radius),
        color,
        1,
      );
    }

    this._drawText(`reach: ${Math.round(radius)}px`, ex.vec(origin.x + radius + 4, origin.y - 4));
  }

  private _drawBoneSegment(ctx: ex.ExcaliburGraphicsContext, bone: Bone): void {
    ctx.drawLine(bone.startPosition, bone.endPosition, this.opts.boneColor, this.opts.boneThickness);
  }

  private _drawJoint(ctx: ex.ExcaliburGraphicsContext, pos: ex.Vector): void {
    ctx.drawCircle(pos, this.opts.jointRadius, this.opts.jointColor);
  }

  private _drawTarget(ctx: ex.ExcaliburGraphicsContext, pos: ex.Vector): void {
    const r = this.opts.targetRadius;
    const c = this.opts.targetColor;
    ctx.drawLine(ex.vec(pos.x - r, pos.y), ex.vec(pos.x + r, pos.y), c, 2);
    ctx.drawLine(ex.vec(pos.x, pos.y - r), ex.vec(pos.x, pos.y + r), c, 2);
    ctx.drawCircle(pos, r * 0.4, c);
  }

  private _drawAngleLabel(ctx: ex.ExcaliburGraphicsContext, bone: Bone): void {
    const degrees = (bone.localRotation * (180 / Math.PI)).toFixed(1) + "°";
    this._drawText(degrees, bone.startPosition, 8, -4);
  }

  /**
   * Shared text helper — converts world → screen coords then writes via the
   * raw Canvas 2D context, since ExcaliburGraphicsContext has no text primitive.
   */
  private _drawText(text: string, worldPos: ex.Vector, offsetX = 0, offsetY = 0): void {
    const canvas = (this.engine as any).canvas as HTMLCanvasElement | undefined;
    if (!canvas) return;
    const c2d = canvas.getContext("2d");
    if (!c2d) return;

    const screen = this.engine.worldToScreenCoordinates(worldPos);
    c2d.save();
    c2d.font = "11px monospace";
    c2d.fillStyle = "#ffffff";
    c2d.fillText(text, screen.x + offsetX, screen.y + offsetY);
    c2d.restore();
  }
}
