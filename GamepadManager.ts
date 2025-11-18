import { Axes, Engine, GamepadConnectEvent, GamepadDisconnectEvent, Gamepad } from "excalibur";
import { Signal } from "./Signals";

// Global pub/sub signal for all gamepad events
export const GamepadSignal = new Signal("gamepad");

type StickDirection = "up" | "down" | "left" | "right" | "upLeft" | "upRight" | "downLeft" | "downRight" | "idle";

interface GamepadState {
  instance: Gamepad;
  lastLeftStick: StickDirection;
  lastRightStick: StickDirection;
  buttonStates: Map<number, boolean>; // current pressed state
  buttonHoldTimers: Map<number, number>; // milliseconds held
}

export class GamepadManager {
  private gamepads: Map<number, GamepadState> = new Map();
  private threshold: number;
  private holdThreshold: number; // ms before first hold
  private holdRepeatInterval: number; // ms between subsequent holds

  constructor(engine: Engine, threshold = 0.5, holdThreshold = 300, holdRepeatInterval = 100) {
    this.threshold = threshold;
    this.holdThreshold = holdThreshold;
    this.holdRepeatInterval = holdRepeatInterval;

    engine.input.gamepads.setMinimumGamepadConfiguration({
      axis: 4,
      buttons: 16,
    });

    // Connect events
    engine.input.gamepads.on("connect", (evt: GamepadConnectEvent) => {
      console.log("Gamepad connected:", evt.index);
      const gp = engine.input.gamepads.at(evt.index);

      const state: GamepadState = {
        instance: gp,
        lastLeftStick: "idle",
        lastRightStick: "idle",
        buttonStates: new Map(),
        buttonHoldTimers: new Map(),
      };

      this.gamepads.set(evt.index, state);
    });

    // Disconnect events
    engine.input.gamepads.on("disconnect", (evt: GamepadDisconnectEvent) => {
      console.log("Gamepad disconnected:", evt.index);
      this.gamepads.delete(evt.index);
    });
  }

  // Compute stick direction
  private computeDirection(x: number, y: number): StickDirection {
    if (x === 0 && y === 0) return "idle";
    if (y < -this.threshold && x < -this.threshold) return "upLeft";
    if (y < -this.threshold && x > this.threshold) return "upRight";
    if (y > this.threshold && x < -this.threshold) return "downLeft";
    if (y > this.threshold && x > this.threshold) return "downRight";
    if (y < -this.threshold) return "up";
    if (y > this.threshold) return "down";
    if (x < -this.threshold) return "left";
    if (x > this.threshold) return "right";
    return "idle";
  }

  // Call every frame. Pass deltaTime in milliseconds from Excalibur preupdate
  update(deltaTime: number) {
    for (const [index, state] of this.gamepads.entries()) {
      const gp = state.instance;

      // --- Sticks
      const lX = gp.getAxes(Axes.LeftStickX);
      const lY = gp.getAxes(Axes.LeftStickY);
      const rX = gp.getAxes(Axes.RightStickX);
      const rY = gp.getAxes(Axes.RightStickY);

      const leftDir = this.computeDirection(lX, lY);
      const rightDir = this.computeDirection(rX, rY);

      if (leftDir !== state.lastLeftStick) {
        GamepadSignal.send([index, "leftStick", leftDir]);
        state.lastLeftStick = leftDir;
      }
      if (rightDir !== state.lastRightStick) {
        GamepadSignal.send([index, "rightStick", rightDir]);
        state.lastRightStick = rightDir;
      }

      // --- Buttons
      for (let btnIndex = 0; btnIndex < 16; btnIndex++) {
        const btnValue = gp.getButton(btnIndex) ?? 0;
        const isPressed = btnValue > 0;
        const prevPressed = state.buttonStates.get(btnIndex) ?? false;
        let heldTime = state.buttonHoldTimers.get(btnIndex) ?? 0;

        if (isPressed && !prevPressed) {
          // Pressed
          GamepadSignal.send([index, "buttonPressed", btnIndex]);
          state.buttonHoldTimers.set(btnIndex, 0);
        } else if (isPressed && prevPressed) {
          // Held
          heldTime += deltaTime;
          if (heldTime >= this.holdThreshold) {
            GamepadSignal.send([index, "buttonHeld", btnIndex]);
            heldTime -= this.holdRepeatInterval; // allow repeat
          }
          state.buttonHoldTimers.set(btnIndex, heldTime);
        } else if (!isPressed && prevPressed) {
          // Released
          GamepadSignal.send([index, "buttonReleased", btnIndex]);
          state.buttonHoldTimers.set(btnIndex, 0);
        }

        state.buttonStates.set(btnIndex, isPressed);
      }
    }
  }
}
