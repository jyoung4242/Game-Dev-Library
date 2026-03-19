/**
 * PeerNetworkManager.ts
 *
 * A global singleton networking manager for two-player turn-based games built
 * with ExcaliburJS. Uses PeerJS for WebRTC peer-to-peer communication.
 *
 * Usage:
 *   import { PeerNetworkManager } from './PeerNetworkManager';
 *
 *   const net = PeerNetworkManager.instance;
 *
 *   // Host side – returns the ID to share with the opponent
 *   const hostId = await net.hostGame();
 *
 *   // Join side – dials the host directly
 *   await net.joinGame(hostId);
 *   net.onTurn(turn => game.applyOpponentTurn(turn));
 *
 * Dependencies (install via npm):
 *   npm install peerjs
 *   npm install --save-dev @types/peerjs   // if available, otherwise types are bundled
 */

import Peer, { DataConnection } from "peerjs";

// ---------------------------------------------------------------------------
// Message types
// ---------------------------------------------------------------------------

/** All structured messages sent over the network. */
export interface NetworkMessage {
  /** Discriminator for routing messages to the right handler. */
  type: "turn" | "sync" | "chat" | "system";
  /** Arbitrary game-specific payload. Keep serialisable (no class instances). */
  payload: unknown;
}

/** Convenience wrapper carried inside a 'turn' message. */
export interface TurnPayload {
  turnNumber: number;
  data: unknown;
}

// ---------------------------------------------------------------------------
// Internal types
// ---------------------------------------------------------------------------

type MessageHandler = (msg: NetworkMessage) => void;
type ConnectedHandler = () => void;
type DisconnectedHandler = () => void;
type TurnHandler = (turnData: unknown) => void;
type ErrorHandler = (err: Error) => void;

/** Internal reconnection state. */
interface ReconnectState {
  targetPeerId: string;
  attempts: number;
  maxAttempts: number;
  delayMs: number;
  timer: ReturnType<typeof setTimeout> | null;
}

// ---------------------------------------------------------------------------
// PeerNetworkManager
// ---------------------------------------------------------------------------

/**
 * Singleton networking manager.
 *
 * Lifecycle:
 *   1a. `hostGame(peerId?)`  – bootstraps the local Peer, then waits for an
 *                              incoming connection. Returns the host ID to share.
 *   1b. `joinGame(peerId)`   – bootstraps the local Peer, then dials the host.
 *   2.  `send(msg)`          – sends a NetworkMessage over the active connection.
 *   3.  `destroy()`          – closes everything and resets state.
 *
 * There is no separate `initialize()` step – both entry-points handle Peer
 * creation internally so callers only need a single awaited call.
 */
export class PeerNetworkManager {
  // ── Singleton ────────────────────────────────────────────────────────────

  private static _instance: PeerNetworkManager | null = null;

  /** Access the global singleton. Creates it on first call. */
  static get instance(): PeerNetworkManager {
    if (!PeerNetworkManager._instance) {
      PeerNetworkManager._instance = new PeerNetworkManager();
    }
    return PeerNetworkManager._instance;
  }

  /** Replace the singleton (useful for testing). */
  static resetInstance(): void {
    PeerNetworkManager._instance?.destroy();
    PeerNetworkManager._instance = null;
  }

  // ── Private constructor ───────────────────────────────────────────────────

  private constructor() {}

  // ── Internal state ────────────────────────────────────────────────────────

  private peer: Peer | null = null;
  private connection: DataConnection | null = null;
  private _localPeerId: string | null = null;
  private _isHost = false;
  private _connected = false;
  private _initialized = false;

  /** Turn counter incremented each time sendTurn is called. */
  private _turnNumber = 0;

  /** Reconnection bookkeeping (only for join-side). */
  private reconnect: ReconnectState | null = null;

  // ── Event handler registries ──────────────────────────────────────────────

  private messageHandlers: MessageHandler[] = [];
  private connectedHandlers: ConnectedHandler[] = [];
  private disconnectedHandlers: DisconnectedHandler[] = [];
  private turnHandlers: TurnHandler[] = [];
  private errorHandlers: ErrorHandler[] = [];

