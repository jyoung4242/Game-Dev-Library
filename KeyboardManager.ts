import { Engine, Keys } from "excalibur";
import { Signal } from "./Signals";

// Global pub/sub signal for all keyboard events
export const KeyboardSignal = new Signal("keyboard");

interface KeyState {
  isPressed: boolean;
  heldTime: number;
}

export class KeyboardManager {
  private keyStates: Map<Keys, KeyState> = new Map();
  private holdThreshold: number;
  private holdRepeatInterval: number;

  constructor(engine: Engine, holdThreshold = 300, holdRepeatInterval = 100) {
    this.holdThreshold = holdThreshold;
    this.holdRepeatInterval = holdRepeatInterval;

    // Register events
    engine.input.keyboard.on("press", evt => {
      const key = evt.key as Keys;
      const state = this.keyStates.get(key) ?? { isPressed: false, heldTime: 0 };

      if (!state.isPressed) {
        KeyboardSignal.send(["keyPressed", key]);
        state.isPressed = true;
        state.heldTime = 0;
        this.keyStates.set(key, state);
      }
    });

    engine.input.keyboard.on("release", evt => {
      const key = evt.key as Keys;
      const state = this.keyStates.get(key);
      if (state?.isPressed) {
        KeyboardSignal.send(["keyReleased", key]);
        state.isPressed = false;
        state.heldTime = 0;
        this.keyStates.set(key, state);
      }
    });
  }

  // Call every frame with deltaTime in ms from Excalibur preupdate
  update(deltaTime: number) {
    for (const [key, state] of this.keyStates.entries()) {
      if (state.isPressed) {
        state.heldTime += deltaTime;

        if (state.heldTime >= this.holdThreshold) {
          KeyboardSignal.send(["keyHeld", key]);
          state.heldTime -= this.holdRepeatInterval; // allow repeat interval
        }
      }
    }
  }
}
