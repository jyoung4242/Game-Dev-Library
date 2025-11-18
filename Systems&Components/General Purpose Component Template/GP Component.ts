import { Actor, ActorEvents, Component, Entity } from "excalibur";

export class MyComponent extends Component {
  constructor(public owner: Actor) {
    super();
  }

  onAdd = (): void => {
    //setup code
    this.owner.on("preupdate", this.onPreUpdate);
  };

  onRemove(previousOwner: Entity): void {
    //teardown code
    this.owner.off("preupdate", this.onPreUpdate);
  }

  onPreUpdate(event: ActorEvents["preupdate"]): void {}
}
