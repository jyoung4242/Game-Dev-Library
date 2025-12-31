import { Color, EventEmitter, ExcaliburGraphicsContext, GameEvent, Graphic } from "excalibur";
import { drawText, CanvasTextConfig } from "canvas-txt";
export type { CanvasTextConfig } from "canvas-txt";

export interface TypeWriterConfig {
  text: string;
  typeDelay: number;
  textConfig: CanvasTextConfig;
  color?: Color;
}

interface TypeWriterEvents {
  typingComplete: TypingComplete;
  typingStart: TypingStart;
  letterTyped: LetterTyped;
}

export class TypingComplete extends GameEvent<TypeWriter> {
  endingText: string;
  constructor(endingText: string) {
    super();
    this.endingText = endingText;
  }
}

export class TypingStart extends GameEvent<TypeWriter> {
  constructor() {
    super();
  }
}

export class LetterTyped extends GameEvent<TypeWriter> {
  letter: string;
  constructor(letter: string) {
    super();
    this.letter = letter;
  }
}

export class TypeWriter extends Graphic {
  endStringText: string;
  currentStringText: string;
  stringIndex: number = 0;
  typeDelay: number;
  config: TypeWriterConfig;
  public events: EventEmitter<TypeWriterEvents> = new EventEmitter<TypeWriterEvents>();
  lastTimestamp = 0;
  cnv: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D | null;
  isDone: boolean = false;
  isFinishing: boolean = false;
  color: Color;
  cnvTextConfig: CanvasTextConfig;

  constructor(config: TypeWriterConfig) {
    super({
      width: config.textConfig.width,
      height: config.textConfig.height,
    });
    this.endStringText = config.text;
    this.cnvTextConfig = config.textConfig;

    this.currentStringText = "";
    this.color = config.color || Color.White;
    this.typeDelay = config.typeDelay;
    this.config = config;

    //setup canvas
    this.cnv = document.createElement("canvas");
    this.cnv.width = this.width;
    this.cnv.height = this.height;
    this.ctx = this.cnv.getContext("2d");
    this.ctx!.fillStyle = this.color.toString();
    this.ctx!.strokeStyle = this.color.toString();
  }

  clone(): Graphic {
    return new TypeWriter(this.config);
  }

  reset() {
    this.stringIndex = 0;
    this.currentStringText = "";
    this.lastTimestamp = 0;
    this.isDone = false;
    this.isFinishing = false;
  }

  finish() {
    this.isFinishing = true;
  }

  protected _drawImage(ex: ExcaliburGraphicsContext, x: number, y: number): void {
    if (this.lastTimestamp === 0) {
      this.events.emit("typingStart", this);
    }
    let now = Date.now();
    let elapsed = now - this.lastTimestamp;
    if (!this.ctx) {
      return;
    }
    this.ctx.clearRect(0, 0, this.width, this.height);
    if (!this.isFinishing && !this.isDone && elapsed > this.typeDelay) {
      this.lastTimestamp = now;

      this.stringIndex++;
      if (this.stringIndex >= this.endStringText.length) {
        this.isDone = true;
        this.stringIndex = this.endStringText.length;
        this.currentStringText = this.endStringText;
        this.events.emit("typingComplete", this.currentStringText);
      } else {
        this.currentStringText = this.endStringText.slice(0, this.stringIndex);
        this.events.emit("letterTyped", this.currentStringText.at(-1));
      }
    }

    if (this.isFinishing) {
      this.currentStringText = this.endStringText;
      this.isDone = true;
    }

    // draw image to ex

    drawText(this.ctx, this.currentStringText, this.cnvTextConfig);
    this.cnv.setAttribute("forceUpload", "true");
    ex.drawImage(this.cnv, x, y);
  }
}