  // ── Public read-only properties ───────────────────────────────────────────

  /** The local peer ID assigned by PeerJS (available after `initialize()`). */
  get localPeerId(): string | null {
    return this._localPeerId;
  }

  /** True when acting as the hosting player. */
  get isHost(): boolean {
    return this._isHost;
  }

  // ── Lifecycle ─────────────────────────────────────────────────────────────

  /**
   * Create the local Peer object and obtain a peer ID from the PeerJS
   * signalling server.  Called internally by hostGame() and joinGame().
   *
   * @param peerId  Optional fixed ID. PeerJS generates one if omitted.
   * @returns       The assigned local peer ID.
   */
  private _initializePeer(peerId?: string): Promise<string> {
    if (this._initialized && this.peer && !this.peer.destroyed) {
      // Already initialised – return the existing ID.
      return Promise.resolve(this._localPeerId!);
    }

    return new Promise<string>((resolve, reject) => {
      const peer = peerId ? new Peer(peerId) : new Peer();

      peer.on("open", (id: string) => {
        this.peer = peer;
        this._localPeerId = id;
        this._initialized = true;
        console.log(`[PeerNetworkManager] Local peer ID: ${id}`);
        this._attachPeerListeners(peer);
        resolve(id);
      });

      peer.on("error", (err: Error) => {
        console.error("[PeerNetworkManager] Peer error during init:", err);
        reject(err);
      });
    });
  }

  /**
   * Start hosting a game.
   *
   * Bootstraps the local Peer (if not already done), then resolves immediately
   * with the host ID so the caller can display it in a lobby UI.  The
   * `onConnected` callback fires once the opponent actually connects.
   *
   * Extra incoming connections beyond the first are rejected to keep the
   * session strictly two-player.
   *
   * @param peerId  Optional fixed host ID. PeerJS generates one if omitted.
   * @returns       The local peer ID to share with the joining player.
   */
  async hostGame(peerId?: string): Promise<string> {
    const id = await this._initializePeer(peerId);
    this._isHost = true;

    // Listen for exactly one incoming connection.
    this.peer!.on("connection", (conn: DataConnection) => {
      if (this._connected) {
        conn.close();
        console.warn("[PeerNetworkManager] Extra connection rejected – already paired.");
        return;
      }
      this._registerConnection(conn);
    });

    console.log(`[PeerNetworkManager] Hosting. Share this ID: ${id}`);
    return id;
  }

  /**
   * Join an existing hosted game.
   *
   * Bootstraps the local Peer (if not already done), then dials the host.
   * Resolves once the data channel is open.
   *
   * @param hostPeerId  The ID returned by the host's `hostGame()` call.
   */
  async joinGame(hostPeerId: string): Promise<void> {
    await this._initializePeer();
    this._isHost = false;

    // Remember target for automatic reconnection.
    this.reconnect = {
      targetPeerId: hostPeerId,
      attempts: 0,
      maxAttempts: 5,
      delayMs: 2_000,
      timer: null,
    };

    return this._dial(hostPeerId);
  }

  /**
   * Tear down all connections and reset internal state.
   * Call this when leaving a multiplayer scene.
   */
  destroy(): void {
    this._cancelReconnect();
    this.connection?.close();
    this.peer?.destroy();

    this.peer = null;
    this.connection = null;
    this._localPeerId = null;
    this._isHost = false;
    this._connected = false;
    this._initialized = false;
    this._turnNumber = 0;
    this.reconnect = null;

    // Clear all handlers.
    this.messageHandlers = [];
    this.connectedHandlers = [];
    this.disconnectedHandlers = [];
    this.turnHandlers = [];
    this.errorHandlers = [];

    console.log("[PeerNetworkManager] Destroyed.");
  }

  // ── Sending ───────────────────────────────────────────────────────────────

