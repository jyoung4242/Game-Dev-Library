//BehaviorTree.ts

import { Action, Actor, ActorEvents, Component, Engine, Entity, ParallelActions, EventEmitter } from "excalibur";

//#region Types and Interfaces

export type BTActions = Action | ParallelActions;

// Simplified status system - one enum to rule them all
export const BehaviorStatus = {
  Success: "Success",
  Failure: "Failure",
  Running: "Running",
  Ready: "Ready", // Replaces "Free" - node is ready to execute
} as const;

export type BehaviorStatusType = keyof typeof BehaviorStatus;

export interface BTConfig {
  owner: Actor;
  rootType?: "Sequence" | "Selector"; // default is Selector
}

type BehaviorTreeEvents = {
  interrupt: "interrupt";
  reset: "reset";
};

// Builder types
export type NodeBuilder = SequenceBuilder | SelectorBuilder | DecoratorBuilder;
export type ConditionFunction = () => boolean;
export type ActionFunction = () => BTActions;

//#endregion Types and Interfaces

//#region Component
export class BehaviorTreeComponent extends Component {
  owner: Actor;
  private _root: SelectorNode | SequenceNode;
  interruptEmitter: EventEmitter = new EventEmitter<BehaviorTreeEvents>();

  constructor(config: BTConfig) {
    super();
    this.owner = config.owner;

    this._root = this.createRootNode(config.rootType || "Selector");
    this.interruptEmitter = new EventEmitter<BehaviorTreeEvents>();
  }

  onAdd(owner: Entity): void {
    this.owner.on("postupdate", this.update.bind(this));
  }

  onRemove(previousOwner: Entity): void {
    this._root.destroy();
    this.owner.off("postupdate", this.update.bind(this));
  }

  get root() {
    return this._root;
  }

  interrupt(data?: any) {
    this.interruptEmitter.emit("interrupt", data);
  }

  reset() {
    this.interruptEmitter.emit("reset");
  }

  update(event: ActorEvents["preupdate"]) {
    this._root.update(event.engine, event.elapsed);
  }

  private createRootNode(type: "Sequence" | "Selector"): SelectorNode | SequenceNode {
    return type === "Sequence" ? new SequenceNode("root", this.owner, this) : new SelectorNode("root", this.owner, this);
  }

  // Builder entry points
  static createTree(owner: Actor, rootType: "Sequence" | "Selector" = "Selector"): TreeBuilder {
    return new TreeBuilder(owner, rootType);
  }

  logTree(node: BaseNode = this._root, depth: number = 0): void {
    const indent = "  ".repeat(depth);
    const nodeInfo = `${node.constructor.name}[${node.name}] `;
    console.log(`${indent}├─ ${nodeInfo}`);

    if ("children" in node && Array.isArray((node as any).children)) {
      (node as any).children.forEach((child: BaseNode) => {
        this.logTree(child, depth + 1);
      });
    }
  }
}

//#endregion Component

//#region Nodes
export abstract class BaseNode {
  owner: Actor;
  name: string;
  parentComponent: BehaviorTreeComponent;

  isInterrupted: boolean = false;
  isReset: boolean = false;
  interruptHandler?: () => void;
  resetHandler?: () => void;

  constructor(name: string, owner: Actor, parentComponent: BehaviorTreeComponent) {
    this.owner = owner;
    this.name = name;
    this.parentComponent = parentComponent;
    this.parentComponent.interruptEmitter.on("interrupt", (this.interruptHandler = this.onInterrupt.bind(this)));
    this.parentComponent.interruptEmitter.on("reset", (this.resetHandler = this.onReset.bind(this)));
  }

  onInterrupt() {
    this.isInterrupted = true;
  }

  onReset() {
    this.isReset = true;
  }

