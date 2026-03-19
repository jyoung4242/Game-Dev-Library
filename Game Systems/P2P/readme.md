# PeerNetworkManager

A global singleton networking manager for two-player turn-based games built with ExcaliburJS. Uses PeerJS for WebRTC peer-to-peer communication.

## Overview

The `PeerNetworkManager` provides a simple, high-level API for adding multiplayer functionality to turn-based games. It handles:

- **Peer-to-peer connections** via WebRTC
- **Automatic reconnection** for dropped connections
- **Structured messaging** with typed message envelopes
- **Turn-based gameplay** with built-in turn tracking
- **Event-driven architecture** for easy integration

## Installation

Install PeerJS as a dependency:

```bash
npm install peerjs
npm install --save-dev @types/peerjs  # if available
```

Copy `PeerNetworkManager.ts` into your project.

## Quick Start

### Basic Setup

```typescript
import { PeerNetworkManager } from './PeerNetworkManager';

const net = PeerNetworkManager.instance;
```

### Hosting a Game

```typescript
// Host side
const hostId = await net.hostGame();
console.log('Share this code:', hostId);

net.onConnected(() => {
  console.log('Opponent connected!');
});

net.onTurn(turnData => {
  game.applyOpponentTurn(turnData);
});
```

### Joining a Game

```typescript
// Join side
const hostId = prompt('Enter host code:');
await net.joinGame(hostId);

net.onTurn(turnData => {
  game.applyOpponentTurn(turnData);
});
```

### Sending Turns

```typescript
// When player makes a move
net.sendTurn({ action: 'move', x: 5, y: 3 });
```

## API Reference

### Singleton Access

```typescript
const net = PeerNetworkManager.instance;
PeerNetworkManager.resetInstance(); // For testing
```

### Lifecycle Methods

#### `hostGame(peerId?: string): Promise<string>`

Starts hosting a game and returns the host ID to share.

- `peerId`: Optional fixed ID (auto-generated if omitted)
- Returns: The local peer ID for sharing

#### `joinGame(hostPeerId: string): Promise<void>`

Joins an existing hosted game.

- `hostPeerId`: The ID from the host's `hostGame()` call

#### `destroy(): void`

Tears down all connections and resets state. Call when leaving multiplayer.

### Sending Messages

#### `send(message: NetworkMessage): void`

Sends a structured message to the connected peer.

```typescript
interface NetworkMessage {
  type: "turn" | "sync" | "chat" | "system";
  payload: unknown;
}
```

#### `sendTurn(data: unknown): void`

Sends a turn message with automatic turn number incrementing.

#### `sendSync(state: unknown): void`

Broadcasts a game state snapshot (typically host-only).

#### `sendChat(text: string): void`

Sends a chat message.

#### `sendSystem(command: string, data?: unknown): void`

Sends a system command (e.g., "ready", "forfeit").

### Connection Status

#### `isConnected(): boolean`

Returns true when a live data channel is open.

#### `localPeerId: string | null`

The local peer ID assigned by PeerJS.

#### `isHost: boolean`

True when acting as the hosting player.

### Event Handlers

#### `onMessage(handler: MessageHandler): void`

Register a handler for all incoming messages.

```typescript
type MessageHandler = (msg: NetworkMessage) => void;
```

#### `onConnected(handler: ConnectedHandler): void`

Called when the data channel opens.

```typescript
type ConnectedHandler = () => void;
```

#### `onDisconnected(handler: DisconnectedHandler): void`

Called when the connection closes.

```typescript
type DisconnectedHandler = () => void;
```

#### `onTurn(handler: TurnHandler): void`

Called for incoming turn messages (receives the payload data).

```typescript
type TurnHandler = (turnData: unknown) => void;
```

#### `onError(handler: ErrorHandler): void`

Called for network errors.

```typescript
type ErrorHandler = (err: Error) => void;
```

#### Removing Handlers

```typescript
offMessage(handler)
offConnected(handler)
offDisconnected(handler)
offTurn(handler)
offError(handler)
```

## Complete Examples

### Host Scene (ExcaliburJS)

