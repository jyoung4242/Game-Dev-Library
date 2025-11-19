import { Component, Entity, Frame, GraphicsComponent, Animation, Color } from "excalibur";

export class AnimationComponent<Keys extends string> extends Component {
  declare owner: Entity & { graphics: GraphicsComponent };
  type = "animation";
  currentName: string = "";
  private _currentAnimationName: Keys | null = null;
  private _animations: Record<Keys, Animation>;
  private _speed = 1;
  constructor(animations: Record<Keys, Animation>) {
    super();
    this._animations = animations;
  }

  set(name: Keys, startFromFrame: number = 0, durationLeft?: number) {
    const prevAnim = this.owner.graphics.current!;
    this.currentName = name;
    const anim = this._animations[name];

    // return if the animation is already playing
    if (this.is(name)) return;

    if (startFromFrame) {
      anim.goToFrame(startFromFrame, durationLeft);
    } else {
      anim.reset();
    }

    // carry over scale from the previous graphic
    if (prevAnim) {
      anim.scale.setTo(prevAnim.scale.x, prevAnim.scale.y);
      anim.opacity = prevAnim.opacity;
    }

    this.owner.graphics.use(anim);
  }

  reset() {
    //@ts-ignore
    const anim = this._animations[this.currentName];
    anim.goToFrame(0);
    anim.reset();
  }

  tint(color: Color | null) {
    if (this.current === undefined) return;
    if (color === null) this.current.tint = Color.White;
    else this.current.tint = color;
  }

  get(name: Keys) {
    return this._animations[name];
  }

  get current() {
    return this.owner.graphics.current;
  }

  get currentFrame() {
    //@ts-ignore
    const anim: Animation = this._animations[this.currentName];
    return anim.currentFrameIndex;
  }

  is(animation: Keys) {
    return this.get(this._currentAnimationName as Keys) === this.get(animation);
  }

  set speed(speed: number) {
    this._speed = speed;
  }

  get speed() {
    return this._speed;
  }
}