  destroy() {
    if (this.interruptHandler) {
      this.parentComponent.interruptEmitter.off("interrupt", this.interruptHandler);
    }
    if (this.resetHandler) {
      this.parentComponent.interruptEmitter.off("reset", this.resetHandler);
    }
  }

  abstract update(engine: Engine, elapsed: number): BehaviorStatusType;
}

abstract class CompositeNode extends BaseNode {
  currentIndex: number = 0;
  children: BaseNode[] = [];

  destroy() {
    for (const child of this.children) {
      child.destroy();
    }

    if (this.interruptHandler) {
      this.parentComponent.interruptEmitter.off("interrupt", this.interruptHandler);
    }
    if (this.resetHandler) {
      this.parentComponent.interruptEmitter.off("reset", this.resetHandler);
    }
  }

  addChild(child: BaseNode): void {
    if (!child) throw new Error("Child cannot be null");
    if (this.children.includes(child)) {
      throw new Error("Child already exists in this node");
    }
    this.children.push(child);
  }

  abstract update(engine: Engine, elapsed: number): BehaviorStatusType;
}

// define sequence and selector
class SequenceNode extends CompositeNode {
  update(engine: Engine, elapsed: number): BehaviorStatusType {
    //gaurd condition
    if (this.children.length === 0) return BehaviorStatus.Failure;

    // handle interrupt
    if (this.isInterrupted) {
      this.isInterrupted = false;
      return BehaviorStatus.Failure;
    }

    // handle reset
    if (this.isReset) {
      this.isReset = false;
      this.isInterrupted = false;
      this.currentIndex = 0;
      return BehaviorStatus.Ready;
    }

    const result = this.children[this.currentIndex].update(engine, elapsed);

    if (result === BehaviorStatus.Success) {
      this.currentIndex++;
    } else if (result === BehaviorStatus.Failure) {
      this.currentIndex = 0;
      return BehaviorStatus.Failure;
    }

    if (this.currentIndex >= this.children.length) {
      this.currentIndex = 0;
      // Reset children
      for (const child of this.children) {
        child.onReset();
      }
      return BehaviorStatus.Success;
    } else {
      return BehaviorStatus.Running;
    }
  }
}

class SelectorNode extends CompositeNode {
  update(engine: Engine, elapsed: number): BehaviorStatusType {
    //gaurd condition
    if (this.children.length === 0) return BehaviorStatus.Failure;

    // handle interrupt
    if (this.isInterrupted) {
      this.isInterrupted = false;
      return BehaviorStatus.Failure;
    }

    // handle reset
    if (this.isReset) {
      this.isReset = false;
      this.isInterrupted = false;
      this.currentIndex = 0;
      return BehaviorStatus.Ready;
    }

    const result = this.children[this.currentIndex].update(engine, elapsed);

    if (result === BehaviorStatus.Failure) {
      this.currentIndex++;
    } else if (result === BehaviorStatus.Success) {
      this.currentIndex = 0;
      // Reset children
      for (const child of this.children) {
        child.onReset();
      }
      return BehaviorStatus.Success;
    }

    if (this.currentIndex >= this.children.length) {
      this.currentIndex = 0;
      // Reset children
      for (const child of this.children) {
        child.onReset();
      }
      return BehaviorStatus.Failure;
    }

    return BehaviorStatus.Running;
  }
}

// define leaf nodes, actions and conditions
export class ActionNode extends BaseNode {
  private hasStarted = false;
  action: BTActions;

  constructor(name: string, owner: Actor, parentComponent: BehaviorTreeComponent, action: BTActions) {
    super(name, owner, parentComponent);
    this.action = action;
  }

  protected handleInterruptStateChange(): void {
    // Clean up action state when interrupted
    if (this.hasStarted) {
      this.owner.actions.clearActions();
    }
  }

  protected handleResetStateChange(): void {
    // Clean up action state when reset
    if (this.hasStarted) {
      this.owner.actions.clearActions();
    }
    this.hasStarted = false;
  }

