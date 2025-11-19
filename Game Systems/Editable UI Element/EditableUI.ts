import {
  Actor,
  ActorArgs,
  Color,
  Component,
  ScreenElement,
  Entity,
  vec,
  Engine,
  PointerEvent,
  Graphic,
  ExcaliburGraphicsContext,
  GraphicOptions,
  Vector,
  PointerButton,
} from "excalibur";
import { drawText } from "canvas-txt";

/*
EditableUI is a ScreenElement that can be resized and dragged around the screen.
It has a design mode that can be toggled on and off.
When design mode is on, the element can be resized and dragged and the Graphic that's displayed is a 
semi-transparent rectangle with a border.  The text displayed will be the position and size of the element.
When in design mode, 6 small boxes will appear around the element that can be dragged to resize the element.

If in design mode, you can right click the element to toggle design mode off and it will redraw its graphic
based on new dimensions. 

When the mouse event is released values will be logged to the console based on the configuration

When design mode is off, the element cannot be resized or dragged. The developer can then set the Graphic to what they want.
*/

class Resizable extends Component {
  private _isResizing: boolean = false;
  topLeftResizeBox: ResizeBox;
  topMiddleResizeBox: ResizeBox;
  topRightResizeBox: ResizeBox;
  middleLeftResizeBox: ResizeBox;
  middleRightResizeBox: ResizeBox;
  bottomLeftResizeBox: ResizeBox;
  bottomMiddleResizeBox: ResizeBox;
  bottomRightResizeBox: ResizeBox;
  _engine: Engine;

  // eslint-disable-next-line no-unused-vars
  private onPostUpdate?: (engine: Engine<any>, elapsed: number) => void;

  private _lastPos = vec(0, 0);
  private _lastWidth = 0;
  private _lastHeight = 0;

  constructor(engine: Engine) {
    super();
    this._engine = engine;
    this.topLeftResizeBox = new ResizeBox(ResizeBoxPosition.TopLeft);
    this.topMiddleResizeBox = new ResizeBox(ResizeBoxPosition.TopMiddle);
    this.topRightResizeBox = new ResizeBox(ResizeBoxPosition.TopRight);
    this.middleLeftResizeBox = new ResizeBox(ResizeBoxPosition.MiddleLeft);
    this.middleRightResizeBox = new ResizeBox(ResizeBoxPosition.MiddleRight);
    this.bottomLeftResizeBox = new ResizeBox(ResizeBoxPosition.BottomLeft);
    this.bottomMiddleResizeBox = new ResizeBox(ResizeBoxPosition.BottomMiddle);
    this.bottomRightResizeBox = new ResizeBox(ResizeBoxPosition.BottomRight);
  }

  private _updateBoxPositions() {
    if (!this.owner) return;
    const owner = this.owner as ScreenElement;

    this.topLeftResizeBox.setOwner(owner);
    this.topMiddleResizeBox.setOwner(owner);
    this.topRightResizeBox.setOwner(owner);
    this.middleLeftResizeBox.setOwner(owner);
    this.middleRightResizeBox.setOwner(owner);
    this.bottomLeftResizeBox.setOwner(owner);
    this.bottomMiddleResizeBox.setOwner(owner);
    this.bottomRightResizeBox.setOwner(owner);
  }
  onAdd(owner: Entity): void {
    this.owner = owner;

    // add 6 small boxes around the owner to resize it
    owner.addChild(this.topLeftResizeBox);
    owner.addChild(this.topMiddleResizeBox);
    owner.addChild(this.topRightResizeBox);
    owner.addChild(this.middleLeftResizeBox);
    owner.addChild(this.middleRightResizeBox);
    owner.addChild(this.bottomLeftResizeBox);
    owner.addChild(this.bottomMiddleResizeBox);
    owner.addChild(this.bottomRightResizeBox);
    const engine = this._engine;

    this._updateBoxPositions();

    this.topLeftResizeBox.setupEvents(engine);
    this.topMiddleResizeBox.setupEvents(engine);
    this.topRightResizeBox.setupEvents(engine);
    this.middleLeftResizeBox.setupEvents(engine);
    this.middleRightResizeBox.setupEvents(engine);
    this.bottomLeftResizeBox.setupEvents(engine);
    this.bottomMiddleResizeBox.setupEvents(engine);
    this.bottomRightResizeBox.setupEvents(engine);

    // --- automatic reposition hook ---
    const resizable = this;
    const ui = owner as ScreenElement;

    const originalPostUpdate = ui.onPostUpdate?.bind(ui);
    ui.onPostUpdate = function (engine, delta) {
      originalPostUpdate?.(engine, delta);

      const graphicWidth = (ui.graphics.current as TextCanvasGraphic)._size.x;
      const graphicHeight = (ui.graphics.current as TextCanvasGraphic)._size.y;

      if (
        ui.pos.x !== resizable._lastPos.x ||
        ui.pos.y !== resizable._lastPos.y ||
        graphicWidth !== resizable._lastWidth ||
        graphicHeight !== resizable._lastHeight
      ) {
        resizable._updateBoxPositions();
        resizable._lastPos = ui.pos.clone();

        resizable._lastWidth = graphicWidth;
        resizable._lastHeight = graphicHeight;
      }
    };
  }

