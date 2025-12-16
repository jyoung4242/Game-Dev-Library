import { Engine, ScreenElement, ActorArgs, Vector, vec, Screen, GameEvent, EventEmitter, BoundingBox } from "excalibur";

export type PositionStrategy = "fixed" | "anchor-start" | "anchor-end" | "center" | "space-between" | "space-around" | "space-evenly";
export type AlignmentStrategy = "center" | "anchor-start" | "anchor-end";

type UILayoutEvents = {
  dirtyFlag: UILayoutDirtyFlag;
};

export class UILayoutDirtyFlag extends GameEvent<UILayout> {
  constructor() {
    super();
  }
}

export type UIContainerArgs = ActorArgs & {
  layoutDirection?: "horizontal" | "vertical";
  positionContentStrategy?: PositionStrategy;
  alignmentContentStrategy?: AlignmentStrategy;
  padding?:
    | number
    | {
        leftPadding: number;
        rightPadding: number;
        topPadding: number;
        bottomPadding: number;
      };
  gap?:
    | number
    | {
        verticalGap: number;
        horizontalGap: number;
      };
};

export class UILayout {
  uiEvents = new EventEmitter<UILayoutEvents>();
  private _rootContainer: UIContainer;
  layoutDirtyFlag: boolean;
  engine: Engine;
  screen: Screen;
  contentArea: BoundingBox;

  constructor(engine: Engine) {
    this.engine = engine;
    this.screen = engine.screen;
    this.contentArea = this.screen.contentArea;
    this.layoutDirtyFlag = true;

    window.addEventListener("resize", () => (this.layoutDirtyFlag = true));
    this.uiEvents.on("setDirty", () => {
      this.engine = engine;
      this.screen = engine.screen;
      this.contentArea = this.screen.contentArea;
      this.layoutDirtyFlag = true;
    });

    this._rootContainer = new UIContainer(
      {
        name: "root",
        anchor: Vector.Zero,
        width: this.screen.contentArea.width,
        height: this.screen.contentArea.height,
        positionContentStrategy: "fixed",
        pos: vec(0, 0),
        padding: 0,
        gap: 0,
      },
      this.uiEvents
    );

    this.engine.add(this._rootContainer);
  }

  get root() {
    return this._rootContainer;
  }

  update() {
    if (this.layoutDirtyFlag) {
      this._rootContainer.updateLayout();
      this.layoutDirtyFlag = false;
    }
  }
}

export class UIContainer extends ScreenElement {
  uiEvents: EventEmitter<UILayoutEvents> | null = null;
  private _layoutDirection: "horizontal" | "vertical" = "horizontal";
  private _parentContainer: UIContainer | null = null;
  private _childrenContainers: Array<UIContainer> = [];
  private _positionContentStrategy: PositionStrategy = "fixed";
  private _alignmentContentStrategy: AlignmentStrategy = "anchor-start";

  private _gap: {
    verticalGap: number;
    horizontalGap: number;
  } = {
    verticalGap: 0,
    horizontalGap: 0,
  };

  private _padding: {
    leftPadding: number;
    rightPadding: number;
    topPadding: number;
    bottomPadding: number;
  } = {
    leftPadding: 0,
    rightPadding: 0,
    topPadding: 0,
    bottomPadding: 0,
  };

  constructor(config: UIContainerArgs, emitter?: EventEmitter) {
    super(config);

    if (emitter) this.uiEvents = emitter;
    if (config.layoutDirection) this._layoutDirection = config.layoutDirection;
    if (config.positionContentStrategy) this._positionContentStrategy = config.positionContentStrategy;
    if (config.alignmentContentStrategy) this._alignmentContentStrategy = config.alignmentContentStrategy;

    if (typeof config.padding === "number") {
      this._padding = {
        leftPadding: config.padding,
        rightPadding: config.padding,
        topPadding: config.padding,
        bottomPadding: config.padding,
      };
    } else if (
      config.padding &&
      typeof config.padding === "object" &&
      "leftPadding" in config.padding &&
      "rightPadding" in config.padding &&
      "topPadding" in config.padding &&
      "bottomPadding" in config.padding
    ) {
      this._padding = config.padding;
    }

    if (typeof config.gap === "number") {
      this._gap = { verticalGap: config.gap, horizontalGap: config.gap };
    } else if (config.gap && typeof config.gap === "object" && "verticalGap" in config.gap && "horizontalGap" in config.gap) {
      this._gap = config.gap;
    }
  }