  update(engine: Engine, elapsed: number): BehaviorStatusType {
    // handle interrupt
    if (this.isInterrupted) {
      this.isInterrupted = false;
      this.owner.actions.clearActions();
      return BehaviorStatus.Failure;
    }

    // handle reset
    if (this.isReset) {
      this.isReset = false;
      this.owner.actions.clearActions();
      this.isInterrupted = false;
      return BehaviorStatus.Ready;
    }

    if (!this.hasStarted) {
      // Start the action once
      this.owner.actions.runAction(this.action);
      this.hasStarted = true;
    }

    // Check if action is finished
    if (this.hasStarted && this.action.isComplete(this.owner)) {
      this.hasStarted = false; // reset action
      return BehaviorStatus.Success;
    }

    return BehaviorStatus.Running;
  }
}

export abstract class ConditionNode extends BaseNode {
  abstract evaluate(): boolean;

  update(engine: Engine, elapsed: number): BehaviorStatusType {
    // Conditions should always evaluate fresh, even if interrupted
    // (unless you want different behavior)
    return this.evaluate() ? BehaviorStatus.Success : BehaviorStatus.Failure;
  }
}

// Function-based condition for builder API
export class FunctionConditionNode extends ConditionNode {
  private conditionFn: ConditionFunction;

  constructor(name: string, owner: Actor, parentComponent: BehaviorTreeComponent, conditionFn: ConditionFunction) {
    super(name, owner, parentComponent);
    this.conditionFn = conditionFn;
  }

  evaluate(): boolean {
    return this.conditionFn();
  }
}

//#region Decorator Nodes

abstract class DecoratorNode extends BaseNode {
  protected child?: BaseNode;

  setChild(child: BaseNode): void {
    this.child = child;
  }

  destroy() {
    if (this.child) {
      this.child.destroy();
    }
    super.destroy();
  }

  abstract update(engine: Engine, elapsed: number): BehaviorStatusType;
}

export class InverterNode extends DecoratorNode {
  update(engine: Engine, elapsed: number): BehaviorStatusType {
    if (!this.child) return BehaviorStatus.Failure;

    // handle interrupt
    if (this.isInterrupted) {
      this.isInterrupted = false;
      return BehaviorStatus.Failure;
    }

    // handle reset
    if (this.isReset) {
      this.isReset = false;
      this.isInterrupted = false;
      return BehaviorStatus.Ready;
    }

    const result = this.child.update(engine, elapsed);

    switch (result) {
      case BehaviorStatus.Success:
        return BehaviorStatus.Failure;
      case BehaviorStatus.Failure:
        return BehaviorStatus.Success;
      default:
        return result; // Running or Ready
    }
  }
}

export class RepeaterNode extends DecoratorNode {
  private times?: number;
  private currentCount = 0;

  constructor(name: string, owner: Actor, parentComponent: BehaviorTreeComponent, times?: number) {
    super(name, owner, parentComponent);
    this.times = times;
  }

  update(engine: Engine, elapsed: number): BehaviorStatusType {
    if (!this.child) return BehaviorStatus.Failure;

    // handle interrupt
    if (this.isInterrupted) {
      this.isInterrupted = false;
      return BehaviorStatus.Failure;
    }

    // handle reset
    if (this.isReset) {
      this.isReset = false;
      this.isInterrupted = false;
      return BehaviorStatus.Ready;
    }

    const result = this.child.update(engine, elapsed);

    if (result === BehaviorStatus.Success) {
      this.currentCount++;

      if (this.times && this.currentCount >= this.times) {
        this.currentCount = 0;
        return BehaviorStatus.Success;
      }

      // Reset child for next iteration
      this.child.onReset();
      return BehaviorStatus.Running;
    }

    return result;
  }
}

//#endregion Decorator Nodes

//#endregion Nodes

//#region Builder Classes

export class TreeBuilder {
  private component: BehaviorTreeComponent;
  private owner: Actor;

