import {
  Axes,
  Buttons,
  Engine,
  EventEmitter,
  KeyEvent,
  Keys,
  PointerEvent,
  GamepadConnectEvent,
  GamepadDisconnectEvent,
  Gamepad,
  GamepadAxisEvent,
  GamepadButtonEvent,
  WheelEvent,
} from "excalibur";

/**
 * Set of keyboard keys that trigger on press events
 */
type KeyPresses = Set<Keys>;

/**
 * Set of keyboard keys that trigger on release events
 */
type KeyReleases = Set<Keys>;

/**
 * Set of keyboard keys that trigger on hold events
 */
type KeyHolds = Set<Keys>;

/**
 * Set of gamepad axes that trigger events
 */
type GamepadAxesTriggers = Set<Axes>;

/**
 * Set of gamepad buttons that trigger events
 */
type GamepadButtonsTriggers = Set<Buttons>;

/**
 * Set of pointer event types to listen for
 */
type PointerTriggers = Set<"up" | "down" | "move" | "wheel" | "cancel">;

/**
 * Directional constants for analog stick positions
 */
const STICK_DIRECTION = {
  LEFT: "left",
  RIGHT: "right",
  UP: "up",
  DOWN: "down",
  IDLE: "idle",
  UPLEFT: "upLeft",
  UPRIGHT: "upRight",
  DOWNLEFT: "downLeft",
  DOWNRIGHT: "downRight",
} as const;

/**
 * Represents the 8-directional output from an analog stick
 */
type StickDirection = (typeof STICK_DIRECTION)[keyof typeof STICK_DIRECTION];

/**
 * Configuration object defining which inputs to listen for in a given context
 *
 * @example
 * ```typescript
 * const gameplayContext: InputContext = {
 *   KeyPresses: new Set([Keys.W, Keys.A, Keys.S, Keys.D]),
 *   GamepadAxesPolling: new Set([Axes.LeftStickX, Axes.LeftStickY])
 * };
 * ```
 */
type InputContext = {
  /** Keys that emit events on press */
  KeyPresses?: KeyPresses;
  /** Keys that emit events on release */
  KeyReleases?: KeyReleases;
  /** Keys that emit events while held */
  KeyHolds?: KeyHolds;
  /** Gamepad axes that emit events on movement (event-driven) */
  GamepadAxesTriggers?: GamepadAxesTriggers;
  /** Gamepad buttons that emit events on press (event-driven) */
  GamepadButtonsTriggers?: GamepadButtonsTriggers;
  /** Gamepad axes to poll every frame */
  GamepadAxesPolling?: GamepadAxesTriggers;
  /** Gamepad buttons to poll every frame */
  GamepadButtonsPolling?: GamepadButtonsTriggers;
  /** Pointer events to listen for */
  PointerTriggers?: PointerTriggers;
};

/**
 * Handler function for gamepad axis events
 */

// eslint-disable-next-line no-unused-vars
type axesHandler = (ge: GamepadAxisEvent) => void;

/**
 * Handler function for gamepad button events
 */
// eslint-disable-next-line no-unused-vars
type buttonsHandler = (ge: GamepadButtonEvent) => void;

/**
 * Internal state tracking for a connected gamepad
 */
type GamepadState = {
  /** Last known direction of the left analog stick */
  lastLeftStick: StickDirection;
  /** Last known direction of the right analog stick */
  lastRightStick: StickDirection;
  /** Event handler function for axis events */
  axesHandler: axesHandler;
  /** Event handler function for button events */
  buttonsHandler: buttonsHandler;
};

/**
 * Input mapping system with context switching for ExcaliburJS games.
 *
 * Provides a unified event-driven interface for keyboard, gamepad, and pointer inputs
 * with support for multiple input contexts that can be dynamically switched at runtime.
 *
 * @example
 * ```typescript
 * const inputMapper = new InputMapSystem(game);
 *
 * // Register a gameplay context
 * inputMapper.registerMap({
 *   name: "gameplay",
 *   inputMap: {
 *     KeyPresses: new Set([Keys.W, Keys.A, Keys.S, Keys.D]),
 *     GamepadAxesPolling: new Set([Axes.LeftStickX, Axes.LeftStickY])
 *   }
 * });
 *
 * // Switch to the context
 * inputMapper.switchContext("gameplay");
 *
 * // Listen for events
 * inputMapper.inputMapEmitter.on("keyPress", (data) => {
 *   console.log(`Key pressed: ${data.key} in context: ${data.ctx}`);
 * });
 * ```
 *
 * @fires keyPress - Emitted when a registered key is pressed
 * @fires keyRelease - Emitted when a registered key is released
 * @fires keyHold - Emitted when a registered key is held
 * @fires gamepadStick - Emitted when a gamepad stick changes direction
 * @fires gamepadButton - Emitted when a registered gamepad button is pressed
 * @fires pointer - Emitted for registered pointer events (up, down, move)
 * @fires wheel - Emitted for mouse wheel events
 */