  get parentContainer(): UIContainer | null {
    return this._parentContainer;
  }

  get parentDims() {
    return this._parentContainer ? this._parentContainer.getDimension() : vec(0, 0);
  }

  get padding() {
    return this._padding;
  }

  registerUIEvents(events: EventEmitter) {
    this.uiEvents = events;
    for (const child of this._childrenContainers) {
      child.registerUIEvents(events);
    }
  }

  getDimension(): Vector {
    return vec(this.graphics.localBounds.width, this.graphics.localBounds.height);
  }

  get parentPadding() {
    return this._parentContainer ? this._parentContainer.padding : vec(0, 0);
  }

  getChildContainer(index: number): UIContainer | null {
    if (index < 0 || index > this._childrenContainers.length) return null;
    return this._childrenContainers[index];
  }

  addChildContainer(child: UIContainer) {
    super.addChild(child);
    this._childrenContainers.push(child);
    child._parentContainer = this;
    if (this.uiEvents) {
      child.registerUIEvents(this.uiEvents);
      this.uiEvents!.emit("setDirty", new UILayoutDirtyFlag());
    }
  }

  updateLayout() {
    let placementCursor: Vector = Vector.Zero;

    placementCursor = this.setStartingCursorPosition();

    for (const child of this._childrenContainers) {
      child.updateLayout();
    }
    // use placement strategies via strategy pattern

    let placementStrategy = this.getPlacementStrategy(placementCursor);

    placementStrategy.positionChildren(this._childrenContainers);
    return;
  }

  getPlacementStrategy(placementCursor: Vector): PlacementStrategy {
    if (this._positionContentStrategy === "fixed") {
      return new FixedPositioningStrategy(placementCursor, this._layoutDirection, this._alignmentContentStrategy, this._gap);
    } else if (this._positionContentStrategy === "anchor-end") {
      return new AnchorEndPositioningStrategy(placementCursor, this._layoutDirection, this._alignmentContentStrategy, this._gap);
    } else if (this._positionContentStrategy === "center") {
      return new CenterPositioningStrategy(placementCursor, this._layoutDirection, this._alignmentContentStrategy, this._gap);
    } else if (this._positionContentStrategy == "space-between") {
      return new SpaceBetweenPositioningStrategy(placementCursor, this._layoutDirection, this._alignmentContentStrategy, this._gap);
    } else if (this._positionContentStrategy == "space-around") {
      return new SpaceAroundPositioningStrategy(placementCursor, this._layoutDirection, this._alignmentContentStrategy, this._gap);
    } else if (this._positionContentStrategy == "space-evenly") {
      return new SpaceEvenlyPositioningStrategy(placementCursor, this._layoutDirection, this._alignmentContentStrategy, this._gap);
    } else {
      // "anchor-start" (default)
      return new AnchorStartPositioningStrategy(placementCursor, this._layoutDirection, this._alignmentContentStrategy, this._gap);
    }
  }

  setStartingCursorPosition(): Vector {
    // set starting point for child placement
    if (this._layoutDirection === "horizontal") {
      if (this._positionContentStrategy === "anchor-end") {
        return vec(this.getDimension().x - this._padding.rightPadding, this._padding.topPadding);
      } else if (this._positionContentStrategy === "center") {
        return vec((this.getDimension().x - this._padding.leftPadding - this._padding.rightPadding) / 2, this._padding.topPadding);
      } else if (this._positionContentStrategy === "fixed") {
        return vec(0, 0);
      } else {
        // "anchor-start" (default)
        return vec(this._padding.leftPadding, this._padding.topPadding);
      }
    } else {
      // "vertical"
      if (this._positionContentStrategy === "anchor-end") {
        return vec(this._padding.leftPadding, this.getDimension().y - this._padding.bottomPadding);
      } else if (this._positionContentStrategy === "center") {
        return vec(this._padding.leftPadding, (this.getDimension().y - this._padding.topPadding - this._padding.bottomPadding) / 2);
      } else if (this._positionContentStrategy === "fixed") {
        return vec(0, 0);
      } else {
        // "anchor-start" (default)
        return vec(this._padding.leftPadding, this._padding.topPadding);
      }
    }
  }
}