  onRemove(owner: Entity): void {
    const engine = owner.scene?.engine;
    if (!engine) throw new Error("Engine not found");
    this.topLeftResizeBox.teardownEvents(engine);
    this.topMiddleResizeBox.teardownEvents(engine);
    this.topRightResizeBox.teardownEvents(engine);
    this.middleLeftResizeBox.teardownEvents(engine);
    this.middleRightResizeBox.teardownEvents(engine);
    this.bottomLeftResizeBox.teardownEvents(engine);
    this.bottomMiddleResizeBox.teardownEvents(engine);
    this.bottomRightResizeBox.teardownEvents(engine);

    //remove the resize boxes
    owner.removeChild(this.topLeftResizeBox);
    owner.removeChild(this.topMiddleResizeBox);
    owner.removeChild(this.topRightResizeBox);
    owner.removeChild(this.middleLeftResizeBox);
    owner.removeChild(this.middleRightResizeBox);
    owner.removeChild(this.bottomLeftResizeBox);
    owner.removeChild(this.bottomMiddleResizeBox);
    owner.removeChild(this.bottomRightResizeBox);

    owner.onPostUpdate = () => {};
    this.owner = undefined;
  }
}

type EditableUIArgs = ActorArgs & {
  designMode?: boolean;
  consoleLog?: boolean;
  // eslint-disable-next-line no-unused-vars
  fallbackCallback?: (element: EditableUI) => void;
};

export class EditableUI extends ScreenElement {
  isHovering: boolean = false;
  resizable: Resizable | undefined;
  _designMode: boolean;
  _consoleLog: boolean;
  _designGraphic: TextCanvasGraphic | undefined;
  isMoving: boolean = false;
  private _dragOffset = vec(0, 0);
  // eslint-disable-next-line no-unused-vars
  fallbackCallback: ((element: EditableUI) => void) | undefined;

  constructor(config: EditableUIArgs) {
    super(config);

    if (config.designMode) {
      this._designGraphic = new TextCanvasGraphic(
        { width: config.width ?? 100, height: config.height ?? 100 },
        { name: config.name ?? "EditableUI", position: this.pos, size: vec(this.width, this.height) }
      );
      this.graphics.use(this._designGraphic);
      if (config.fallbackCallback) {
        this.fallbackCallback = config.fallbackCallback;
      }
    } else {
      if (config.fallbackCallback) {
        this.fallbackCallback = config.fallbackCallback;
      }
    }

    this._designMode = config.designMode ?? false;
    this._consoleLog = config.consoleLog ?? false;
  }

  set designMode(mode: boolean) {
    this._designMode = mode;
    if (mode) {
      this.addComponent(this.resizable!);
      this.draggable = true;
    } else {
      this.removeComponent(this.resizable!);
      this.draggable = false;
    }
  }
  get designMode() {
    return this._designMode;
  }

