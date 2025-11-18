import { Action, ActionSequence, Actor, ActorEvents, Component, Engine, Entity, ParallelActions } from "excalibur";

export enum BehaviorStatus {
  Success = "success",
  Failure = "failure",
  Running = "running",
}

export enum BehaviorNodeStatus {
  Free = "free",
  Busy = "busy",
  Complete = "complete",
}

export class BehaviorTreeComponent extends Component {
  owner: Actor;
  private _verbose: boolean = false;
  private _root: RootNode;

  constructor(config: BTConfig) {
    super();
    this.owner = config.owner;
    if (config.verbose) this._verbose = config.verbose;
    this._root = new RootNode(config.owner, this);
  }

  onAdd(owner: Entity): void {
    this.owner.on("preupdate", this.update.bind(this));
  }

  get root() {
    return this._root;
  }

  get verbose() {
    return this._verbose;
  }

  set verbose(value: boolean) {
    this._verbose = value;
  }

  onRemove(previousOwner: Entity): void {
    this.owner.off("preupdate", this.update.bind(this));
  }

  interrupt(data?: any) {
    if (this._verbose) console.info("BT interrupt triggered", data);
    this.propagateInterrupt(this._root, data);
  }

  update(event: ActorEvents["preupdate"]) {
    if (this._verbose) console.info("BT component update -> root");
    this._root.update(event.engine, event.elapsed);
  }

  private propagateInterrupt(node: BehaviorNode, data?: any) {
    node.setInterrupt(true);
    if (node instanceof CompositeNode) {
      if (this._verbose) console.log("propagating interrupt", node.name, node.isInterrupted);

      node.children.forEach(child => this.propagateInterrupt(child, data));
    }
  }
}

export interface BTConfig {
  owner: Actor;
  verbose?: boolean;
}

export type BTActions = Action | ActionSequence | ParallelActions;

export abstract class BehaviorNode {
  owner: Actor;
  parentComponent: BehaviorTreeComponent;
  status: BehaviorNodeStatus = BehaviorNodeStatus.Free;
  isInterrupted: boolean = false;
  name: string;
  actions: BTActions | null = null;

  constructor(name: string, owner: Actor, parentComponent: BehaviorTreeComponent, actions: BTActions | null = null) {
    this.owner = owner;
    this.name = name;
    this.parentComponent = parentComponent;
    this.actions = actions;
  }

  setInterrupt(state: boolean) {
    if (this.parentComponent.verbose) console.info("BT interrupt set -> " + state + " -> " + this.name);
    this.isInterrupted = state;
  }

  getInterrupt(): boolean {
    return this.isInterrupted;
  }

  precondition(): boolean {
    return true;
  }

  update(engine: Engine, elapsed: number): BehaviorStatus {
    if (this.parentComponent.verbose) console.info("BT Behavior update -> " + this.name);

    if (this.isInterrupted) {
      if (this.parentComponent.verbose) console.info("BT interrupted", this.name);
      this.isInterrupted = false;
      this.status = BehaviorNodeStatus.Free;
      return BehaviorStatus.Failure;
    }

    if (this.status == BehaviorNodeStatus.Busy) {
      if (this.owner.actions.getQueue().isComplete() == true) {
        this.status = BehaviorNodeStatus.Complete;
      } else return BehaviorStatus.Running;
    }

    if (this.status == BehaviorNodeStatus.Complete) return BehaviorStatus.Success;

    if (this.precondition()) {
      this.status = BehaviorNodeStatus.Busy;
      if (this.parentComponent.verbose) console.info("BT running behavior -> " + this.name);
      if (this.actions !== null) {
        this.owner.actions.runAction(this.actions);
      }
    }

    return BehaviorStatus.Running;
  }
}

class CompositeNode extends BehaviorNode {
  children: BehaviorNode[] = [];

  addChild(child: BehaviorNode): void {
    this.children.push(child);
  }
}

export class RootNode extends CompositeNode {
  constructor(owner: Actor, parentComponent: BehaviorTreeComponent) {
    super("root", owner, parentComponent);
  }
  update(engine: Engine, delta: number): BehaviorStatus {
    for (const child of this.children) {
      if (child.isInterrupted) {
        child.isInterrupted = false;
        return BehaviorStatus.Failure;
      }
      if (child.precondition()) {
        const result = child.update(engine, delta);
        if (result !== BehaviorStatus.Failure) {
          return result;
        }
      } else continue;
    }
    return BehaviorStatus.Failure;
  }
}

export class SequenceNode extends CompositeNode {
  private currentIndex: number = 0; // Track which child is currently running

  // Runs each child in sequence, failing if any one fails, no precondition check
  update(engine: Engine, delta: number): BehaviorStatus {
    if (this.isInterrupted) {
      this.isInterrupted = false;
      this.currentIndex = 0;
      return BehaviorStatus.Failure;
    }

    if (this.parentComponent.verbose) console.info("BT running sequence -> " + this.name);
    const result = this.children[this.currentIndex].update(engine, delta);

    if (result == BehaviorStatus.Success) {
      this.currentIndex++;
    } else if (result == BehaviorStatus.Failure) {
      return result;
    }

    if (this.currentIndex >= this.children.length) {
      this.currentIndex = 0;
      //reset children
      for (const child of this.children) {
        child.status = BehaviorNodeStatus.Free;
      }
      return BehaviorStatus.Success;
    }
    return BehaviorStatus.Running;
  }
}

export class SelectorNode extends CompositeNode {
  // Runs through each child until one succeeds
  update(engine: Engine, delta: number): BehaviorStatus {
    if (this.parentComponent.verbose) console.info("BT running selector -> " + this.name);
    for (const child of this.children) {
      if (child.isInterrupted) {
        child.isInterrupted = false;
        return BehaviorStatus.Failure;
      }
      if (child.precondition()) {
        const result = child.update(engine, delta);
        if (result !== BehaviorStatus.Failure) {
          return result;
        }
      } else continue;
    }
    return BehaviorStatus.Failure;
  }
}