//positioningStrategies

export class PlacementStrategy {
  cursor: Vector;
  layoutDirection: "horizontal" | "vertical";
  alignment: AlignmentStrategy;
  gap: {
    verticalGap: number;
    horizontalGap: number;
  };
  constructor(
    cursor: Vector,
    layoutDirection: "horizontal" | "vertical",
    alignment: AlignmentStrategy,
    gap: { verticalGap: number; horizontalGap: number }
  ) {
    this.alignment = alignment;
    this.cursor = cursor;
    this.layoutDirection = layoutDirection;
    this.gap = gap;
  }
  positionChildren(children: UIContainer[]): void {}
  alignChild(
    child: UIContainer,
    parentDims: Vector,
    parentPadding: { topPadding: number; bottomPadding: number; leftPadding: number; rightPadding: number }
  ) {
    if (this.layoutDirection === "horizontal") {
      if (this.alignment === "center") {
        this.cursor.y = parentDims.y / 2 - child.getDimension().y / 2;
      } else if (this.alignment === "anchor-end") {
        this.cursor.y = parentDims.y - parentPadding.bottomPadding - child.getDimension().y;
      }
    } else {
      if (this.alignment === "center") {
        this.cursor.x = parentDims.x / 2 - child.getDimension().x / 2;
      } else if (this.alignment === "anchor-end") {
        this.cursor.x = parentDims.x - parentPadding.rightPadding - child.getDimension().x;
      }
    }
  }
}

export class FixedPositioningStrategy extends PlacementStrategy {
  positionChildren(children: UIContainer[]): void {
    for (const child of children) {
      //do nothing, use manually set positions
    }
  }
}

export class CenterPositioningStrategy extends PlacementStrategy {
  positionChildren(children: UIContainer[]): void {
    if (children.length === 0) return;
    if (children.some(child => !child.parentContainer)) return; // Exit the method early
    let parentWidth = children[0].parentDims.x;
    let totalChildrenDimension = 0;
    let parent = children[0].parentContainer;
    let parentDims = children[0].parentDims;

    for (const child of children) {
      totalChildrenDimension += child.getDimension().x;
      //if last index don't add gap
      if (children.indexOf(child) !== children.length - 1) {
        if (this.layoutDirection === "horizontal") {
          totalChildrenDimension += this.gap.horizontalGap;
        } else {
          totalChildrenDimension += this.gap.verticalGap;
        }
      }
    }

    // calculate center position for on-axis positioning
    if (this.layoutDirection === "horizontal") {
      this.cursor.x = (parentWidth - totalChildrenDimension) / 2;
    } else {
      this.cursor.y = (parentWidth - totalChildrenDimension) / 2;
    }

    for (const child of children) {
      this.alignChild(child, parentDims, parent!.padding);
      child.pos.x = this.cursor.x;
      child.pos.y = this.cursor.y;

      //move cursor based on gap
      if (this.layoutDirection === "horizontal") {
        this.cursor.x += child.getDimension().x + this.gap.horizontalGap;
      } else {
        this.cursor.y += child.getDimension().y + this.gap.verticalGap;
      }
    }
  }
}

export class AnchorEndPositioningStrategy extends PlacementStrategy {
  positionChildren(children: UIContainer[]): void {
    if (children.length === 0) return;
    if (children.some(child => !child.parentContainer)) return; // Exit the method early
    let parent = children[0].parentContainer;
    let parentDims = children[0].parentDims;

    let reversedChildren = children.reverse();

    for (const child of reversedChildren) {
      //move cursor based on layout direction after placement
      if (this.layoutDirection === "horizontal") {
        this.cursor.x -= child.getDimension().x;
      } else {
        this.cursor.y -= child.getDimension().y;
      }

      this.alignChild(child, parentDims, parent!.padding);

      child.pos.x = this.cursor.x;
      child.pos.y = this.cursor.y;

      //move cursor based on gap
      if (this.layoutDirection === "horizontal") {
        this.cursor.x -= this.gap.horizontalGap;
      } else {
        this.cursor.y -= this.gap.verticalGap;
      }
    }
  }
}