  constructor(owner: Actor, rootType: "Sequence" | "Selector" = "Selector") {
    this.owner = owner;
    this.component = new BehaviorTreeComponent({ owner, rootType });
  }

  // Methods to add children to the root node
  sequence(name: string): SequenceBuilder {
    const child = new SequenceNode(name, this.owner, this.component);
    (this.component.root as CompositeNode).addChild(child);
    return new SequenceBuilder(child, this.owner, this.component, this);
  }

  selector(name: string): SelectorBuilder {
    const child = new SelectorNode(name, this.owner, this.component);
    (this.component.root as CompositeNode).addChild(child);
    return new SelectorBuilder(child, this.owner, this.component, this);
  }

  action(name: string, actionOrFn: BTActions | ActionFunction): TreeBuilder {
    const action = typeof actionOrFn === "function" ? actionOrFn() : actionOrFn;
    const child = new ActionNode(name, this.owner, this.component, action);
    (this.component.root as CompositeNode).addChild(child);
    return this;
  }

  condition(name: string, conditionFn: ConditionFunction): TreeBuilder {
    const child = new FunctionConditionNode(name, this.owner, this.component, conditionFn);
    (this.component.root as CompositeNode).addChild(child);
    return this;
  }

  inverter(name: string): DecoratorBuilder {
    const child = new InverterNode(name, this.owner, this.component);
    (this.component.root as CompositeNode).addChild(child);
    return new DecoratorBuilder(child, this.owner, this.component, this);
  }

  repeater(name: string, times?: number): DecoratorBuilder {
    const child = new RepeaterNode(name, this.owner, this.component, times);
    (this.component.root as CompositeNode).addChild(child);
    return new DecoratorBuilder(child, this.owner, this.component, this);
  }

  // Get direct access to root builder
  root(): SequenceBuilder | SelectorBuilder {
    if (this.component.root instanceof SequenceNode) {
      return new SequenceBuilder(this.component.root, this.owner, this.component, this);
    } else {
      return new SelectorBuilder(this.component.root, this.owner, this.component, this);
    }
  }

  build(): BehaviorTreeComponent {
    return this.component;
  }
}

abstract class BaseBuilder<T extends BaseNode> {
  protected node: T;
  protected owner: Actor;
  protected component: BehaviorTreeComponent;
  protected parentBuilder?: TreeBuilder | BaseBuilder<any>;

  constructor(node: T, owner: Actor, component: BehaviorTreeComponent, parentBuilder?: TreeBuilder | BaseBuilder<any>) {
    this.node = node;
    this.owner = owner;
    this.component = component;
    this.parentBuilder = parentBuilder;
  }

  root(): TreeBuilder {
    let current: TreeBuilder | BaseBuilder<any> | undefined = this.parentBuilder;
    while (current && !(current instanceof TreeBuilder)) {
      current = (current as BaseBuilder<any>).parentBuilder;
    }
    return (current as TreeBuilder) || new TreeBuilder(this.owner);
  }

  build(): BehaviorTreeComponent {
    return this.component;
  }

  end(): TreeBuilder | BaseBuilder<any> {
    return this.parentBuilder || new TreeBuilder(this.owner);
  }
}

export class SequenceBuilder extends BaseBuilder<SequenceNode> {
  // Add child nodes
  sequence(name: string): SequenceBuilder {
    const child = new SequenceNode(name, this.owner, this.component);
    this.node.addChild(child);
    return new SequenceBuilder(child, this.owner, this.component, this);
  }

  selector(name: string): SelectorBuilder {
    const child = new SelectorNode(name, this.owner, this.component);
    this.node.addChild(child);
    return new SelectorBuilder(child, this.owner, this.component, this);
  }