  onInitialize(engine: Engine): void {
    if (this._designMode) {
      this.resizable = new Resizable(engine);
      this.addComponent(this.resizable);

      //setup mouse events for dragging
      const ui = this;
      const pointer = engine.input.pointers.primary;
      pointer.on("down", evt => {
        //check for right click to toggle design mode
        if (evt.button === PointerButton.Right && ui._designMode) {
          const popup = new ConfirmPopup(
            "Exit design mode?",
            () => {
              this._designMode = false;
              this.designMode = false;
              let newSize = (this.graphics.current as TextCanvasGraphic).getSizePos().size;
              let newsx = Math.round(newSize.x);
              let newsy = Math.round(newSize.y);
              if (this.fallbackCallback) this.fallbackCallback(this);
              if (this._consoleLog)
                console.log(`${this.name} exited design mode. New size: ${newsx} x ${newsy} at (${this.pos.x}, ${this.pos.y})`);
            },
            () => {
              // do nothing, cancelled
            }
          );

          popup.pos = this.pos.add(vec(this.width / 2, -40)); // appear above element
          this.scene?.add(popup);
        }

        if (!ui._designMode) return;

        // prevent dragging if clicking a resize box
        if (ui.resizable) {
          const boxes = [
            ui.resizable.topLeftResizeBox,
            ui.resizable.topMiddleResizeBox,
            ui.resizable.topRightResizeBox,
            ui.resizable.middleLeftResizeBox,
            ui.resizable.middleRightResizeBox,
            ui.resizable.bottomLeftResizeBox,
            ui.resizable.bottomMiddleResizeBox,
            ui.resizable.bottomRightResizeBox,
          ];
          if (boxes.some(b => b.isCursorOver(evt))) return;
        }

        // check if clicking inside the element bounds
        const mouse = evt.screenPos;
        const graphic = ui._designGraphic;
        if (!graphic) return;

        const { size, position } = graphic.getSizePos();
        if (mouse.x >= position.x && mouse.x <= position.x + size.x && mouse.y >= position.y && mouse.y <= position.y + size.y) {
          ui.isMoving = true;
          ui._dragOffset = mouse.sub(ui.pos);
          engine.canvas.style.cursor = "grabbing";
        }
      });

      pointer.on("move", evt => {
        if (!ui.isMoving) return;

        const newPos = evt.screenPos.sub(ui._dragOffset);
        ui.pos = newPos;
        (ui._designGraphic as TextCanvasGraphic)._position = newPos.clone();
      });

      pointer.on("up", () => {
        if (ui.isMoving) {
          ui.isMoving = false;
          engine.canvas.style.cursor = "move";
        }
      });
    }
  }

  isMouseHovering(): boolean {
    if (!this.scene) return false;
    const pointer = this.scene.engine.input.pointers.primary;
    if (!pointer) return false;
    const mousePos = pointer.lastScreenPos;
    const boxPos = this.globalPos;
    let grahpicSize = (this.graphics.current as TextCanvasGraphic)._size;

    return (
      mousePos.x >= boxPos.x &&
      mousePos.x <= boxPos.x + grahpicSize.x &&
      mousePos.y >= boxPos.y &&
      mousePos.y <= boxPos.y + grahpicSize.y
    );
  }

  onPreUpdate(engine: Engine): void {
    // get current cursor style
    let currentCursor = engine.canvas.style.cursor;
    if (!this.designMode && currentCursor !== "default") engine.canvas.style.cursor = "default";
    if (!this._designMode) return;
    let mouseHover = this.isMouseHovering();
    //set current cursor to default if not set
    if (!currentCursor) currentCursor = "default";

    if (!this.isHovering && this._designMode && mouseHover && currentCursor === "default") {
      engine.canvas.style.cursor = "move";
      this._designGraphic?.setHover(true);
      this.isHovering = true;
    } else if (this.isHovering && !mouseHover) {
      engine.canvas.style.cursor = "default";
      this._designGraphic?.setHover(false);
      this.isHovering = false;
    }
  }
}

