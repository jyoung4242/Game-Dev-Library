import { Actor, Component, Engine, Entity, Keys } from "excalibur";

export class KeyboardControl extends Component {
  heldDirections: string[] = [];
  speed: number = 100;
  engine: Engine | null | undefined = null;
  constructor(speed: number) {
    super();
    this.speed = speed;
  }

  init(owner: Actor) {
    this.owner = owner;
    this.engine = owner.scene?.engine;
  }

  onAdd(owner: Entity): void {
    this.owner?.on("preupdate", this.update.bind(this));
  }

  onRemove(previousOwner: Entity): void {
    this.owner?.off("preupdate", this.update.bind(this));
    this.heldDirections = [];
  }

  update() {
    const keyboard = this.engine?.input.keyboard;
    if (!keyboard) return;
    if (this.owner && this.engine && this.owner instanceof Actor) {
      if (keyboard.isHeld(Keys.Left) || keyboard.isHeld(Keys.A)) {
        if (this.heldDirections.includes("left")) return;
        this.heldDirections.push("left");
      } else {
        if (this.heldDirections.includes("left")) this.heldDirections.splice(this.heldDirections.indexOf("left"), 1);
      }

      if (keyboard.isHeld(Keys.Right) || keyboard.isHeld(Keys.D)) {
        if (this.heldDirections.includes("right")) return;
        this.heldDirections.push("right");
      } else {
        if (this.heldDirections.includes("right")) this.heldDirections.splice(this.heldDirections.indexOf("right"), 1);
      }

      if (keyboard.isHeld(Keys.Up) || keyboard.isHeld(Keys.W)) {
        if (this.heldDirections.includes("up")) return;
        this.heldDirections.push("up");
      } else {
        if (this.heldDirections.includes("up")) this.heldDirections.splice(this.heldDirections.indexOf("up"), 1);
      }

      if (keyboard.isHeld(Keys.Down) || keyboard.isHeld(Keys.S)) {
        if (this.heldDirections.includes("down")) return;
        this.heldDirections.push("down");
      } else {
        if (this.heldDirections.includes("down")) this.heldDirections.splice(this.heldDirections.indexOf("down"), 1);
      }
    }

    if (this.owner && this.heldDirections.length > 0 && this.owner instanceof Actor) {
      if (this.heldDirections.includes("left") || this.heldDirections.includes("right")) {
        if (this.heldDirections.includes("left")) this.owner.vel.x = -this.speed;
        else if (this.heldDirections.includes("right")) this.owner.vel.x = this.speed;
      } else this.owner.vel.x = 0;

      if (this.heldDirections.includes("up") || this.heldDirections.includes("down")) {
        if (this.heldDirections.includes("up")) this.owner.vel.y = -this.speed;
        else if (this.heldDirections.includes("down")) this.owner.vel.y = this.speed;
      } else this.owner.vel.y = 0;
    } else if (this.owner && this.owner instanceof Actor) this.owner.vel.x = this.owner.vel.y = 0;
  }
}
