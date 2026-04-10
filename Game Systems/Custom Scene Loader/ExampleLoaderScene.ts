import { Engine, Color, vec, Font } from "excalibur";
import { UIButton } from "../UI/uiButton";
import { UIProgressBar } from "../UI/uiProgress";
import { UILabel } from "../UI/uiLabel";
import { DefaultSceneLoader } from "./DefaultSceneLoader";

export class Loader extends DefaultSceneLoader {
  button: UIButton | null = null;
  pbar: UIProgressBar | null = null;
  label: UILabel | null = null;

  constructor(resources: any) {
    super(resources);
  }

  onInitialize(engine: Engine): void {
    this.pbar = new UIProgressBar({
      name: "progress",
      width: 600,
      height: 20,
      pos: engine.screen.center.sub(vec(300, 25)),
      value: 0,
    });
    this.button = new UIButton({
      name: "start",
      width: 200,
      height: 50,
      pos: engine.screen.center.sub(vec(100, -25)),
      callback: () => {
        engine.goToScene("main");
      },
      idleText: "Start",
      activeText: "Start",
      disabledText: "Start",
      hoveredText: "Start",
      textOptions: {
        color: Color.Black,
      },
      colors: {
        mainStarting: Color.LightGray,
        bottomStarting: Color.DarkGray,
        hoverStarting: Color.White,
        hoverEnding: Color.White,
        disabledStarting: Color.Gray,
        disabledEnding: Color.Gray,
      },
    });

    this.label = new UILabel({
      name: "progressText",
      width: 600,
      height: 50,

      text: "Excalibur Scene Loader",
      textOptions: {
        color: Color.White,
        font: new Font({
          size: 48,
          family: "Arial",
        }),
      },
      pos: engine.screen.center.sub(vec(275, 100)),
    });

    this.add(this.pbar);
    this.add(this.label);
  }

  showPlayButton(): Promise<void> {
    return new Promise(resolve => {
      this.add(this.button!);
      resolve();
    });
  }

  onPreUpdate(engine: Engine, elapsed: number): void {
    if (this.pbar) {
      const percent = this._numLoaded / this._resources.length;
      this.pbar.value = percent * 100;
    }
  }
}
