export type FSMResult<T = void> = {
  success: boolean;
  message?: string;
  value?: T;
};

export class ExFSM {
  public states = new Map<string, ExState>();
  public current: ExState | null = null;
  public currentParams: any[] = [];
  public currentTime: number = 0;

  constructor() {}

  /** Register new states, returns array of registered ExState */
  register(...types: (string | ExState)[]): FSMResult<ExState[]> {
    const generatedStates: ExState[] = [];

    for (const state of types) {
      const newState = typeof state === "string" ? new ExState(state) : state;

      if (this.states.has(newState.name)) {
        console.warn(`State "${newState.name}" is already registered and will be overwritten.`);
      }

      this.states.set(newState.name, newState);
      generatedStates.push(newState);
    }

    return { success: true, value: generatedStates };
  }

  /** Change current state */
  set(state: string | ExState, ...params: any[]): FSMResult<ExState> | Promise<FSMResult<ExState>> {
    const name = typeof state === "string" ? state : state.name;
    const next = this.states.get(name);

    if (!next) return { success: false, message: `State "${name}" not found` };

    const finalize = () => {
      this.current = next;
      this.currentParams = params;
      this.currentTime = Date.now();
      return { success: true, value: next };
    };

    // No current state, only enter next
    if (!this.current) {
      const entering = next.enter(this.current, ...params);
      return entering instanceof Promise ? entering.then(finalize) : finalize();
    }

    // Handle current exit
    const leaving = this.current.exit(next, ...params);
    if (leaving instanceof Promise) {
      return leaving.then(() => {
        const entering = next.enter(this.current, ...params);
        return entering instanceof Promise ? entering.then(finalize) : finalize();
      });
    }

    const entering = next.enter(this.current, ...params);
    return entering instanceof Promise ? entering.then(finalize) : finalize();
  }

  /** Check if a state is registered */
  has(state: string | ExState): boolean {
    const name = typeof state === "string" ? state : state.name;
    return this.states.has(name);
  }

  /** Get current state */
  get(): FSMResult<ExState> {
    if (!this.current) return { success: false, message: "No state set" };
    return { success: true, value: this.current };
  }

  /** Reset FSM */
  reset(): FSMResult<void> {
    this.current = null;
    this.currentParams = [];
    this.currentTime = 0;
    return { success: true };
  }

  /** Update current state */
  update(): FSMResult<void> | Promise<FSMResult<void>> {
    if (!this.current) return { success: false, message: "No current state" };

    const result = this.current.update(...this.currentParams);
    return result instanceof Promise ? result.then(() => ({ success: true })) : { success: true };
  }
}

export class ExState {
  constructor(public name: string) {}

  enter(_previous: ExState | null, ..._params: any): void | Promise<void> {}
  exit(_next: ExState | null, ..._params: any): void | Promise<void> {}
  update(..._params: any): void | Promise<void> {}
  repeat(..._params: any): void | Promise<void> {}
}