const ResizeBoxPosition = {
  TopLeft: "TopLeft",
  TopMiddle: "TopMiddle",
  TopRight: "TopRight",
  MiddleLeft: "MiddleLeft",
  MiddleRight: "MiddleRight",
  BottomLeft: "BottomLeft",
  BottomMiddle: "BottomMiddle",
  BottomRight: "BottomRight",
} as const;
type ResizeBoxPositionType = (typeof ResizeBoxPosition)[keyof typeof ResizeBoxPosition];

class ResizeBox extends Actor {
  prevMouseX: number = 0;
  prevMouseY: number = 0;
  isHovering: boolean = false;
  isResizing: boolean = false;
  positionType: ResizeBoxPositionType;
  owner?: Actor;
  constructor(position?: ResizeBoxPositionType, owner?: Actor) {
    super({
      width: 10,
      height: 10,
      color: Color.White,
    });
    this.owner = owner;
    this.positionType = position ?? ResizeBoxPosition.TopLeft;
  }

  setupEvents(engine: Engine) {
    let sizebox = this;
    engine.input.pointers.primary.on("move", function (evt: PointerEvent) {
      if (sizebox.isResizing && sizebox.owner) {
        // calculate how far the mouse has moved since last event
        let deltaX = sizebox.prevMouseX - evt.screenPos.x;
        let deltaY = sizebox.prevMouseY - evt.screenPos.y;
        sizebox.prevMouseX = evt.screenPos.x;
        sizebox.prevMouseY = evt.screenPos.y;

        // get current owner position and size
        let dims = (sizebox.owner.graphics.current as TextCanvasGraphic).getSizePos();
        let ownerSize = dims.size;

        if (Math.abs(deltaX) > 100 || Math.abs(deltaY) > 100) return; // sometimes move event is fired with no movement
        switch (sizebox.positionType) {
          case "TopLeft":
            // resize and move
            sizebox.owner.pos = evt.screenPos;
            (sizebox.owner as EditableUI)._designGraphic?.updateData(
              sizebox.owner.pos,
              vec(ownerSize.x + deltaX, ownerSize.y + deltaY)
            );

            break;
          case "TopMiddle":
            // only resize in Y direction
            (sizebox.owner as EditableUI)._designGraphic?.updateData(sizebox.owner.pos, vec(ownerSize.x, ownerSize.y + deltaY));
            sizebox.owner.pos = vec(sizebox.owner.pos.x, evt.screenPos.y);
            break;
          case "TopRight":
            sizebox.owner.pos = vec(sizebox.owner.pos.x, evt.screenPos.y);
            (sizebox.owner as EditableUI)._designGraphic?.updateData(
              sizebox.owner.pos,
              vec(ownerSize.x - deltaX, ownerSize.y + deltaY)
            );
            break;
          case "MiddleLeft":
            // only resize in X direction
            (sizebox.owner as EditableUI)._designGraphic?.updateData(sizebox.owner.pos, vec(ownerSize.x + deltaX, ownerSize.y));
            sizebox.owner.pos = vec(evt.screenPos.x, sizebox.owner.pos.y);
            break;
          case "MiddleRight":
            (sizebox.owner as EditableUI)._designGraphic?.updateData(sizebox.owner.pos, vec(ownerSize.x - deltaX, ownerSize.y));
            break;
          case "BottomLeft":
            sizebox.owner.pos = vec(evt.screenPos.x, sizebox.owner.pos.y);
            (sizebox.owner as EditableUI)._designGraphic?.updateData(
              sizebox.owner.pos,
              vec(ownerSize.x + deltaX, ownerSize.y - deltaY)
            );
            break;
          case "BottomMiddle":
            // only resize in Y direction
            (sizebox.owner as EditableUI)._designGraphic?.updateData(sizebox.owner.pos, vec(ownerSize.x, ownerSize.y - deltaY));
            break;
          case "BottomRight":
            (sizebox.owner as EditableUI)._designGraphic?.updateData(
              sizebox.owner.pos,
              vec(ownerSize.x - deltaX, ownerSize.y - deltaY)
            );
            break;
        }
      } else {
        if (sizebox.isCursorOver(evt)) {
          sizebox.graphics.color = Color.Red;
          //cursor to proper resize cursor based on position
          engine.canvas.style.cursor = sizebox.getCursorStyleByType();
          sizebox.isHovering = true;
        } else if (sizebox.isHovering) {
          sizebox.graphics.color = Color.White;
          engine.canvas.style.cursor = "default";
          sizebox.isHovering = false;
        }
      }
    });
    engine.input.pointers.primary.on("down", function (evt: PointerEvent) {
      if (sizebox.isCursorOver(evt)) {
        sizebox.isResizing = true;
        //change cursore to grabbing
        engine.canvas.style.cursor = "grabbing";
      }
    });
    engine.input.pointers.primary.on("up", function () {
      if (sizebox.isResizing) {
        sizebox.isResizing = false;
      }
    });
  }

