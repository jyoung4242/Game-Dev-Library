import { Entity, Engine } from "excalibur";
import { CutsceneAction } from "../CutSceneContent/SharedTypes";
import { DialogUI } from "../../UI/DialogBoxUI";
import { Signal } from "../../Lib/Signals";
import { UI, UIView } from "@peasy-lib/peasy-ui";
import { Conversation } from "../../Lib/DialogSystem";

export class DialogAction extends CutsceneAction {
  isDone: boolean = false;
  _elapsedTime: number = 0;
  _frameCount: number = 0;
  conversation: Conversation | null = null;
  DialogSignal: Signal = new Signal("dialogComplete");
  DialogUI: DialogUI | null = null;
  _dialogComplete: boolean = false;
  view: UIView | null = null;

  constructor(conversation: Conversation) {
    super();
    this.conversation = conversation;
    this.DialogSignal.listen((params: CustomEvent) => {
      console.log("complete signal", params.detail.params[0]);
      if (params.detail.params[0] == "dialog complete") this._dialogComplete = true;
    });
  }

  isCompleted(): boolean {
    return this._dialogComplete;
  }

  *execute(entity: Entity, engine: Engine): Generator<any, void, unknown> {
    const startTime = Date.now();
    this._elapsedTime = 0;
    this._frameCount = 0;

    const gameElement = document.getElementById("Game") as HTMLDivElement;
    if (!gameElement || !this.conversation) return;
    this.view = UI.create(gameElement, new DialogUI(this.conversation), DialogUI.template);
    console.log("view", this.view);

    while (true) {
      this._frameCount++;

      // Check if we've reached the destination
      if (this.isCompleted()) {
        //remove the dialog box
        this.view.destroy();
        this.view = null;
        return; // End the generator
      }

      //Launch Dialog Box

      // When complete, set state for isComplete to return true
      this._elapsedTime = Date.now() - startTime;

      yield;
    }
  }
}