export class InputMapSystem {
  /** Threshold for gamepad axis to register as directional input (0.5 = 50% deflection) */
  private static readonly GAMEPAD_AXIS_THRESHOLD = 0.5;

  /** Dead zone threshold to filter out stick drift (0.1 = 10% deflection) */
  private static readonly GAMEPAD_AXIS_THRESHOLD_NOISE = 0.1;

  /** Reserved context name used for the empty/default context */
  private static readonly EMPTY_CONTEXT = "empty";

  /** The currently active input context name */
  private _currentContext: string;

  /** Map of context names to their input configurations */
  private _contexts: Map<string, InputContext> = new Map();

  /** Set of all gamepad axes being polled across all contexts */
  private _gamepadAxesPolls: Set<Axes> = new Set();

  /** Set of all gamepad buttons being polled across all contexts */
  private _gamepadButtonsPolls: Set<Buttons> = new Set();

  /** Event emitter for input events - subscribe to this to receive input notifications */
  public inputMapEmitter: EventEmitter;

  /** Reference to the ExcaliburJS engine */
  private _engine: Engine;

  /** Map of connected gamepads to their current state and event handlers */
  private _gamePadState: Map<Gamepad, GamepadState> = new Map();

  /**
   * Creates a new InputMapSystem instance
   *
   * @param engine - The ExcaliburJS engine instance
   *
   * @example
   * ```typescript
   * const game = new Engine({ ... });
   * const inputMapper = new InputMapSystem(game);
   * ```
   */
  constructor(engine: Engine) {
    this._engine = engine;
    this.inputMapEmitter = new EventEmitter();
    this._currentContext = InputMapSystem.EMPTY_CONTEXT;
    this._contexts.set(this._currentContext, {});
    this.initialize();
  }

  // #region private methods

  /**
   * Validates if a key press event should be processed in the current context
   * @param key - The key to validate
   * @returns True if the key should trigger an event
   */
  private _validateKeyPress(key: Keys): boolean {
    const ctxRslt = this._validateContext();
    if (!ctxRslt.status) return false;
    const ctx = ctxRslt.context as InputContext;
    return ctx.KeyPresses?.has(key) ?? false;
  }

  /**
   * Validates if a key release event should be processed in the current context
   * @param key - The key to validate
   * @returns True if the key should trigger an event
   */
  private _validateKeyRelease(key: Keys): boolean {
    const ctxRslt = this._validateContext();
    if (!ctxRslt.status) return false;
    const ctx = ctxRslt.context as InputContext;
    return ctx.KeyReleases?.has(key) ?? false;
  }

  /**
   * Validates if a key hold event should be processed in the current context
   * @param key - The key to validate
   * @returns True if the key should trigger an event
   */
  private _validateKeyHold(key: Keys): boolean {
    const ctxRslt = this._validateContext();
    if (!ctxRslt.status) return false;
    const ctx = ctxRslt.context as InputContext;
    return ctx.KeyHolds?.has(key) ?? false;
  }

  /**
   * Validates the current context exists and is not the empty context
   * @returns Object containing validation status and context if valid
   */
  private _validateContext(): { status: boolean; context: InputContext | null } {
    if (this._currentContext === InputMapSystem.EMPTY_CONTEXT) {
      return { status: false, context: null };
    }
    if (!this._contexts.has(this._currentContext)) {
      return { status: false, context: null };
    }
    const ctx = this._contexts.get(this._currentContext);
    if (!ctx) return { status: false, context: null };
    return { status: true, context: ctx };
  }

  /**
   * Validates if a gamepad axis event should be processed in the current context
   * @param axis - The axis to validate
   * @returns True if the axis should trigger an event
   */
  private _validateGamepadAxes(axis: Axes): boolean {
    const ctxRslt = this._validateContext();
    if (!ctxRslt.status) return false;
    const ctx = ctxRslt.context as InputContext;
    return ctx.GamepadAxesTriggers?.has(axis) ?? false;
  }

