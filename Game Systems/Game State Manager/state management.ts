import { EventEmitter } from "excalibur";

// ─── Path Typing ────────────────────────────────────────────────────────────

type Primitive = string | number | boolean | null | undefined;

type PathsOf<T, Prefix extends string = ""> = T extends Primitive
  ? never
  : T extends Array<infer _>
    ? never
    : {
        [K in keyof T & string]: Prefix extends ""
          ? K | (T[K] extends Primitive ? never : PathsOf<T[K], K>)
          : `${Prefix}.${K}` | (T[K] extends Primitive ? never : PathsOf<T[K], `${Prefix}.${K}`>);
      }[keyof T & string];

export type Path<T> = PathsOf<T>;

export type PathValue<T, P extends string> = P extends keyof T
  ? T[P]
  : P extends `${infer K}.${infer Rest}`
    ? K extends keyof T
      ? Rest extends Path<T[K]>
        ? PathValue<T[K], Rest>
        : never
      : never
    : never;

// ─── Event Types ─────────────────────────────────────────────────────────────

export interface ChangePayload<State, V = unknown> {
  path: string;
  previousValue: V;
  value: V;
  previousState: Readonly<State>;
  state: Readonly<State>;
}

type ChangeEventMap<State> = {
  change: ChangePayload<State>;
  [key: `change:${string}`]: ChangePayload<State>;
};

// ─── StateStore Interface ────────────────────────────────────────────────────

export interface StateStore<State extends object> {
  get(): Readonly<State>;
  get<K extends Path<State>>(path: K): Readonly<PathValue<State, K>>;
  select<T>(selector: (state: Readonly<State>) => T): Readonly<T>;

  set<K extends Path<State>>(path: K, value: PathValue<State, K>): void;
  update<K extends Path<State>>(path: K, fn: (current: PathValue<State, K>) => PathValue<State, K>): void;
  patch(partial: DeepPartial<State>): void;
  batch(fn: (store: BatchContext<State>) => void): void;

  on<E extends keyof ChangeEventMap<State>>(event: E, handler: (payload: ChangeEventMap<State>[E]) => void): void;
  off<E extends keyof ChangeEventMap<State>>(event: E, handler: (payload: ChangeEventMap<State>[E]) => void): void;

  subscribe<K extends Path<State>>(path: K, handler: (payload: ChangePayload<State, PathValue<State, K>>) => void): () => void;

  serialize(): string;
  reset(): void;
}

export interface BatchContext<State extends object> {
  set<K extends Path<State>>(path: K, value: PathValue<State, K>): void;
  update<K extends Path<State>>(path: K, fn: (current: PathValue<State, K>) => PathValue<State, K>): void;
  patch(partial: DeepPartial<State>): void;
}

type DeepPartial<T> = T extends Primitive ? T : { [K in keyof T]?: DeepPartial<T[K]> };

// ─── Utility Helpers ─────────────────────────────────────────────────────────

function parsePath(path: string): string[] {
  return path.split(".");
}

function deepFreeze<T>(obj: T): Readonly<T> {
  if (obj === null || typeof obj !== "object") return obj;
  Object.getOwnPropertyNames(obj).forEach(name => {
    const val = (obj as Record<string, unknown>)[name];
    if (val && typeof val === "object") deepFreeze(val);
  });
  return Object.freeze(obj);
}

function deepClone<T>(obj: T): T {
  if (obj === null || typeof obj !== "object") return obj;
  if (Array.isArray(obj)) return (obj as unknown[]).map(deepClone) as unknown as T;
  const result = {} as Record<string, unknown>;
  for (const key of Object.keys(obj as object)) {
    result[key] = deepClone((obj as Record<string, unknown>)[key]);
  }
  return result as T;
}

function getAtPath<T>(obj: T, segments: string[]): unknown {
  let current: unknown = obj;
  for (const seg of segments) {
    if (current === null || typeof current !== "object") {
      throw new Error(`Invalid path segment "${seg}": not an object`);
    }
    current = (current as Record<string, unknown>)[seg];
  }
  return current;
}

function setAtPath<T extends object>(obj: T, segments: string[], value: unknown): T {
  if (segments.length === 0) return value as T;
  const [head, ...tail] = segments;
  if (typeof obj !== "object" || obj === null) {
    throw new Error(`Cannot set path on non-object at segment "${head}"`);
  }
  const record = obj as Record<string, unknown>;
  const updated = { ...record };
  if (tail.length === 0) {
    updated[head] = value;
  } else {
    const child = record[head];
    if (child === null || typeof child !== "object") {
      throw new Error(`Path segment "${head}" is not an object`);
    }
    updated[head] = setAtPath(child as object, tail, value);
  }
  return updated as T;
}

function shallowEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (a === null || b === null) return false;
  if (typeof a !== "object" || typeof b !== "object") return false;
  const keysA = Object.keys(a as object);
  const keysB = Object.keys(b as object);
  if (keysA.length !== keysB.length) return false;
  for (const k of keysA) {
    if ((a as Record<string, unknown>)[k] !== (b as Record<string, unknown>)[k]) return false;
  }
  return true;
}

function deepMerge<T extends object>(base: T, partial: DeepPartial<T>): T {
  const result = { ...base } as Record<string, unknown>;
  for (const key of Object.keys(partial as object)) {
    const pVal = (partial as Record<string, unknown>)[key];
    const bVal = (base as Record<string, unknown>)[key];
    if (
      pVal !== undefined &&
      pVal !== null &&
      typeof pVal === "object" &&
      !Array.isArray(pVal) &&
      bVal !== null &&
      typeof bVal === "object"
    ) {
      result[key] = deepMerge(bVal as object, pVal as DeepPartial<object>);
    } else if (pVal !== undefined) {
      result[key] = pVal;
    }
  }
  return result as T;
}

// ─── Factory ─────────────────────────────────────────────────────────────────

export function createStateStore<State extends object>(initialState: State): StateStore<State> {
  const _initial: Readonly<State> = deepFreeze(deepClone(initialState));
  let _state: Readonly<State> = _initial;

  // ExcaliburJS EventEmitter is typed with a map of eventName -> data type.
  // We use a loosely typed emitter here since we emit dynamic path-keyed events.
  const _emitter = new EventEmitter<ChangeEventMap<State>>();

  function _emit(path: string, previousValue: unknown, value: unknown, previousState: Readonly<State>): void {
    const payload: ChangePayload<State> = {
      path,
      previousValue,
      value,
      previousState,
      state: _state,
    };
    _emitter.emit("change", payload);
    _emitter.emit(`change:${path}` as `change:${string}`, payload);
  }

  function _applySet(currentState: Readonly<State>, segments: string[], value: unknown): Readonly<State> {
    return deepFreeze(setAtPath(deepClone(currentState), segments, value));
  }

  // Overloaded get
  function get(): Readonly<State>;
  function get<K extends Path<State>>(path: K): Readonly<PathValue<State, K>>;
  function get<K extends Path<State>>(path?: K): Readonly<State> | Readonly<PathValue<State, K>> {
    if (path === undefined) return _state;
    const segments = parsePath(path);
    const val = getAtPath(_state, segments);
    return deepFreeze(deepClone(val)) as Readonly<PathValue<State, K>>;
  }

  function select<T>(selector: (state: Readonly<State>) => T): Readonly<T> {
    const result = selector(_state);
    if (result !== null && typeof result === "object") {
      return deepFreeze(deepClone(result)) as Readonly<T>;
    }
    return result as Readonly<T>;
  }

  function set<K extends Path<State>>(path: K, value: PathValue<State, K>): void {
    const segments = parsePath(path);
    const previousValue = getAtPath(_state, segments);
    if (shallowEqual(previousValue, value)) return;
    const previousState = _state;
    _state = _applySet(_state, segments, value);
    _emit(path, previousValue, value, previousState);
  }

  function update<K extends Path<State>>(path: K, fn: (current: PathValue<State, K>) => PathValue<State, K>): void {
    const segments = parsePath(path);
    const current = getAtPath(_state, segments) as PathValue<State, K>;
    const next = fn(deepClone(current));
    set(path, next);
  }

  function patch(partial: DeepPartial<State>): void {
    const merged = deepMerge(_state as State, partial);
    const nextState = deepFreeze(merged);
    const changedPaths: Array<{ path: string; prev: unknown; next: unknown }> = [];
    collectChangedPaths("", _state, nextState, changedPaths);
    if (changedPaths.length === 0) return;
    const previousState = _state;
    _state = nextState;
    for (const entry of changedPaths) {
      _emit(entry.path, entry.prev, entry.next, previousState);
    }
  }

  function collectChangedPaths(
    prefix: string,
    prev: unknown,
    next: unknown,
    out: Array<{ path: string; prev: unknown; next: unknown }>,
  ): void {
    if (prev === next) return;
    if (
      prev !== null &&
      next !== null &&
      typeof prev === "object" &&
      typeof next === "object" &&
      !Array.isArray(prev) &&
      !Array.isArray(next)
    ) {
      const allKeys = new Set([...Object.keys(prev as object), ...Object.keys(next as object)]);
      for (const k of allKeys) {
        const pv = (prev as Record<string, unknown>)[k];
        const nv = (next as Record<string, unknown>)[k];
        const childPath = prefix ? `${prefix}.${k}` : k;
        collectChangedPaths(childPath, pv, nv, out);
      }
    } else if (!shallowEqual(prev, next)) {
      out.push({ path: prefix, prev, next });
    }
  }

  function batch(fn: (ctx: BatchContext<State>) => void): void {
    let pendingState = _state;
    const changes: Array<{ path: string; prev: unknown; next: unknown; prevState: Readonly<State> }> = [];

    const ctx: BatchContext<State> = {
      set<K extends Path<State>>(path: K, value: PathValue<State, K>): void {
        const segments = parsePath(path);
        const previousValue = getAtPath(pendingState, segments);
        if (shallowEqual(previousValue, value)) return;
        const prevState = pendingState;
        pendingState = deepFreeze(setAtPath(deepClone(pendingState), segments, value));
        changes.push({ path, prev: previousValue, next: value, prevState });
      },
      update<K extends Path<State>>(path: K, fn2: (current: PathValue<State, K>) => PathValue<State, K>): void {
        const segments = parsePath(path);
        const current = getAtPath(pendingState, segments) as PathValue<State, K>;
        const next = fn2(deepClone(current));
        ctx.set(path, next);
      },
      patch(partial: DeepPartial<State>): void {
        const merged = deepFreeze(deepMerge(pendingState as State, partial));
        const changedPaths: Array<{ path: string; prev: unknown; next: unknown }> = [];
        collectChangedPaths("", pendingState, merged, changedPaths);
        if (changedPaths.length === 0) return;
        const prevState = pendingState;
        pendingState = merged;
        for (const entry of changedPaths) {
          changes.push({ path: entry.path, prev: entry.prev, next: entry.next, prevState });
        }
      },
    };

    fn(ctx);

    if (pendingState === _state) return;
    _state = pendingState;

    for (const change of changes) {
      _emit(change.path, change.prev, change.next, change.prevState);
    }
  }

  function on<E extends keyof ChangeEventMap<State>>(event: E, handler: (payload: ChangeEventMap<State>[E]) => void): void {
    _emitter.on(event, handler as (payload: ChangeEventMap<State>[E]) => void);
  }

  function off<E extends keyof ChangeEventMap<State>>(event: E, handler: (payload: ChangeEventMap<State>[E]) => void): void {
    _emitter.off(event, handler as (payload: ChangeEventMap<State>[E]) => void);
  }

  function subscribe<K extends Path<State>>(
    path: K,
    handler: (payload: ChangePayload<State, PathValue<State, K>>) => void,
  ): () => void {
    const eventName = `change:${path}` as `change:${string}`;
    const wrapped = (payload: ChangePayload<State>) => handler(payload as unknown as ChangePayload<State, PathValue<State, K>>);
    _emitter.on(eventName, wrapped);
    return () => _emitter.off(eventName, wrapped);
  }

  function serialize(): string {
    return JSON.stringify(_state);
  }

  function reset(): void {
    const previousState = _state;
    _state = _initial;
    const changes: Array<{ path: string; prev: unknown; next: unknown }> = [];
    collectChangedPaths("", previousState, _state, changes);
    for (const change of changes) {
      _emit(change.path, change.prev, change.next, previousState);
    }
  }

  return { get, select, set, update, patch, batch, on, off, subscribe, serialize, reset };
}