export class AnchorStartPositioningStrategy extends PlacementStrategy {
  positionChildren(children: UIContainer[]): void {
    if (children.length === 0) return;
    if (children.some(child => !child.parentContainer)) return; // Exit the method early
    let parent = children[0].parentContainer;
    let parentDims = children[0].parentDims;

    for (const child of children) {
      this.alignChild(child, parentDims, parent!.padding);

      child.pos.y = this.cursor.y;
      child.pos.x = this.cursor.x;

      //move cursor based on layout direction after placement
      if (this.layoutDirection === "horizontal") {
        this.cursor.x += child.getDimension().x + this.gap.horizontalGap;
      } else {
        this.cursor.y += child.getDimension().y + this.gap.verticalGap;
      }
    }
  }
}

export class SpaceBetweenPositioningStrategy extends PlacementStrategy {
  positionChildren(children: UIContainer[]): void {
    if (children.length === 0) return;
    if (children.some(child => !child.parentContainer)) return; // Exit the method early
    let parent = children[0].parentContainer;
    let parentDims = children[0].parentDims;

    const totalChildrenSize = children.reduce((sum, child) => {
      return sum + (this.layoutDirection === "horizontal" ? child.width : child.height);
    }, 0);

    const containerSize = this.layoutDirection === "horizontal" ? parentDims.x : parentDims.y;

    let availableSpace;
    if (this.layoutDirection === "horizontal") {
      availableSpace = containerSize - totalChildrenSize - parent!.padding.leftPadding - parent!.padding.rightPadding;
    } else {
      availableSpace = containerSize - totalChildrenSize - parent!.padding.topPadding - parent!.padding.bottomPadding;
    }

    const gaps = children.length > 1 ? availableSpace / (children.length - 1) : 0;

    let pos = this.layoutDirection === "horizontal" ? this.cursor.x : this.cursor.y;

    for (const child of children) {
      if (this.layoutDirection === "horizontal") {
        //horizontal direction
        if (this.alignment === "center") {
          // "center" alignment
          // position middle of child element to middle of parent element
          this.cursor.y = parentDims.y / 2 - child.getDimension().y / 2;
        } else if (this.alignment === "anchor-end") {
          // "anchor-end" alignment
          // position bottom of child element to bottom of parent element - bottom padding
          this.cursor.y = parentDims.y - parent!.padding.bottomPadding - child.getDimension().y;
        }
      } else {
        //vertical direction
        if (this.alignment === "center") {
          // "center" alignment
          // position middle of child element to middle of parent element
          this.cursor.x = parentDims.x / 2 - child.getDimension().x / 2;
        } else if (this.alignment === "anchor-end") {
          // "anchor-end" alignment
          // position right of child element to right of parent element - right padding
          this.cursor.x = parentDims.x - parent!.padding.rightPadding - child.getDimension().x;
        }
      }
      if (this.layoutDirection === "horizontal") {
        child.pos.x = pos;
        child.pos.y = this.cursor.y;
      } else {
        child.pos.y = pos;
        child.pos.x = this.cursor.x;
      }

      //increment cursor
      if (this.layoutDirection === "horizontal") {
        pos += child.getDimension().x + gaps;
      } else {
        pos += child.getDimension().y + gaps;
      }
    }
  }
}