  teardownEvents(engine: Engine) {
    // remove event listeners
    engine.input.pointers.primary.off("move");
  }

  getCursorStyleByType(): string {
    switch (this.positionType) {
      case ResizeBoxPosition.TopLeft:
        return "nw-resize";
      case ResizeBoxPosition.TopMiddle:
        return "n-resize";
      case ResizeBoxPosition.TopRight:
        return "ne-resize";
      case ResizeBoxPosition.MiddleLeft:
        return "w-resize";
      case ResizeBoxPosition.MiddleRight:
        return "e-resize";
      case ResizeBoxPosition.BottomLeft:
        return "sw-resize";
      case ResizeBoxPosition.BottomMiddle:
        return "s-resize";
      case ResizeBoxPosition.BottomRight:
        return "se-resize";
    }
  }

  isCursorOver(evt: PointerEvent): boolean {
    const mousePos = evt.worldPos;
    const boxPos = this.globalPos;
    return (
      mousePos.x >= boxPos.x && mousePos.x <= boxPos.x + this.width && mousePos.y >= boxPos.y && mousePos.y <= boxPos.y + this.height
    );
  }

  setOwner(owner: ScreenElement) {
    this.owner = owner;
    let ownerSize = (owner.graphics.current as TextCanvasGraphic).getSizePos().size;
    switch (this.positionType) {
      case ResizeBoxPosition.TopLeft:
        // position is relative to owner position, so you start at 0,0
        this.pos = vec(0, 0);
        break;
      case ResizeBoxPosition.TopMiddle:
        this.pos = vec(ownerSize.x / 2 - this.width / 2, 0);
        break;
      case ResizeBoxPosition.TopRight:
        this.pos = vec(ownerSize.x, 0);
        break;
      case ResizeBoxPosition.MiddleLeft:
        this.pos = vec(0, ownerSize.y / 2);
        break;
      case ResizeBoxPosition.MiddleRight:
        this.pos = vec(ownerSize.x, ownerSize.y / 2);
        break;
      case ResizeBoxPosition.BottomLeft:
        this.pos = vec(0, ownerSize.y);
        break;
      case ResizeBoxPosition.BottomMiddle:
        this.pos = vec(ownerSize.x / 2 - this.width / 2, ownerSize.y);
        break;
      case ResizeBoxPosition.BottomRight:
        this.pos = vec(ownerSize.x, ownerSize.y);
        break;
    }
  }
}

type TextGraphicsConfig = GraphicOptions;

export class TextCanvasGraphic extends Graphic {
  config: TextGraphicsConfig;
  _name: string = "Sample Text";
  _position: Vector = Vector.Zero;
  _size: Vector = new Vector(100, 100);
  _borderColor: Color = Color.Black;