  /**
   * Send a structured message to the connected peer.
   *
   * Silently drops the message (with a warning) when no connection is open,
   * so callers do not need to guard every send.
   */
  send(message: NetworkMessage): void {
    if (!this._connected || !this.connection) {
      console.warn("[PeerNetworkManager] send() called while disconnected. Message dropped:", message);
      return;
    }

    if (!this._isValidMessage(message)) {
      console.error("[PeerNetworkManager] Attempted to send an invalid message:", message);
      return;
    }

    try {
      // PeerJS serialises via JSON internally; we can pass the object directly.
      this.connection.send(message);
    } catch (err) {
      console.error("[PeerNetworkManager] Failed to send message:", err);
      this._emitError(err instanceof Error ? err : new Error(String(err)));
    }
  }

  /**
   * Helper for turn-based gameplay.  Wraps `data` in a 'turn' message and
   * increments the local turn counter.
   */
  sendTurn(data: unknown): void {
    const payload: TurnPayload = {
      turnNumber: ++this._turnNumber,
      data,
    };
    this.send({ type: "turn", payload });
  }

  /**
   * Broadcast a sync snapshot (e.g. authoritative game state).
   * Typically only the host calls this.
   */
  sendSync(state: unknown): void {
    this.send({ type: "sync", payload: state });
  }

  /** Send a chat message. */
  sendChat(text: string): void {
    this.send({ type: "chat", payload: { text } });
  }

  /** Send a system-level message (e.g. ready, forfeit). */
  sendSystem(command: string, data?: unknown): void {
    this.send({ type: "system", payload: { command, data } });
  }

  // ── Connection status ────────────────────────────────────────────────────

  /** Returns true only when a live data channel is open. */
  isConnected(): boolean {
    return this._connected;
  }

  // ── Event registration ────────────────────────────────────────────────────

  /**
   * Register a handler called for every incoming NetworkMessage.
   * Multiple handlers can be registered; all are called in order.
   */
  onMessage(handler: MessageHandler): void {
    this.messageHandlers.push(handler);
  }

  /** Register a handler called when the data channel opens. */
  onConnected(handler: ConnectedHandler): void {
    this.connectedHandlers.push(handler);
  }

  /** Register a handler called when the data channel closes. */
  onDisconnected(handler: DisconnectedHandler): void {
    this.disconnectedHandlers.push(handler);
  }

  /**
   * Register a handler for incoming 'turn' messages.
   * Receives the raw `data` field from the TurnPayload (not the envelope).
   */
  onTurn(handler: TurnHandler): void {
    this.turnHandlers.push(handler);
  }

  /** Register a handler for network errors. */
  onError(handler: ErrorHandler): void {
    this.errorHandlers.push(handler);
  }

  // Remove handlers
  offMessage(handler: MessageHandler): void {
    this.messageHandlers = this.messageHandlers.filter(h => h !== handler);
  }

  offConnected(handler: ConnectedHandler): void {
    this.connectedHandlers = this.connectedHandlers.filter(h => h !== handler);
  }

  offDisconnected(handler: DisconnectedHandler): void {
    this.disconnectedHandlers = this.disconnectedHandlers.filter(h => h !== handler);
  }

  offTurn(handler: TurnHandler): void {
    this.turnHandlers = this.turnHandlers.filter(h => h !== handler);
  }

  offError(handler: ErrorHandler): void {
    this.errorHandlers = this.errorHandlers.filter(h => h !== handler);
  }

  // ── Private helpers ───────────────────────────────────────────────────────

  /** Dial out to a remote peer and resolve when the channel opens. */
  private _dial(hostPeerId: string): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      const conn = this.peer!.connect(hostPeerId, {
        reliable: true,
        serialization: "json",
      });

      const timeout = setTimeout(() => {
        reject(new Error(`[PeerNetworkManager] Connection to ${hostPeerId} timed out.`));
      }, 15_000);

      // Register conn immediately (before 'open') so _registerConnection can
      // attach its own 'open' listener and catch it. The onOpen callback lets
      // _dial resolve its promise from within that same 'open' event.
      this._registerConnection(conn, () => {
        clearTimeout(timeout);
        resolve();
      });