  /**
   * Validates if a gamepad button event should be processed in the current context
   * @param button - The button to validate
   * @returns True if the button should trigger an event
   */
  private _validateGamepadButton(button: Buttons): boolean {
    const ctxRslt = this._validateContext();
    if (!ctxRslt.status) return false;
    const ctx = ctxRslt.context as InputContext;
    return ctx.GamepadButtonsTriggers?.has(button) ?? false;
  }

  /**
   * Computes the 8-way directional output from analog stick X/Y values
   *
   * Applies dead zones and thresholds to convert raw axis values into
   * discrete directions (up, down, left, right, and diagonals)
   *
   * @param x - Horizontal axis value (-1 to 1)
   * @param y - Vertical axis value (-1 to 1)
   * @returns The computed stick direction
   */
  private _computeDirection(x: number, y: number): StickDirection {
    const xMag = Math.abs(x);
    const yMag = Math.abs(y);

    // Apply dead zone
    if (xMag < InputMapSystem.GAMEPAD_AXIS_THRESHOLD_NOISE && yMag < InputMapSystem.GAMEPAD_AXIS_THRESHOLD_NOISE) {
      return STICK_DIRECTION.IDLE;
    }

    // Check diagonal directions first
    if (y < -InputMapSystem.GAMEPAD_AXIS_THRESHOLD && x < -InputMapSystem.GAMEPAD_AXIS_THRESHOLD) {
      return STICK_DIRECTION.UPLEFT;
    }
    if (y < -InputMapSystem.GAMEPAD_AXIS_THRESHOLD && x > InputMapSystem.GAMEPAD_AXIS_THRESHOLD) {
      return STICK_DIRECTION.UPRIGHT;
    }
    if (y > InputMapSystem.GAMEPAD_AXIS_THRESHOLD && x < -InputMapSystem.GAMEPAD_AXIS_THRESHOLD) {
      return STICK_DIRECTION.DOWNLEFT;
    }
    if (y > InputMapSystem.GAMEPAD_AXIS_THRESHOLD && x > InputMapSystem.GAMEPAD_AXIS_THRESHOLD) {
      return STICK_DIRECTION.DOWNRIGHT;
    }

    // Check cardinal directions
    if (y < -InputMapSystem.GAMEPAD_AXIS_THRESHOLD) return STICK_DIRECTION.UP;
    if (y > InputMapSystem.GAMEPAD_AXIS_THRESHOLD) return STICK_DIRECTION.DOWN;
    if (x < -InputMapSystem.GAMEPAD_AXIS_THRESHOLD) return STICK_DIRECTION.LEFT;
    if (x > InputMapSystem.GAMEPAD_AXIS_THRESHOLD) return STICK_DIRECTION.RIGHT;

    return STICK_DIRECTION.IDLE;
  }

  /**
   * Updates gamepad stick directions and emits events when direction changes
   *
   * Called when gamepad axis events are triggered. Computes directions for both
   * left and right sticks and emits events only when direction changes.
   *
   * @param gamepad - The gamepad to update
   */
  private _updateGamepadAxes(gamepad: Gamepad) {
    const leftStickX = gamepad.getAxes(Axes.LeftStickX);
    const leftStickY = gamepad.getAxes(Axes.LeftStickY);
    const rightStickX = gamepad.getAxes(Axes.RightStickX);
    const rightStickY = gamepad.getAxes(Axes.RightStickY);

    const leftDir = this._computeDirection(leftStickX, leftStickY);
    const rightDir = this._computeDirection(rightStickX, rightStickY);

    const gamepadState = this._gamePadState.get(gamepad);
    if (!gamepadState) return;

    // Emit events only on direction change
    if (leftDir !== gamepadState.lastLeftStick) {
      this.inputMapEmitter.emit("gamepadStick", {
        ctx: this._currentContext,
        gamepad,
        event: "leftStick",
        direction: leftDir,
      });
      gamepadState.lastLeftStick = leftDir;
    }

    if (rightDir !== gamepadState.lastRightStick) {
      this.inputMapEmitter.emit("gamepadStick", {
        ctx: this._currentContext,
        gamepad,
        event: "rightStick",
        direction: rightDir,
      });
      gamepadState.lastRightStick = rightDir;
    }
  }