export class SpaceAroundPositioningStrategy extends PlacementStrategy {
  positionChildren(children: UIContainer[]): void {
    if (children.length === 0) return;
    if (children.some(child => !child.parentContainer)) return; // Exit the method early
    let parent = children[0].parentContainer;
    let parentDims = children[0].parentDims;

    const totalChildrenSize = children.reduce((sum, child) => {
      return sum + (this.layoutDirection === "horizontal" ? child.width : child.height);
    }, 0);

    const containerSize = this.layoutDirection === "horizontal" ? parentDims.x : parentDims.y;

    let availableSpace;
    if (this.layoutDirection === "horizontal") {
      availableSpace = containerSize - totalChildrenSize - parent!.padding.leftPadding - parent!.padding.rightPadding;
    } else {
      availableSpace = containerSize - totalChildrenSize - parent!.padding.topPadding - parent!.padding.bottomPadding;
    }

    const gaps = children.length > 0 ? availableSpace / children.length : 0;

    let pos = (this.layoutDirection === "horizontal" ? this.cursor.x : this.cursor.y) + gaps / 2;

    for (const child of children) {
      if (this.layoutDirection === "horizontal") {
        // horizontal direction
        if (this.alignment === "center") {
          this.cursor.y = parentDims.y / 2 - child.getDimension().y / 2;
        } else if (this.alignment === "anchor-end") {
          this.cursor.y = parentDims.y - parent!.padding.bottomPadding - child.getDimension().y;
        }
      } else {
        // vertical direction
        if (this.alignment === "center") {
          this.cursor.x = parentDims.x / 2 - child.getDimension().x / 2;
        } else if (this.alignment === "anchor-end") {
          this.cursor.x = parentDims.x - parent!.padding.rightPadding - child.getDimension().x;
        }
      }

      if (this.layoutDirection === "horizontal") {
        child.pos.x = pos;
        child.pos.y = this.cursor.y;
      } else {
        child.pos.y = pos;
        child.pos.x = this.cursor.x;
      }

      // increment cursor
      if (this.layoutDirection === "horizontal") {
        pos += child.getDimension().x + gaps;
      } else {
        pos += child.getDimension().y + gaps;
      }
    }
  }
}

export class SpaceEvenlyPositioningStrategy extends PlacementStrategy {
  positionChildren(children: UIContainer[]): void {
    if (children.length === 0) return;
    if (children.some(child => !child.parentContainer)) return; // Exit the method early
    let parent = children[0].parentContainer;
    let parentDims = children[0].parentDims;

    const totalChildrenSize = children.reduce((sum, child) => {
      return sum + (this.layoutDirection === "horizontal" ? child.width : child.height);
    }, 0);

    const containerSize = this.layoutDirection === "horizontal" ? parentDims.x : parentDims.y;

    let availableSpace;
    if (this.layoutDirection === "horizontal") {
      availableSpace = containerSize - totalChildrenSize - parent!.padding.leftPadding - parent!.padding.rightPadding;
    } else {
      availableSpace = containerSize - totalChildrenSize - parent!.padding.topPadding - parent!.padding.bottomPadding;
    }

    const gaps = children.length > 0 ? availableSpace / (children.length + 1) : 0;

    let pos = (this.layoutDirection === "horizontal" ? this.cursor.x : this.cursor.y) + gaps;

    for (const child of children) {
      if (this.layoutDirection === "horizontal") {
        // horizontal direction
        if (this.alignment === "center") {
          this.cursor.y = parentDims.y / 2 - child.getDimension().y / 2;
        } else if (this.alignment === "anchor-end") {
          this.cursor.y = parentDims.y - parent!.padding.bottomPadding - child.getDimension().y;
        }
      } else {
        // vertical direction
        if (this.alignment === "center") {
          this.cursor.x = parentDims.x / 2 - child.getDimension().x / 2;
        } else if (this.alignment === "anchor-end") {
          this.cursor.x = parentDims.x - parent!.padding.rightPadding - child.getDimension().x;
        }
      }

      if (this.layoutDirection === "horizontal") {
        child.pos.x = pos;
        child.pos.y = this.cursor.y;
      } else {
        child.pos.y = pos;
        child.pos.x = this.cursor.x;
      }

      // increment cursor
      if (this.layoutDirection === "horizontal") {
        pos += child.getDimension().x + gaps;
      } else {
        pos += child.getDimension().y + gaps;
      }
    }
  }
}