      conn.on("error", (err: Error) => {
        clearTimeout(timeout);
        reject(err);
      });
    });
  }

  /**
   * Attach all listeners to a DataConnection.
   *
   * Must be called BEFORE the connection's 'open' event fires so that this
   * method can attach its own 'open' listener and catch it.  Both call sites
   * (host: peer.on('connection'), joiner: _dial()) satisfy this because:
   *   - Host: PeerJS delivers the DataConnection before 'open' fires.
   *   - Joiner: _dial() now calls this immediately after peer.connect(),
   *     without waiting for 'open' first.
   *
   * @param conn    The incoming or outgoing DataConnection.
   * @param onOpen  Optional callback fired when 'open' fires (used by _dial
   *                to resolve its Promise at the same moment).
   */
  private _registerConnection(conn: DataConnection, onOpen?: () => void): void {
    this.connection = conn;

    // Attach data/close/error immediately so nothing is missed before 'open'.
    conn.on("data", (raw: unknown) => this._handleRawData(raw));

    conn.on("close", () => {
      console.log("[PeerNetworkManager] Connection closed.");
      this._connected = false;
      this.connection = null;
      this._emitDisconnected();
      this._attemptReconnect();
    });

    conn.on("error", (err: Error) => {
      console.error("[PeerNetworkManager] Connection error:", err);
      this._emitError(err);
    });

    // 'open' is the single authoritative signal that the channel is writable.
    // Both host and joiner paths converge here.
    conn.on("open", () => {
      this._connected = true;
      console.log("[PeerNetworkManager] Data channel open and ready to send.");
      this._emitConnected();
      onOpen?.();
    });
  }

  /** Attach top-level peer error and disconnection listeners. */
  private _attachPeerListeners(peer: Peer): void {
    peer.on("disconnected", () => {
      console.warn("[PeerNetworkManager] Peer disconnected from signalling server.");
      // Attempt to reconnect to the signalling server so the ID stays live.
      if (!peer.destroyed) {
        peer.reconnect();
      }
    });

    peer.on("error", (err: Error) => {
      console.error("[PeerNetworkManager] Peer-level error:", err);
      this._emitError(err);
    });

    peer.on("close", () => {
      console.warn("[PeerNetworkManager] Peer destroyed.");
    });
  }

  /**
   * Validate and dispatch an incoming raw data packet.
   * Guards against malformed / malicious payloads.
   */
  private _handleRawData(raw: unknown): void {
    if (!this._isValidMessage(raw)) {
      console.warn("[PeerNetworkManager] Received invalid message – discarded:", raw);
      return;
    }

    const msg = raw as NetworkMessage;

    // Route turn messages to dedicated handlers.
    if (msg.type === "turn") {
      const payload = msg.payload as TurnPayload;
      this.turnHandlers.forEach(h => {
        try {
          h(payload.data);
        } catch (e) {
          console.error("[PeerNetworkManager] Error in turn handler:", e);
        }
      });
    }

    // Always also fire the generic message handlers.
    this.messageHandlers.forEach(h => {
      try {
        h(msg);
      } catch (e) {
        console.error("[PeerNetworkManager] Error in message handler:", e);
      }
    });
  }

  /**
   * Runtime validation of a NetworkMessage shape.
   * Returns true if `obj` looks like a valid NetworkMessage.
   */
  private _isValidMessage(obj: unknown): obj is NetworkMessage {
    if (typeof obj !== "object" || obj === null) return false;
    const m = obj as Record<string, unknown>;
    return typeof m["type"] === "string" && ["turn", "sync", "chat", "system"].includes(m["type"]) && "payload" in m;
  }

  /** Attempt to re-dial the host after an unexpected disconnection. */
  private _attemptReconnect(): void {
    if (!this.reconnect || this._isHost) return; // only the join-side reconnects

    const r = this.reconnect;
    if (r.attempts >= r.maxAttempts) {
      console.error("[PeerNetworkManager] Max reconnection attempts reached.");
      return;
    }

    r.attempts++;
    const delay = r.delayMs * Math.pow(1.5, r.attempts - 1); // exponential back-off
    console.log(`[PeerNetworkManager] Reconnecting in ${delay}ms (attempt ${r.attempts}/${r.maxAttempts})…`);

    r.timer = setTimeout(async () => {
      try {
        await this._dial(r.targetPeerId);
        r.attempts = 0; // reset on success
        console.log("[PeerNetworkManager] Reconnected successfully.");
      } catch (err) {
        console.error("[PeerNetworkManager] Reconnect attempt failed:", err);
        this._attemptReconnect(); // schedule the next attempt
      }
    }, delay);
  }

  /** Cancel any pending reconnection timer. */
  private _cancelReconnect(): void {
    if (this.reconnect?.timer !== null) {
      clearTimeout(this.reconnect!.timer!);
      this.reconnect!.timer = null;
    }
  }

  // ── Emitters ──────────────────────────────────────────────────────────────

  private _emitConnected(): void {
    this.connectedHandlers.forEach(h => {
      try {
        h();
      } catch (e) {
        console.error("[PeerNetworkManager] Error in connected handler:", e);
      }
    });
  }

  private _emitDisconnected(): void {
    this.disconnectedHandlers.forEach(h => {
      try {
        h();
      } catch (e) {
        console.error("[PeerNetworkManager] Error in disconnected handler:", e);
      }
    });
  }

  private _emitError(err: Error): void {
    this.errorHandlers.forEach(h => {
      try {
        h(err);
      } catch (e) {
        console.error("[PeerNetworkManager] Error in error handler:", e);
      }
    });
  }
}