// ─── Example Usage ───────────────────────────────────────────────────────────
/*
interface GameState {
  player: {
    hp: number;
    mp: number;
    name: string;
    position: {
      x: number;
      y: number;
    };
  };
  score: number;
  level: number;
  paused: boolean;
}

const store = createStateStore<GameState>({
  player: {
    hp: 100,
    mp: 50,
    name: "Hero",
    position: { x: 0, y: 0 },
  },
  score: 0,
  level: 1,
  paused: false,
});

// Read full state
const fullState = store.get();

// Read typed path
const hp = store.get("player.hp"); // number

// Selector
const pos = store.select(s => s.player.position); // Readonly<{x,y}>

// Set a value
store.set("player.hp", 80); // ✅ valid
// store.set("player.hp", "dead"); // ❌ compile error

// Update via function
store.update("player.hp", current => Math.max(0, current - 10));

// Patch nested partial
store.patch({ player: { mp: 30 }, score: 500 });

// Subscribe to specific path
const unsub = store.subscribe("player.hp", ({ previousValue, value }) => {
  console.log(`HP changed: ${previousValue} → ${value}`);
});

// Subscribe to all changes
store.on("change", ({ path, value }) => {
  console.log(`[change] ${path} =`, value);
});

// Batch updates (single emission cycle)
store.batch(ctx => {
  ctx.set("player.hp", 100);
  ctx.set("player.mp", 50);
  ctx.set("score", 1000);
});

// Serialize to JSON
const json = store.serialize();
console.log("Serialized:", json);

// Reset to initial state
store.reset();

// Unsubscribe
unsub();

// Immutability guard — these will not compile or mutate internal state:
// store.get().score = 999;                  // ❌ readonly
// store.get("player.position").x = 100;    // ❌ readonly

console.log("Final state:", store.get());
*/