  /**
   * Updates polled gamepad axes every frame
   *
   * Similar to _updateGamepadAxes but called from the update loop for
   * axes registered in GamepadAxesPolling
   *
   * @param gamepad - The gamepad to poll
   * @param axes - Which axis is being polled
   */
  private _updatePolledGamepadAxes(gamepad: Gamepad, axes: Axes) {
    const leftStickX = gamepad.getAxes(Axes.LeftStickX);
    const leftStickY = gamepad.getAxes(Axes.LeftStickY);
    const rightStickX = gamepad.getAxes(Axes.RightStickX);
    const rightStickY = gamepad.getAxes(Axes.RightStickY);

    const leftDir = this._computeDirection(leftStickX, leftStickY);
    const rightDir = this._computeDirection(rightStickX, rightStickY);

    const gamepadState = this._gamePadState.get(gamepad);
    if (!gamepadState) return;

    if (axes === Axes.LeftStickX || axes === Axes.LeftStickY) {
      this.inputMapEmitter.emit("gamepadStick", {
        ctx: this._currentContext,
        gamepad,
        event: "leftStick",
        direction: leftDir,
      });
    }

    if (axes === Axes.RightStickX || axes === Axes.RightStickY) {
      this.inputMapEmitter.emit("gamepadStick", {
        ctx: this._currentContext,
        gamepad,
        event: "rightStick",
        direction: rightDir,
      });
    }
  }

  /**
   * Updates polled gamepad buttons every frame
   *
   * @param gamepad - The gamepad to poll
   * @param button - Which button is being polled
   */
  private _updatePolledGamepadButton(gamepad: Gamepad, button: Buttons) {
    const gamepadState = this._gamePadState.get(gamepad);
    if (!gamepadState) return;

    const buttonState = gamepad.getButton(button);
    this.inputMapEmitter.emit("gamepadButton", {
      ctx: this._currentContext,
      gamepad,
      event: "button",
      button,
      value: buttonState,
    });
  }

  /**
   * Validates if a pointer event should be processed in the current context
   * @param evt - The pointer event to validate
   * @returns True if the event should be processed
   */
  private _validatePointerEvents(evt: PointerEvent): boolean {
    const ctxRslt = this._validateContext();
    if (!ctxRslt.status) return false;
    const ctx = ctxRslt.context as InputContext;
    return ctx.PointerTriggers?.has(evt.type) ?? false;
  }

  /**
   * Validates if wheel events should be processed in the current context
   * @returns True if wheel events should be processed
   */
  private _validateWheelEvents(): boolean {
    const ctxRslt = this._validateContext();
    if (!ctxRslt.status) return false;
    const ctx = ctxRslt.context as InputContext;
    return ctx.PointerTriggers?.has("wheel") ?? false;
  }

  /**
   * Update loop called every frame by ExcaliburJS
   *
   * Handles polling for gamepad axes and buttons that are registered
   * in the current context's polling sets
   */
  private _update() {
    const rslt = this._validateContext();
    if (!rslt.status) return;
    const ctx = rslt.context as InputContext;

    if (this._gamepadAxesPolls.size > 0 || this._gamepadButtonsPolls.size > 0) {
      // Poll axes
      ctx.GamepadAxesPolling?.forEach(axis => {
        this._gamePadState.forEach((_, gamepad) => {
          this._updatePolledGamepadAxes(gamepad, axis);
        });
      });

      // Poll buttons
      ctx.GamepadButtonsPolling?.forEach(button => {
        this._gamePadState.forEach((_, gamepad) => {
          this._updatePolledGamepadButton(gamepad, button);
        });
      });
    }
  }

  /**
   * Rebuilds polling sets by checking all registered contexts
   *
   * Called when contexts are registered/unregistered to ensure the polling
   * sets only contain inputs actively used by at least one context. This
   * prevents unnecessary polling overhead.
   */
  private _rebuildPollingSets(): void {
    this._gamepadAxesPolls.clear();
    this._gamepadButtonsPolls.clear();

    this._contexts.forEach((inputContext, contextName) => {
      if (contextName === InputMapSystem.EMPTY_CONTEXT) return;

      inputContext.GamepadAxesPolling?.forEach(axis => {
        this._gamepadAxesPolls.add(axis);
      });

      inputContext.GamepadButtonsPolling?.forEach(button => {
        this._gamepadButtonsPolls.add(button);
      });
    });
  }

  // #endregion private methods

