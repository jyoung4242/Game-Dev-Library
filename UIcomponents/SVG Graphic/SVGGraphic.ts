/* eslint-disable no-unused-vars */
import { Color, ExcaliburGraphicsContext, Graphic } from "excalibur";

export class SVGGraphic extends Graphic {
  svg: string = "";
  private _originalSvg: string = "";
  //default cnv dims
  _orig_width: number = 0;
  _orig_height: number = 0;
  cnv: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D | null;
  private _loaded: boolean = false;
  private _dirty: boolean = false;
  private _renderWidth?: number;
  private _renderHeight?: number;

  constructor(svgContent: string, renderWidth?: number, renderHeight?: number) {
    super();
    this.svg = svgContent;
    this._originalSvg = svgContent;
    this.cnv = document.createElement("canvas");
    this.ctx = this.cnv.getContext("2d");
    this._renderWidth = renderWidth;
    this._renderHeight = renderHeight;
  }

  /**
   * Initialize the SVG graphic by parsing and rendering it
   * Must be called before using the graphic
   */
  async init(): Promise<void> {
    try {
      // Verify it's actually SVG content
      if (!this.svg.trim().startsWith("<?xml") && !this.svg.trim().startsWith("<svg") && !this.svg.includes("<svg")) {
        throw new Error("Content is not valid SVG");
      }

      // Parse SVG to get dimensions
      const parser = new DOMParser();
      const svgDoc = parser.parseFromString(this.svg, "image/svg+xml");
      const svgElement = svgDoc.querySelector("svg");

      if (svgElement) {
        const width = this._renderWidth || parseInt(svgElement.getAttribute("width") || "100");
        const height = this._renderHeight || parseInt(svgElement.getAttribute("height") || "100");

        this.width = width;
        this.height = height;
        this.cnv.width = width;
        this.cnv.height = height;
        this._orig_width = width;
        this._orig_height = height;
        await this._renderSVGToCanvas();
        this._loaded = true;
        this._dirty = true; // Mark as dirty after initial render
      }
    } catch (error) {
      console.error("Failed to initialize SVG graphic:", error);
      throw error;
    }
  }

  private async _renderSVGToCanvas(): Promise<void> {
    if (!this.ctx) return;

    // Clear the canvas first
    this.ctx.clearRect(0, 0, this.cnv.width, this.cnv.height);

    return new Promise((resolve, reject) => {
      const img = new Image();
      const svgBlob = new Blob([this.svg], { type: "image/svg+xml;charset=utf-8" });
      const url = URL.createObjectURL(svgBlob);

      img.onload = () => {
        // Draw the image scaled to the canvas size
        this.ctx!.drawImage(img, 0, 0, this.cnv.width, this.cnv.height);
        URL.revokeObjectURL(url);
        this._dirty = true; // Mark as dirty after render
        resolve();
      };

      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error("Failed to render SVG"));
      };

      img.src = url;
    });
  }

  /**
   * Set the render size and re-render
   */
  async setSize(width: number, height: number): Promise<void> {
    if (!this._loaded) {
      throw new Error("SVGGraphic not initialized. Call init() first.");
    }
    this._renderWidth = width;
    this._renderHeight = height;
    this.width = width;
    this.height = height;
    this.cnv.width = width;
    this.cnv.height = height;
    await this._renderSVGToCanvas();
  }

  /**
   * Tweak the SVG by replacing text or modifying attributes
   * @param callback Function that receives the current SVG string and returns modified SVG
   */
  async tweak(callback: (svg: string) => string): Promise<void> {
    if (!this._loaded) {
      throw new Error("SVGGraphic not initialized. Call init() first.");
    }
    this.svg = callback(this.svg);
    await this._renderSVGToCanvas();
  }

  /**
   * Change fill color of elements matching a selector
   */
  async setFill(color: Color, selector: string = "path"): Promise<void> {
    const colorstr = color.toString();
    await this.tweak(svg => {
      const parser = new DOMParser();
      const svgDoc = parser.parseFromString(svg, "image/svg+xml");
      const elements = svgDoc.querySelectorAll(selector);

      elements.forEach(el => {
        el.setAttribute("fill", colorstr);
      });

      return new XMLSerializer().serializeToString(svgDoc);
    });
  }

  /**
   * Change stroke color of elements matching a selector
   */
  async setStroke(color: Color, width?: number, selector: string = "path"): Promise<void> {
    const colorstr = color.toString();

    await this.tweak(svg => {
      const parser = new DOMParser();
      const svgDoc = parser.parseFromString(svg, "image/svg+xml");
      const elements = svgDoc.querySelectorAll(selector);

      elements.forEach(el => {
        el.setAttribute("stroke", colorstr);
        if (width !== undefined) {
          el.setAttribute("stroke-width", width.toString());
        }
      });

      return new XMLSerializer().serializeToString(svgDoc);
    });
  }

  /**
   * Replace text content in the SVG
   */
  async replaceText(search: string | RegExp, replace: string): Promise<void> {
    await this.tweak(svg => {
      return svg.replace(search, replace);
    });
  }

  /**
   * Set an attribute on elements matching a selector
   */
  async setAttribute(selector: string, attribute: string, value: string): Promise<void> {
    await this.tweak(svg => {
      const parser = new DOMParser();
      const svgDoc = parser.parseFromString(svg, "image/svg+xml");
      const elements = svgDoc.querySelectorAll(selector);

      elements.forEach(el => {
        el.setAttribute(attribute, value);
      });

      return new XMLSerializer().serializeToString(svgDoc);
    });
  }

  /**
   * Reset to the original SVG
   */
  async reset(): Promise<void> {
    if (!this._loaded) {
      throw new Error("SVGGraphic not initialized. Call init() first.");
    }
    this.svg = this._originalSvg;
    this._dirty = true;
    this.cnv.width = this._orig_width;
    this.cnv.height = this._orig_height;
    this.width = this._orig_width;
    this.height = this._orig_height;
    await this._renderSVGToCanvas();
  }

  /**
   * Manually trigger a re-render of the current SVG state
   */
  async rerender(): Promise<void> {
    if (!this._loaded) {
      throw new Error("SVGGraphic not initialized. Call init() first.");
    }
    await this._renderSVGToCanvas();
  }

  /**
   * Check if the graphic has been loaded and is ready to use
   */
  isLoaded(): boolean {
    return this._loaded;
  }

  /**
   * Check if the graphic has been modified and needs upload
   */
  isDirty(): boolean {
    return this._dirty;
  }

  clone(): SVGGraphic {
    const cloned = new SVGGraphic(this._originalSvg, this._renderWidth, this._renderHeight);
    return cloned;
  }

  protected _drawImage(ex: ExcaliburGraphicsContext, x: number, y: number): void {
    if (!this.ctx || !this._loaded) return;

    // Only force upload if dirty
    if (this._dirty) {
      this.cnv.setAttribute("forceUpload", "true");
      this._dirty = false; // Clear the dirty flag
    }

    ex.drawImage(this.cnv, x, y);
  }
}
