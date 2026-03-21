import { Actor, Color, ExcaliburGraphicsContext, Graphic, ScreenElement, Sprite, TileMap, Vector } from "excalibur";

export type MapType = TileMap | Actor | ScreenElement;

export interface MiniMapOptions {
  mapOptions: {
    pos: Vector;
    dims: Vector;
    opacity: number;
    visible: boolean;
    content: MapType;
    borderColor: Color;
    borderSize: number;
    backgroundColor: Color;
  };
  targetOptions: {
    actor: Actor;
    actorColor: Color;
    actorRadius: number;
    drawFence: boolean;
    fenceDims: Vector;
    fenceColor: Color;
  };
}

export class MiniMap extends ScreenElement {
  graphic: MiniMapGraphic;
  constructor(options: MiniMapOptions) {
    super({
      pos: options.mapOptions.pos,
      width: options.mapOptions.dims.x,
      height: options.mapOptions.dims.y,
      z: 1000,
    });

    this.graphic = new MiniMapGraphic(options);
    this.graphics.use(this.graphic);
    if (options.mapOptions.visible) this.show();
    else this.hide();
  }

  show() {
    this.graphics.isVisible = true;
  }

  hide() {
    this.graphics.isVisible = false;
  }
}

export class MiniMapGraphic extends Graphic {
  cnv: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D | null = null;
  private _options: MiniMapOptions;
  scaleX: number = 1;
  scaleY: number = 1;

  constructor(options: MiniMapOptions) {
    super();
    this._options = options;
    this.cnv = document.createElement("canvas");
    this.cnv.width = this._options.mapOptions.dims ? this._options.mapOptions.dims.x : 100;
    this.cnv.height = this._options.mapOptions.dims ? this._options.mapOptions.dims.y : 100;
    if (this.cnv) {
      console.log(this.cnv);

      this.ctx = this.cnv.getContext("2d");
      if (!this.ctx) throw new Error("Failed to get context");
    }
    this.scaleX = this.cnv.width / this._options.mapOptions.dims.x;
    this.scaleY = this.cnv.height / this._options.mapOptions.dims.y;
  }

  clone(): Graphic {
    return new MiniMapGraphic(this._options);
  }

  protected _drawImage(ex: ExcaliburGraphicsContext, x: number, y: number): void {
    console.log("drawimage");

    if (this.ctx) {
      this.updateOffscreenCanvas();
      ex.drawImage(this.cnv, x, y);
    }
  }

  updateOffscreenCanvas(): void {
    //draw white rectangle for debug

    if (this.ctx) {
      const map = this._options.mapOptions.content;
      const player = this._options.targetOptions.actor;
      const dx = player.pos.x - (map.pos.x - map.width / 2);
      const dy = player.pos.y - (map.pos.y - map.height / 2);
      const nx = dx / map.width;
      const ny = dy / map.height;

      //clear canvas
      this.ctx.clearRect(0, 0, this.cnv.width, this.cnv.height);
      this.ctx.globalAlpha = this._options.mapOptions.opacity;

      //draw background
      this.ctx.fillStyle = this._options.mapOptions.backgroundColor.toString();
      this.ctx.fillRect(0, 0, this.cnv.width, this.cnv.height);

      //draw content
      if (this._options.mapOptions.content instanceof TileMap) {
        //tilemap, tbd
        //TODO, figure out how to draw a TileMap to a canvas
      } else {
        //actor or screenelement
        let graphics = this._options.mapOptions.content.graphics.current;
        if (graphics && graphics instanceof Sprite) {
          this.ctx.drawImage(graphics.image.image, 0, 0, this.cnv.width, this.cnv.height);
        }
        //TODO maybe some other graphics?  shrug
      }

      //   draw actor
      if (this._options.targetOptions.actor) {
        let xpos = nx * this.cnv.width;
        let ypos = ny * this.cnv.height;
        //set color and sizedd
        this.ctx.fillStyle = this._options.targetOptions.actorColor.toString();
        this.ctx.beginPath();
        this.ctx.arc(xpos, ypos, this._options.targetOptions.actorRadius, 0, 2 * Math.PI);
        this.ctx.fill();
      }

      //draw fence
      if (this._options.targetOptions.drawFence && this._options.targetOptions.fenceDims) {
        let xpos = nx * this.cnv.width;
        let ypos = ny * this.cnv.height;
        this.ctx.strokeStyle = this._options.targetOptions.fenceColor.toString();
        this.ctx.strokeRect(
          xpos - this._options.targetOptions.fenceDims.x / 2,
          ypos - this._options.targetOptions.fenceDims.y / 2,
          this._options.targetOptions.fenceDims.x,
          this._options.targetOptions.fenceDims.y,
        );
      }

      // draw border
      this.ctx.strokeStyle = this._options.mapOptions.borderColor.toString();
      this.ctx.lineWidth = this._options.mapOptions.borderSize;
      const lw = this.ctx.lineWidth;
      this.ctx.strokeRect(lw / 2, lw / 2, this.cnv.width - lw, this.cnv.height - lw);
      this.cnv.setAttribute("forceUpload", "true");
      this.ctx.globalAlpha = 1;
    }
  }
}
