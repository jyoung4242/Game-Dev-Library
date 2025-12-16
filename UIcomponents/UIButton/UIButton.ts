import {
  Color,
  EventEmitter,
  ExcaliburGraphicsContext,
  Font,
  GameEvent,
  Graphic,
  ScreenElement,
  TextOptions,
  Vector,
} from "excalibur";
import { drawText } from "canvas-txt";

const POINTER_LEAVE_DELAY_MS = 50;
const PRESS_OFFSET_PX = 6;

export type UIButtonState = "idle" | "hovered" | "pressed";

export type UIButtonEvents = {
  UIButtonClicked: UIButtonClicked;
  UIButtonHovered: UIButtonHovered;
};

type UIButtonColors = {
  mainStarting: Color;
  mainEnding?: Color;
  bottomStarting: Color;
  bottomEnding?: Color;
  hoverStarting: Color;
  hoverEnding?: Color;
};

export interface UIButtonOptions {
  callback?: () => void;
  radius?: number;
  idleText?: string;
  activeText?: string;
  hoveredText?: string;
  textOptions?: TextOptions;
  colors?: UIButtonColors;
}

export class UIButton extends ScreenElement {
  private state: UIButtonState = "idle";
  private callback: () => void;
  private isHovered = false;
  private isPressed = false;
  private ignoreLeave = false;
  public emitter: EventEmitter<UIButtonEvents>;

  constructor(name: string, size: Vector, config: UIButtonOptions) {
    super({ name, width: size.x, height: size.y });
    this.callback = config.callback ?? (() => {});
    this.graphics.use(new UIButtonGraphic(size, () => this.state, config));
    this.emitter = new EventEmitter();
    this.pointer.useGraphicsBounds = true;

    this.on("pointerenter", () => {
      this.isHovered = true;
      this.emitter.emit("UIButtonHovered", { name: this.name, target: this, event: "hovered" });
      this.updateState();
    });

    this.on("pointerleave", () => {
      // Ignore spurious leave events right after pointerup
      if (this.ignoreLeave) return;

      this.isHovered = false;
      this.updateState();
    });

    this.on("pointerdown", () => {
      this.isPressed = true;
      this.updateState();
    });

    this.on("pointerup", () => {
      const wasPressed = this.isPressed;
      this.isPressed = false;

      // Prevent pointerleave from firing immediately after pointerup
      this.ignoreLeave = true;
      setTimeout(() => {
        this.ignoreLeave = false;
      }, POINTER_LEAVE_DELAY_MS);

      this.updateState();
      this.emitter.emit("UIButtonClicked", { name: this.name, target: this, event: "clicked" });
      // Only trigger callback if released while hovered
      if (wasPressed && this.isHovered) {
        this.callback();
      }
    });
  }

  private updateState() {
    if (this.isPressed) {
      this.state = "pressed";
    } else if (this.isHovered) {
      this.state = "hovered";
    } else {
      this.state = "idle";
    }
  }
}

class UIButtonGraphic extends Graphic {
  private size: Vector;
  private getState: () => UIButtonState;
  private config: UIButtonOptions;
  private radius = 16;
  private depthIdle = 10;
  private depthPressed = 4;
  colors: UIButtonColors = {
    mainStarting: Color.LightGray,
    bottomStarting: Color.DarkGray,
    hoverStarting: Color.LightGray,
  };

  constructor(size: Vector, getState: () => UIButtonState, buttonConfig: UIButtonOptions) {
    super({ width: size.x, height: size.y });
    this.size = size;
    this.config = buttonConfig;
    this.getState = getState;

    if (buttonConfig.colors) this.colors = buttonConfig.colors;
  }

  clone(): UIButtonGraphic {
    return new UIButtonGraphic(this.size, this.getState, this.config);
  }

  protected _drawImage(ex: ExcaliburGraphicsContext, x: number, y: number): void {
    const state = this.getState();

    const isPressed = state === "pressed";

    const depth = isPressed ? this.depthPressed : this.depthIdle;
    const pressOffset = isPressed ? PRESS_OFFSET_PX : 0;

    const cnv = document.createElement("canvas");
    cnv.width = this.size.x;
    cnv.height = this.size.y;
    const ctx = cnv.getContext("2d");
    if (!ctx) return;

    // Bottom depth layer (CSS ::after)
    this.drawRoundedRect(ctx, 0, depth, this.size.x, this.size.y - depth, this.radius, this.bottomGradient(ctx));

    // Top face
    this.drawRoundedRect(ctx, 0, 0, this.size.x, this.size.y - depth, this.radius, this.topGradient(ctx, state));

    ctx.fillStyle = this.config.textOptions?.color?.toString() ?? "#000000";
    ctx.strokeStyle = this.config.textOptions?.color?.toString() ?? "#000000";

    let thisFont = this.config.textOptions?.font as Font | undefined;

    // Draw any text
    drawText(ctx, this._getTextForState(state), {
      x: 0,
      y: 0,
      width: this.size.x,
      height: this.size.y,
      fontSize: thisFont?.size ?? 20,
      font: thisFont?.family ?? "Arial",
    });

    // draw image to ex
    ex.drawImage(cnv, x, y + pressOffset);
  }

  private _getTextForState(state: UIButtonState): string {
    switch (state) {
      case "idle":
        return this.config.idleText ?? "";
      case "pressed":
        return this.config.activeText ?? "";
      case "hovered":
        return this.config.hoveredText ?? "";
    }
  }

  // ============================
  // Gradients
  // ============================

  private topGradient(ex: CanvasRenderingContext2D, state: UIButtonState): CanvasGradient {
    const g = ex.createLinearGradient(0, 0, 0, this.size.y);

    if (state === "hovered") {
      g.addColorStop(0, this.colors.hoverStarting.toString()); //"#f2b95a");
      this.colors.hoverEnding
        ? g.addColorStop(1, this.colors.hoverEnding.toString())
        : g.addColorStop(1, this.colors.hoverStarting.toString());
    } else {
      g.addColorStop(0, this.colors.mainStarting.toString());
      this.colors.mainEnding
        ? g.addColorStop(1, this.colors.mainEnding.toString())
        : g.addColorStop(1, this.colors.mainStarting.toString());
    }

    return g;
  }

  private bottomGradient(ex: CanvasRenderingContext2D): CanvasGradient {
    const g = ex.createLinearGradient(0, 0, 0, this.size.y);
    g.addColorStop(0, this.colors.bottomStarting.toString());
    this.colors.bottomEnding
      ? g.addColorStop(1, this.colors.bottomEnding.toString())
      : g.addColorStop(1, this.colors.bottomStarting.toString());

    return g;
  }

  // ============================
  // Shape helper
  // ============================

  private drawRoundedRect(ex: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number, fill: CanvasGradient) {
    ex.beginPath();
    ex.roundRect(x, y, w, h, r);
    ex.fillStyle = fill;
    ex.fill();
  }
}

export class UIButtonClicked extends GameEvent<UIButton> {
  constructor(public target: UIButton) {
    super();
  }
}

export class UIButtonHovered extends GameEvent<UIButton> {
  constructor(public target: UIButton) {
    super();
  }
}