  action(name: string, actionOrFn: BTActions | ActionFunction): SequenceBuilder {
    const action = typeof actionOrFn === "function" ? actionOrFn() : actionOrFn;
    const child = new ActionNode(name, this.owner, this.component, action);
    this.node.addChild(child);
    return this;
  }

  condition(name: string, conditionFn: ConditionFunction): SequenceBuilder {
    const child = new FunctionConditionNode(name, this.owner, this.component, conditionFn);
    this.node.addChild(child);
    return this;
  }

  inverter(name: string): DecoratorBuilder {
    const child = new InverterNode(name, this.owner, this.component);
    this.node.addChild(child);
    return new DecoratorBuilder(child, this.owner, this.component, this);
  }

  repeater(name: string, times?: number): DecoratorBuilder {
    const child = new RepeaterNode(name, this.owner, this.component, times);
    this.node.addChild(child);
    return new DecoratorBuilder(child, this.owner, this.component, this);
  }

  // Fluent chaining
  do(builderFn: (builder: SequenceBuilder) => void): SequenceBuilder {
    builderFn(this);
    return this;
  }
}

export class SelectorBuilder extends BaseBuilder<SelectorNode> {
  sequence(name: string): SequenceBuilder {
    const child = new SequenceNode(name, this.owner, this.component);
    this.node.addChild(child);
    return new SequenceBuilder(child, this.owner, this.component, this);
  }

  selector(name: string): SelectorBuilder {
    const child = new SelectorNode(name, this.owner, this.component);
    this.node.addChild(child);
    return new SelectorBuilder(child, this.owner, this.component, this);
  }

  action(name: string, actionOrFn: BTActions | ActionFunction): SelectorBuilder {
    const action = typeof actionOrFn === "function" ? actionOrFn() : actionOrFn;
    const child = new ActionNode(name, this.owner, this.component, action);
    this.node.addChild(child);
    return this;
  }

  condition(name: string, conditionFn: ConditionFunction): SelectorBuilder {
    const child = new FunctionConditionNode(name, this.owner, this.component, conditionFn);
    this.node.addChild(child);
    return this;
  }

  inverter(name: string): DecoratorBuilder {
    const child = new InverterNode(name, this.owner, this.component);
    this.node.addChild(child);
    return new DecoratorBuilder(child, this.owner, this.component, this);
  }

  repeater(name: string, times?: number): DecoratorBuilder {
    const child = new RepeaterNode(name, this.owner, this.component, times);
    this.node.addChild(child);
    return new DecoratorBuilder(child, this.owner, this.component, this);
  }

  do(builderFn: (builder: SelectorBuilder) => void): SelectorBuilder {
    builderFn(this);
    return this;
  }
}

export class DecoratorBuilder extends BaseBuilder<DecoratorNode> {
  sequence(name: string): SequenceBuilder {
    const child = new SequenceNode(name, this.owner, this.component);
    this.node.setChild(child);
    return new SequenceBuilder(child, this.owner, this.component, this);
  }

  selector(name: string): SelectorBuilder {
    const child = new SelectorNode(name, this.owner, this.component);
    this.node.setChild(child);
    return new SelectorBuilder(child, this.owner, this.component, this);
  }

  action(name: string, actionOrFn: BTActions | ActionFunction): DecoratorBuilder {
    const action = typeof actionOrFn === "function" ? actionOrFn() : actionOrFn;
    const child = new ActionNode(name, this.owner, this.component, action);
    this.node.setChild(child);
    return this;
  }

  condition(name: string, conditionFn: ConditionFunction): DecoratorBuilder {
    const child = new FunctionConditionNode(name, this.owner, this.component, conditionFn);
    this.node.setChild(child);
    return this;
  }
}

//#endregion Builder Classes

//#region utilities
// Convenience function for quick tree creation
export function createBehaviorTree(owner: Actor, rootType?: "Sequence" | "Selector"): TreeBuilder {
  return BehaviorTreeComponent.createTree(owner, rootType);
}

//#endregion utilities