// ---------------------------------------------------------------------------
// Example usage (ExcaliburJS integration)
// ---------------------------------------------------------------------------
//
// ── host-scene.ts ────────────────────────────────────────────────────────────
//
//   import { Scene } from 'excalibur';
//   import { PeerNetworkManager } from './PeerNetworkManager';
//
//   export class HostLobbyScene extends Scene {
//     private net = PeerNetworkManager.instance;
//
//     onActivate(): void {
//       this._setup();
//     }
//
//     private async _setup(): Promise<void> {
//       // Single call – bootstraps the Peer and starts listening for opponents.
//       const hostId = await this.net.hostGame();
//
//       // Show the code in your lobby UI so the host can share it.
//       console.log('Share this code with your opponent:', hostId);
//
//       this.net.onConnected(() => {
//         console.log('Opponent connected! Starting game…');
//         this.engine.goToScene('game');
//       });
//
//       this.net.onTurn(turnData => {
//         (this.engine.currentScene as any).applyOpponentTurn(turnData);
//       });
//
//       this.net.onDisconnected(() => {
//         console.warn('Opponent disconnected.');
//         this.engine.goToScene('lobby');
//       });
//
//       this.net.onError(err => {
//         console.error('Network error:', err.message);
//       });
//     }
//   }
//
// ── join-scene.ts ─────────────────────────────────────────────────────────────
//
//   import { Scene } from 'excalibur';
//   import { PeerNetworkManager } from './PeerNetworkManager';
//
//   export class JoinLobbyScene extends Scene {
//     private net = PeerNetworkManager.instance;
//
//     async onActivate(): Promise<void> {
//       const hostId = prompt('Enter host code:') ?? '';
//
//       // Single call – bootstraps the Peer and opens the data channel.
//       await this.net.joinGame(hostId);
//
//       this.net.onTurn(turnData => {
//         (this.engine.currentScene as any).applyOpponentTurn(turnData);
//       });
//
//       this.engine.goToScene('game');
//     }
//   }
//
// ── game-scene.ts ─────────────────────────────────────────────────────────────
//
//   import { Scene } from 'excalibur';
//   import { PeerNetworkManager } from './PeerNetworkManager';
//
//   export class GameScene extends Scene {
//     private net = PeerNetworkManager.instance;
//     private myTurn = PeerNetworkManager.instance.isHost; // host goes first
//
//     /** Called by UI when the local player confirms their move. */
//     submitMove(moveData: unknown): void {
//       if (!this.myTurn) return;
//       this.net.sendTurn(moveData);
//       this.myTurn = false; // wait for opponent
//     }
//
//     /** Called by the onTurn handler registered in the lobby scene. */
//     applyOpponentTurn(turnData: unknown): void {
//       console.log('Applying opponent turn:', turnData);
//       this.myTurn = true; // now it's our turn
//       // … update game state …
//     }
//   }