```typescript
import { Scene } from 'excalibur';
import { PeerNetworkManager } from './PeerNetworkManager';

export class HostLobbyScene extends Scene {
  private net = PeerNetworkManager.instance;

  async onActivate(): Promise<void> {
    const hostId = await this.net.hostGame();
    console.log('Share this code:', hostId);

    this.net.onConnected(() => {
      console.log('Opponent connected!');
      this.engine.goToScene('game');
    });

    this.net.onTurn(turnData => {
      (this.engine.currentScene as any).applyOpponentTurn(turnData);
    });

    this.net.onDisconnected(() => {
      console.warn('Opponent disconnected.');
      this.engine.goToScene('lobby');
    });

    this.net.onError(err => {
      console.error('Network error:', err.message);
    });
  }

  onDeactivate(): void {
    this.net.destroy();
  }
}
```

### Join Scene

```typescript
import { Scene } from 'excalibur';
import { PeerNetworkManager } from './PeerNetworkManager';

export class JoinLobbyScene extends Scene {
  private net = PeerNetworkManager.instance;

  async onActivate(): Promise<void> {
    const hostId = prompt('Enter host code:') ?? '';
    await this.net.joinGame(hostId);

    this.net.onTurn(turnData => {
      (this.engine.currentScene as any).applyOpponentTurn(turnData);
    });

    this.engine.goToScene('game');
  }

  onDeactivate(): void {
    this.net.destroy();
  }
}
```

### Game Scene

```typescript
import { Scene } from 'excalibur';
import { PeerNetworkManager } from './PeerNetworkManager';

export class GameScene extends Scene {
  private net = PeerNetworkManager.instance;
  private myTurn = this.net.isHost; // host goes first

  submitMove(moveData: unknown): void {
    if (!this.myTurn) return;
    this.net.sendTurn(moveData);
    this.myTurn = false;
  }

  applyOpponentTurn(turnData: unknown): void {
    console.log('Opponent turn:', turnData);
    this.myTurn = true;
    // Update game state...
  }
}
```

## Message Types

### Turn Messages

```typescript
// Sent automatically by sendTurn()
{
  type: "turn",
  payload: {
    turnNumber: number,
    data: unknown  // Your game data
  }
}
```

### Sync Messages

```typescript
// Sent by sendSync()
{
  type: "sync",
  payload: unknown  // Game state snapshot
}
```

### Chat Messages

```typescript
// Sent by sendChat()
{
  type: "chat",
  payload: { text: string }
}
```

### System Messages

```typescript
// Sent by sendSystem()
{
  type: "system",
  payload: { command: string, data?: unknown }
}
```

## Error Handling

Always register error handlers:

```typescript
net.onError(err => {
  console.error('Network error:', err.message);
  // Show error UI to player
  // Attempt recovery or return to menu
});
```

Common errors:
- Connection timeouts
- Invalid peer IDs
- Network disconnections
- Malformed messages

## Best Practices

### Connection Management

- Call `destroy()` when leaving multiplayer scenes
- Handle disconnections gracefully
- Show connection status in UI

### Message Validation

- Keep payloads serializable (no class instances)
- Validate message data on receipt
- Use TypeScript interfaces for type safety

### Turn Management

- Use `sendTurn()` for game moves
- Track local turn state
- Handle out-of-order messages if needed

### UI Integration

- Display host ID clearly for sharing
- Show connection status
- Provide manual reconnect options

### Performance

- Messages are sent reliably by default
- Keep message payloads small
- Batch updates when possible

## Limitations

- Strictly two-player only
- Requires PeerJS signaling server
- WebRTC may be blocked by firewalls
- No built-in NAT traversal beyond PeerJS

## Troubleshooting

### Connection Issues

- Ensure PeerJS server is accessible
- Check browser WebRTC permissions
- Try different networks if behind strict firewalls

### Message Not Received

- Verify connection is open with `isConnected()`
- Check message format matches `NetworkMessage` interface
- Ensure handlers are registered before sending

### Reconnection Problems

- Reconnection only works for join-side
- Max 5 attempts with exponential backoff
- Manual rejoin may be needed for host disconnections