  // #region public API

  /**
   * Initializes the input system by registering event listeners
   *
   * Called automatically by the constructor. Sets up listeners for:
   * - Keyboard events (press, release, hold)
   * - Gamepad connect/disconnect
   * - Gamepad axis and button events
   * - Pointer events (up, down, move, wheel)
   *
   * @internal Called automatically during construction
   */
  initialize() {
    this._engine.on("preupdate", this._update.bind(this));

    // Keyboard listeners
    this._engine.input.keyboard.on("press", (evt: KeyEvent) => {
      if (!this._validateKeyPress(evt.key)) return;
      this.inputMapEmitter.emit("keyPress", {
        ctx: this._currentContext,
        event: "press",
        key: evt.key,
      });
    });

    this._engine.input.keyboard.on("release", (evt: KeyEvent) => {
      if (!this._validateKeyRelease(evt.key)) return;
      this.inputMapEmitter.emit("keyRelease", {
        ctx: this._currentContext,
        event: "release",
        key: evt.key,
      });
    });

    this._engine.input.keyboard.on("hold", (evt: KeyEvent) => {
      if (!this._validateKeyHold(evt.key)) return;
      this.inputMapEmitter.emit("keyHold", {
        ctx: this._currentContext,
        event: "hold",
        key: evt.key,
      });
    });

    // Gamepad connection handling
    this._engine.input.gamepads.on("connect", (evt: GamepadConnectEvent) => {
      // Create unique event handlers for this gamepad
      const axesHandler = (ge: GamepadAxisEvent) => {
        if (!this._validateGamepadAxes(ge.axis)) return;
        this._updateGamepadAxes(ge.self);
      };

      const buttonsHandler = (ge: GamepadButtonEvent) => {
        if (!this._validateGamepadButton(ge.button)) return;
        this.inputMapEmitter.emit("gamepadButton", {
          ctx: this._currentContext,
          gamepad: ge.self,
          event: "button",
          button: ge.button,
          value: ge.value,
        });
      };

      // Store gamepad state and handlers
      this._gamePadState.set(evt.gamepad, {
        lastLeftStick: STICK_DIRECTION.IDLE,
        lastRightStick: STICK_DIRECTION.IDLE,
        axesHandler,
        buttonsHandler,
      });

      evt.gamepad.on("axis", axesHandler);
      evt.gamepad.on("button", buttonsHandler);
    });

    this._engine.input.gamepads.on("disconnect", (evt: GamepadDisconnectEvent) => {
      const gamepadState = this._gamePadState.get(evt.gamepad);
      if (!gamepadState) return;

      // Clean up event listeners
      evt.gamepad.off("axis", gamepadState.axesHandler);
      evt.gamepad.off("button", gamepadState.buttonsHandler);
      this._gamePadState.delete(evt.gamepad);
    });

    // Pointer listeners
    this._engine.input.pointers.primary.on("up", (evt: PointerEvent) => {
      if (!this._validatePointerEvents(evt)) return;
      this.inputMapEmitter.emit("pointer", {
        ctx: this._currentContext,
        event: "up",
        pointer: evt,
      });
    });

    this._engine.input.pointers.primary.on("down", (evt: PointerEvent) => {
      if (!this._validatePointerEvents(evt)) return;
      this.inputMapEmitter.emit("pointer", {
        ctx: this._currentContext,
        event: "down",
        pointer: evt,
      });
    });

    this._engine.input.pointers.primary.on("move", (evt: PointerEvent) => {
      if (!this._validatePointerEvents(evt)) return;
      this.inputMapEmitter.emit("pointer", {
        ctx: this._currentContext,
        event: "move",
        pointer: evt,
      });
    });

    this._engine.input.pointers.primary.on("wheel", (evt: WheelEvent) => {
      if (!this._validateWheelEvents()) return;
      this.inputMapEmitter.emit("wheel", {
        ctx: this._currentContext,
        event: "wheel",
        wheel: evt,
      });
    });
  }

  /**
   * Switches to a different input context
   *
   * Changes which input mappings are active. Only inputs registered in the
   * active context will trigger events.
   *
   * @param context - Name of the context to switch to
   * @returns True if successful, false if context doesn't exist
   *
   * @example
   * ```typescript
   * inputMapper.switchContext("gameplay"); // Switch to gameplay controls
   * inputMapper.switchContext("menu");     // Switch to menu controls
   * ```
   */
  switchContext(context: string): boolean {
    if (!this._contexts.has(context)) {
      console.warn(`Context "${context}" not found. Available: ${Array.from(this._contexts.keys())}`);
      return false;
    }
    this._currentContext = context;
    return true;
  }