  constructor(config: TextGraphicsConfig, options: { name: string; position: Vector; size: Vector }) {
    super(config);
    this.config = config;
    this._name = options.name;
    this._position = options.position.clone();
    this._size = options.size.clone();
  }
  clone(): Graphic {
    return new TextCanvasGraphic(this.config, { name: this._name, position: this._position, size: this._size });
  }

  updateData(position: Vector, size: Vector) {
    this._position = position.clone();
    this._size = size.clone();
  }

  getSizePos() {
    return { position: this._position, size: this._size };
  }

  setHover(hoverstate: boolean) {
    this._borderColor = hoverstate ? Color.Red : Color.Black;
  }

  protected _drawImage(ex: ExcaliburGraphicsContext, x: number, y: number): void {
    let myCanvas = document.createElement("canvas");
    myCanvas.width = this._size.x ?? 100;
    myCanvas.height = this._size.y ?? 100;
    myCanvas.id = "text-canvas";
    let ctx = myCanvas.getContext("2d");
    if (!ctx) return;

    let text = `Element: ${this._name}\nPos: ${Math.round(this._position.x)}, ${Math.round(this._position.y)}\nSize: ${Math.round(
      this._size.x
    )} x ${Math.round(this._size.y)}`;

    ctx.clearRect(0, 0, myCanvas.width, myCanvas.height);
    ctx.fillStyle = "rgba(200, 200, 200, 0.5)";
    ctx.fillRect(0, 0, myCanvas.width, myCanvas.height);
    ctx.strokeStyle = this._borderColor.toString();
    ctx.lineWidth = this._borderColor ? 3 : 1;
    ctx.strokeRect(0, 0, myCanvas.width, myCanvas.height);

    ctx.fillStyle = "black";
    drawText(ctx, text, {
      x: 0,
      y: -50,
      width: 200,
      height: 200,
      fontSize: 16,
    });

    //draw the canvas to the excalibur context
    ex.drawImage(myCanvas, x, y);
  }
}

class ConfirmPopup extends ScreenElement {
  private onConfirm: () => void;
  private onCancel: () => void;

  constructor(message: string, onConfirm: () => void, onCancel: () => void) {
    super({
      width: 120,
      height: 80,
      color: Color.Gray,
      anchor: vec(0.5, 0.5),
    });
    this.onConfirm = onConfirm;
    this.onCancel = onCancel;
  }

  onInitialize() {
    const yesBtn = new Actor({ x: 30, y: 55, width: 40, height: 20, color: Color.Green });
    const noBtn = new Actor({ x: 90, y: 55, width: 40, height: 20, color: Color.Red });

    yesBtn.on("pointerup", () => {
      this.onConfirm();
      this.kill();
    });
    noBtn.on("pointerup", () => {
      this.onCancel();
      this.kill();
    });

    this.addChild(yesBtn);
    this.addChild(noBtn);

    // draw text on canvas
    const g = new ConfirmGraphic();

    this.graphics.use(g);
  }
}

class ConfirmGraphic extends Graphic {
  constructor() {
    super();
  }

  clone(): Graphic {
    return new ConfirmGraphic();
  }

  protected _drawImage(ex: ExcaliburGraphicsContext, x: number, y: number): void {
    let myCanvas = document.createElement("canvas");
    myCanvas.width = 120;
    myCanvas.height = 80;
    myCanvas.id = "text-canvas";
    let ctx = myCanvas.getContext("2d");
    if (!ctx) return;

    let text = `Confirm?`;

    ctx.clearRect(0, 0, myCanvas.width, myCanvas.height);
    ctx.fillStyle = "rgba(200, 200, 200, 0.5)";
    ctx.fillRect(0, 0, myCanvas.width, myCanvas.height);
    ctx.strokeStyle = "black";
    ctx.lineWidth = 2;
    ctx.strokeRect(0, 0, myCanvas.width, myCanvas.height);

    ctx.fillStyle = "black";
    drawText(ctx, text, {
      x: 0,
      y: -15,
      width: 120,
      height: 80,
      fontSize: 16,
    });

    //draw the canvas to the excalibur context
    ex.drawImage(myCanvas, x, y);
  }
}