  /**
   * Registers a new input mapping context
   *
   * Creates a named context with specific input mappings. Multiple contexts can
   * be registered and switched between at runtime.
   *
   * @param ctx - Context configuration object
   * @param ctx.name - Unique name for this context
   * @param ctx.inputMap - Input mappings for this context
   * @param ctx.override - If true, replaces an existing context with the same name
   * @returns True if registered successfully, false otherwise
   *
   * @example
   * ```typescript
   * inputMapper.registerMap({
   *   name: "gameplay",
   *   inputMap: {
   *     KeyPresses: new Set([Keys.W, Keys.A, Keys.S, Keys.D]),
   *     KeyHolds: new Set([Keys.Space]),
   *     GamepadAxesPolling: new Set([Axes.LeftStickX, Axes.LeftStickY])
   *   }
   * });
   * ```
   */
  registerMap(ctx: { name: string; inputMap: InputContext; override?: boolean }): boolean {
    // Validation
    if (!ctx.name || ctx.name.trim() === "") {
      console.error("Context name cannot be empty");
      return false;
    }

    if (ctx.name === InputMapSystem.EMPTY_CONTEXT) {
      console.error(`Cannot use reserved context name "${InputMapSystem.EMPTY_CONTEXT}"`);
      return false;
    }

    if (this._contexts.has(ctx.name) && !ctx.override) {
      console.warn(`Context "${ctx.name}" already exists. Use override: true to replace.`);
      return false;
    }

    this._contexts.set(ctx.name, ctx.inputMap);
    this._rebuildPollingSets();
    return true;
  }

  /**
   * Unregisters an input mapping context
   *
   * Removes a context and cleans up any polling associated with it.
   * If the context was the only one using certain polled inputs, those
   * inputs will no longer be polled.
   *
   * @param contextName - Name of the context to remove
   * @returns True if removed successfully, false if not found
   *
   * @example
   * ```typescript
   * inputMapper.unregisterMap("gameplay");
   * ```
   */
  unregisterMap(contextName: string): boolean {
    if (!this._contexts.has(contextName)) {
      console.warn(`Cannot unregister context "${contextName}" - not found`);
      return false;
    }

    this._contexts.delete(contextName);
    this._rebuildPollingSets();
    return true;
  }

  /**
   * Gets the name of the currently active context
   *
   * @returns The current context name
   *
   * @example
   * ```typescript
   * console.log(inputMapper.getCurrentContext()); // "gameplay"
   * ```
   */
  getCurrentContext(): string {
    return this._currentContext;
  }

  /**
   * Gets a list of all registered context names
   *
   * @returns Array of context names
   *
   * @example
   * ```typescript
   * const contexts = inputMapper.getAvailableContexts();
   * // ["empty", "gameplay", "menu", "pause"]
   * ```
   */
  getAvailableContexts(): string[] {
    return Array.from(this._contexts.keys());
  }

  /**
   * Checks if a context with the given name exists
   *
   * @param name - Context name to check
   * @returns True if the context exists
   *
   * @example
   * ```typescript
   * if (inputMapper.hasContext("gameplay")) {
   *   inputMapper.switchContext("gameplay");
   * }
   * ```
   */
  hasContext(name: string): boolean {
    return this._contexts.has(name);
  }

  /**
   * Disposes of the input system and cleans up all resources
   *
   * Removes all event listeners, clears all state, and resets the system
   * to its initial state. Call this when you're done with the input system
   * to prevent memory leaks.
   *
   * @example
   * ```typescript
   * // When cleaning up your game
   * inputMapper.dispose();
   * ```
   */
  dispose(): void {
    // Clean up gamepad handlers
    this._gamePadState.forEach((state, gamepad) => {
      gamepad.off("axis", state.axesHandler);
      gamepad.off("button", state.buttonsHandler);
    });

    // Clear all state
    this._gamePadState.clear();
    this._contexts.clear();
    this._gamepadAxesPolls.clear();
    this._gamepadButtonsPolls.clear();

    // Reset to initial state
    this._currentContext = InputMapSystem.EMPTY_CONTEXT;
    this._contexts.set(this._currentContext, {});
  }

  // #endregion public API
}
