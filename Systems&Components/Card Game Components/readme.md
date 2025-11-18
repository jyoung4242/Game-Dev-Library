# Card Game System for Excalibur.js

A comprehensive card game framework built on top of Excalibur.js, providing all the components needed to create poker-style,
deck-building, trading card games, and more.

## Table of Contents

- [Installation](#installation)
- [Quick Start](#quick-start)
- [Core Concepts](#core-concepts)
  - [Card Result](#card-result-pattern)   
- [Components](#components)
  - [CardComponent](#cardcomponent)
  - [PlayingCardComponent](#playingcardcomponent)
  - [CardDeckComponent](#carddeckcomponent)
  - [CardHandComponent](#cardhandcomponent)
  - [TableZoneComponent](#tablezonecomponent)
  - [TableStackComponent](#tablestackcomponent)
  - [TableComponent](#tablecomponent)
- [Card Actions](#card-actions)
- [Events System](#events-system)
- [Type System](#type-system)
- [Examples](#examples)
- [License](#license)
- [Contributing](#contributing)
- [Support](#support)

---

## Installation

```bash
npm install excalibur
```

Copy the card system file into your project and import the components you need:

```typescript
import {
  CardComponent,
  PlayingCardComponent,
  CardDeckComponent,
  CardHandComponent,
  TableZoneComponent,
  // ... other imports
} from "./CardSystem";
```

CardSystem.ts is located in /src/components/

---

## Quick Start

### Creating a Simple Card

```typescript
import { Actor, Sprite, ImageSource } from "excalibur";
import { CardComponent } from "./CardSystem";

// Load card images
const cardFaceImage = new ImageSource("./card-face.png");
const cardBackImage = new ImageSource("./card-back.png");

// Create sprites
const cardFace = cardFaceImage.toSprite();
const cardBack = cardBackImage.toSprite();

// Create a card actor
const card = new Actor({ pos: vec(100, 100) });
card.addComponent(
  new CardComponent({
    cardFace: cardFace,
    cardBack: cardBack,
    isFaceUp: false,
    data: { customData: "example" },
  })
);

game.add(card);
```

### Creating a Deck

```typescript
const deck = new Actor({ pos: vec(400, 300) });
deck.addComponent(
  new CardDeckComponent({
    cardBack: cardBack,
    maxCards: 52,
    isTopCardShowing: false,
    deckSize: 52,
    cardThickness: 1,
    stackDirection: Vector.Down,
  })
);

game.add(deck);

// Add cards to deck
const deckComponent = deck.get(CardDeckComponent);
deckComponent.addCards(arrayOfCards);

// Shuffle
deckComponent.shuffle(3);

// Draw cards
const result = deckComponent.drawCards(5);
if (result.status === "Success") {
  console.log("Drew cards:", result.value);
}
```

### Creating a Hand

```typescript
const hand = new Actor({ pos: vec(400, 500) });
hand.addComponent(
  new CardHandComponent({
    maxCards: 10,
    spread: "fan", // or 'flat'
    fanAngle: 8,
    fanRadius: 400,
    cardWidth: 80,
    cardReorderSpeed: 300,
  })
);

game.add(hand);

// Add cards to hand
const handComponent = hand.get(CardHandComponent);
handComponent.addCards(drawnCards);
```

---

## Core Concepts

### Card Status

Cards have a status that indicates where they are in the game:

```typescript
export const CardStatus = {
  InDeck: "InDeck", // Card is in a deck
  InHand: "InHand", // Card is in a player's hand
  InPlay: "InPlay", // Card is being played
  InZone: "InZone", // Card is in a table zone
  InStack: "InStack", // Card is in a stack
} as const;
```

### Card Result Pattern

All operations that can fail return a `CardResult` type:

```typescript
const result = deckComponent.drawCards(5);

if (result.status === CardResultStatus.Success) {
  // Use result.value
  const cards = result.value;
} else {
  // Handle error
  console.error(result.message);
}
```

---

## Components

### CardComponent

The base component for all cards. Handles face/back graphics, flipping, hover detection, and ownership.

**Configuration:**

```typescript
interface CardOptions {
  cardFace: Sprite; // Front of card graphic
  cardBack: Sprite; // Back of card graphic
  isFaceUp?: boolean; // Initial face state (default: false)
  data?: any; // Custom data attached to card
}
```

**Properties:**

```typescript
card.get(CardComponent).isFaceUp; // boolean
card.get(CardComponent).status; // CardStatusType
card.get(CardComponent).data; // any custom data
card.get(CardComponent).isOwned; // boolean
card.get(CardComponent).isOwnedBy; // number | null (player ID)
card.get(CardComponent).isHovered; // boolean (read-only)
```

**Methods:**

```typescript
cardComponent.flip(duration: number)    // Animate card flip
```

**Events:**

```typescript
cardComponent.cardEmitter.on("cardcreated", evt => {});
cardComponent.cardEmitter.on("cardhovered", evt => {});
cardComponent.cardEmitter.on("cardunhovered", evt => {});
cardComponent.cardEmitter.on("cardOwnerChanged", evt => {});
cardComponent.cardEmitter.on("cardOwnerStatusChanged", evt => {});
```

---

### PlayingCardComponent

Extends `CardComponent` with suit and rank for standard playing cards.

**Configuration:**

```typescript
interface PlayingCardOptions extends CardOptions {
  suit: PlayingCardSuitType; // Hearts, Diamonds, Clubs, Spades
  rank: PlayingCardRankType; // Ace through King, Joker
}
```

**Enums:**

```typescript
const PlayingCardSuit = {
  Hearts: 0,
  Diamonds: 1,
  Clubs: 2,
  Spades: 3,
} as const;

const PlayingCardRank = {
  Ace: 0,
  Two: 1,
  Three: 2,
  Four: 3,
  Five: 4,
  Six: 5,
  Seven: 6,
  Eight: 7,
  Nine: 8,
  Ten: 9,
  Jack: 10,
  Queen: 11,
  King: 12,
  Joker: 13,
} as const;
```

**Example:**

```typescript
const aceOfSpades = new Actor();
aceOfSpades.addComponent(
  new PlayingCardComponent({
    cardFace: aceSpadeSprite,
    cardBack: cardBackSprite,
    suit: PlayingCardSuit.Spades,
    rank: PlayingCardRank.Ace,
  })
);
```

---

### CardDeckComponent

Manages a collection of cards as a deck with drawing, shuffling, and visual stacking.

**Configuration:**

```typescript
interface CardDeckOptions {
  cardBack: Sprite; // Back graphic for deck visualization
  maxCards?: number; // Max capacity (default: Infinity)
  isTopCardShowing?: boolean; // Show top card face (default: false)
  deckSize?: number; // Initial visual size (default: 0)
  cardThickness?: number; // Visual offset per card (default: 1)
  autoSizing?: boolean; // Auto-update visual size (default: false)
  stackDirection?: Vector; // Direction to stack (default: Down)
  maxShuffles?: number; // Max shuffle iterations (default: 1)
}
```

**Properties:**

```typescript
deckComponent.cards; // Actor[] - all cards
deckComponent.topCard; // Actor - top card
deckComponent.count; // number - card count
deckComponent.displayedSize; // get/set visual size
```

**Methods:**

```typescript
// Add cards
deckComponent.addCard(card: Actor): CardResult<Actor>
deckComponent.addCards(cards: Actor[]): CardResult<Actor[]>

// Remove cards
deckComponent.removeCard(card: Actor): CardResult<Actor>

// Draw cards from top
deckComponent.drawCards(numCards?: number): CardResult<Actor[]>

// Shuffle
deckComponent.shuffle(numShuffles?: number): void

// Clear all cards
deckComponent.clearDeck(): void

// Get position for next card
deckComponent.getTopCardPosition(): Vector
```

**Events:**

```typescript
deckComponent.emitter.on("deckCreated", evt => {});
deckComponent.emitter.on("cardAdded", evt => {});
deckComponent.emitter.on("cardRemoved", evt => {});
deckComponent.emitter.on("cardsDrawn", evt => {});
deckComponent.emitter.on("deckShuffled", evt => {});
deckComponent.emitter.on("deckCleared", evt => {});
```

---

### CardHandComponent

Manages a player's hand with automatic layout (flat or fan spread).

**Configuration:**

```typescript
interface CardHandOptions {
  maxCards?: number; // Max hand size (default: Infinity)
  spread: "flat" | "fan"; // Layout style
  maxCardspacing?: number; // Max space between cards (default: -1)
  minCardspacing?: number; // Min space between cards (default: -1)
  fanAngle?: number; // Degrees between cards in fan (default: 8)
  fanRadius?: number; // Arc radius for fan layout (default: 400)
  cardWidth?: number; // Card width for spacing calc (default: 80)
  cardReorderSpeed?: number; // Animation duration in ms (default: 300)
}
```

**Properties:**

```typescript
handComponent.cards; // Actor[] - all cards in hand
handComponent.count; // number - card count
```

**Methods:**

```typescript
// Add cards (automatically becomes child and layouts)
handComponent.addCard(card: Actor): CardResult<Actor>
handComponent.addCards(cards: Actor[]): CardResult<Actor[]>

// Reserve space for incoming card
handComponent.setDestination(card: Actor): CardResult<Actor>

// Remove card
handComponent.removeCard(card: Actor): CardResult<Actor>

// Clear hand
handComponent.clearHand(): void

// Get next card position (for animations)
handComponent.getNextCardPosition(): CardResult<CardLayout>

// Check if hand can accept more cards
handComponent.canTakeCard(): boolean
```

**Events:**

```typescript
handComponent.emitter.on("handCreated", evt => {});
handComponent.emitter.on("cardAdded", evt => {});
handComponent.emitter.on("cardRemoved", evt => {});
handComponent.emitter.on("handCleared", evt => {});
handComponent.emitter.on("handReordered", evt => {});
```

**Layout Types:**

- **Flat**: Cards arranged in a horizontal line, evenly spaced
- **Fan**: Cards arranged in an arc, like a hand of cards

---

### TableZoneComponent

Defines a specific area on the table where cards can be placed (e.g., discard pile, play area).

**Configuration:**

```typescript
constructor(size: Vector, sprite?: Sprite)
```

**Properties:**

```typescript
zoneComponent.cards; // Actor[] - cards in zone
zoneComponent.count; // number - card count
```

**Methods:**

```typescript
// Add card (snaps to zone position)
zoneComponent.addCard(card: Actor): CardResult<Actor>

// Remove card
zoneComponent.removeCard(card: Actor): CardResult<Actor>

// Clear zone
zoneComponent.clear(): void
```

---

### TableStackComponent

Manages a stack of cards with offset positioning and visibility controls.

**Configuration:**

```typescript
interface TableStackOptions {
  offset?: Vector; // Offset per card (default: vec(0,0))
  maxVisible?: number; // Max cards to show (default: 0 = all)
  topCardOnly?: boolean; // Only show top card (default: true)
  maxCardCount?: number; // Max cards in stack (default: 0 = unlimited)
}
```

**Properties:**

```typescript
stackComponent.cards; // Actor[] - all cards
stackComponent.count; // number - card count
stackComponent.topCard; // Actor - top card
stackComponent.offset; // get/set offset vector
stackComponent.dirtyFlag; // get/set - triggers relayout
```

**Methods:**

```typescript
// Add cards (automatically positions)
stackComponent.addCard(card: Actor): CardResult<Actor>
stackComponent.addCards(cards: Actor[]): CardResult<Actor[]>

// Reserve space for incoming card
stackComponent.setDestination(card: Actor): CardResult<Actor>

// Remove cards
stackComponent.removeCard(card: Actor): CardResult<Actor>
stackComponent.removeCards(cards: Actor[]): void

// Get position for next card
stackComponent.getNextCardPosition(): Vector

// Check capacity
stackComponent.canTakeCard(): boolean

// Clear stack
stackComponent.clear(): void
```

---

### TableComponent

Manages multiple named zones on a table.

**Methods:**

```typescript
// Add a zone to the table
tableComponent.addZone(name: string, zone: Actor): CardResult<Actor>

// Get a zone by name
tableComponent.getZone(name: string): CardResult<TableZoneComponent>
```

**Example:**

```typescript
const table = new Actor({ pos: vec(400, 300) });
table.addComponent(new TableComponent());

const discardZone = new Actor({ pos: vec(200, 300) });
discardZone.addComponent(new TableZoneComponent(vec(100, 150)));

const tableComp = table.get(TableComponent);
tableComp.addZone("discard", discardZone);

// Later...
const zone = tableComp.getZone("discard");
if (zone.status === "Success") {
  zone.value.addCard(card);
}
```

---

## Card Actions

Pre-built coroutine actions for animating cards.

### flipCard

```typescript
function* flipCard(
  actor: Actor,
  ctx: {
    duration?: number; // Total flip time (default: 200ms)
    yOffset?: number; // Lift amount during flip (default: 10)
    emitter?: EventEmitter; // Optional event emitter
  }
);
```

**Usage:**

```typescript
const cardComp = card.get(CardComponent);
cardComp.flip(400); // Flip over 400ms
```

### moveAndFlipCard

```typescript
function* moveAndFlipCard(
  actor: Actor,
  ctx: {
    targetX: number;
    targetY: number;
    duration: number;
    flipDuration?: number; // Flip time (default: duration/2)
    emitter?: EventEmitter;
  }
);
```

**Usage:**

```typescript
import { coroutineAction, moveAndFlipCard } from "./CardSystem";

card.actions.runAction(
  coroutineAction(moveAndFlipCard, {
    targetX: 400,
    targetY: 300,
    duration: 500,
  })
);
```

### moveAndRotateCard

```typescript
function* moveAndRotateCard(
  actor: Actor,
  ctx: {
    targetX: number;
    targetY: number;
    duration: number;
    rotationSpeed?: number;
    emitter?: EventEmitter;
  }
);
```

### Using Custom Coroutine Actions

```typescript
import { coroutineAction } from "./card-system";

function* myCustomAnimation(actor: Actor, ctx: any) {
  let elapsed = 0;
  while (elapsed < ctx.duration) {
    const delta: number = yield;
    elapsed += delta;
    // Your animation logic
  }
}

card.actions.runAction(coroutineAction(myCustomAnimation, { duration: 1000 }));
```

---

## Events System

All components emit events through their `emitter` or `cardEmitter` properties.

### Card Events

```typescript
const card = actor.get(CardComponent);

card.cardEmitter.on("cardcreated", (evt: CardCreatedEvent) => {
  console.log("Card created:", evt.card);
});

card.cardEmitter.on("cardhovered", (evt: CardHoveredEvent) => {
  console.log("Card hovered");
});

card.cardEmitter.on("cardunhovered", (evt: CardUnhoveredEvent) => {
  console.log("Card unhovered");
});

card.cardEmitter.on("flipstarted", (evt: CardFlippedEventStarted) => {
  console.log("Flip started, duration:", evt.duration);
});

card.cardEmitter.on("flipcompleted", (evt: CardFlippedEventCompleted) => {
  console.log("Flip completed");
});

card.cardEmitter.on("cardOwnerChanged", (evt: CardOwnerChangedEvent) => {
  console.log("Owner changed from", evt.previousOwnerId, "to", evt.newOwnerId);
});

card.cardEmitter.on("cardOwnerStatusChanged", (evt: CardOwnerStatusChangedEvent) => {
  console.log("Status changed from", evt.previousStatus, "to", evt.newStatus);
});
```

### Deck Events

```typescript
const deck = actor.get(CardDeckComponent);

deck.emitter.on("deckCreated", (evt: DeckCreatedEvent) => {});
deck.emitter.on("cardAdded", (evt: DeckCardAddedEvent) => {});
deck.emitter.on("cardRemoved", (evt: DeckCardRemovedEvent) => {});
deck.emitter.on("cardsDrawn", (evt: DeckCardDrawnEvent) => {
  console.log("Drew", evt.numCards, "cards:", evt.cards);
});
deck.emitter.on("deckShuffled", (evt: DeckShuffleEvent) => {
  console.log("Shuffled", evt.numShuffles, "times");
});
deck.emitter.on("deckCleared", (evt: DeckClearedEvent) => {});
```

### Hand Events

```typescript
const hand = actor.get(CardHandComponent);

hand.emitter.on("handCreated", (evt: HandCreatedEvent) => {});
hand.emitter.on("cardAdded", (evt: HandCardAddedEvent) => {});
hand.emitter.on("cardRemoved", (evt: HandCardRemovedEvent) => {});
hand.emitter.on("handCleared", (evt: HandClearedEvent) => {});
hand.emitter.on("handReordered", (evt: HandReorderedEvent) => {
  console.log("Hand layout updated");
});
```

---

## Type System

### CardLayout

```typescript
type CardLayout = {
  x: number;
  y: number;
  rotation: number;
  z: number;
};
```

### CardResult

```typescript
type CardResult<T> = { status: "Success"; value: T } | { status: "Error"; message: string };
```

### CardStatus

```typescript
type CardStatusType = "InDeck" | "InHand" | "InPlay" | "InZone" | "InStack";
```

---

## Examples

### Complete Poker Game Setup

```typescript
import { Actor, Engine, Loader, vec, Vector } from "excalibur";
import {
  CardComponent,
  PlayingCardComponent,
  CardDeckComponent,
  CardHandComponent,
  PlayingCardSuit,
  PlayingCardRank,
  CardResultStatus,
} from "./CardSystem";

const game = new Engine({ width: 800, height: 600 });

// Load resources
const cardFaces = {}; // Load 52 card faces
const cardBack = cardBackImage.toSprite();

// Create deck
const deck = new Actor({ pos: vec(100, 100) });
const deckComponent = new CardDeckComponent({
  cardBack: cardBack,
  maxCards: 52,
  deckSize: 52,
  cardThickness: 0.5,
});
deck.addComponent(deckComponent);
game.add(deck);

// Create all 52 cards
const cards = [];
for (let suit = 0; suit < 4; suit++) {
  for (let rank = 0; rank < 13; rank++) {
    const card = new Actor();
    card.addComponent(
      new PlayingCardComponent({
        cardFace: cardFaces[`${suit}-${rank}`],
        cardBack: cardBack,
        suit: suit,
        rank: rank,
        isFaceUp: false,
      })
    );
    cards.push(card);
    game.add(card);
  }
}

// Add cards to deck
deckComponent.addCards(cards);
deckComponent.shuffle(3);

// Create player hand
const hand = new Actor({ pos: vec(400, 500) });
hand.addComponent(
  new CardHandComponent({
    maxCards: 5,
    spread: "fan",
    fanAngle: 10,
    fanRadius: 350,
  })
);
game.add(hand);

// Deal cards
const handComponent = hand.get(CardHandComponent);
const drawResult = deckComponent.drawCards(5);
if (drawResult.status === CardResultStatus.Success) {
  handComponent.addCards(drawResult.value);
}

game.start();
```

### Card Movement with Animation

```typescript
import { coroutineAction, moveAndFlipCard } from "./CardSystem";

// Draw a card and animate it to hand
const drawResult = deckComponent.drawCards(1);
if (drawResult.status === CardResultStatus.Success) {
  const card = drawResult.value[0];
  const handComp = hand.get(CardHandComponent);

  // Reserve space in hand
  const destResult = handComp.setDestination(card);
  if (destResult.status === CardResultStatus.Success) {
    const position = handComp.getNextCardPosition();

    // Animate card to hand position
    card.actions
      .runAction(
        coroutineAction(moveAndFlipCard, {
          targetX: hand.pos.x + position.value.x,
          targetY: hand.pos.y + position.value.y,
          duration: 600,
        })
      )
      .callMethod(() => {
        // Add to hand after animation
        handComp.addCard(card);
      });
  }
}
```

### Creating a Discard Pile

```typescript
const discardPile = new Actor({ pos: vec(300, 300) });
discardPile.addComponent(
  new TableStackComponent({
    offset: vec(1, 1), // Slight offset to show stacking
    maxVisible: 3, // Show top 3 cards
    topCardOnly: false,
  })
);
game.add(discardPile);

// Discard a card
const stackComp = discardPile.get(TableStackComponent);
stackComp.addCard(cardToDiscard);
```

### Multiplayer Setup

```typescript
// Track card ownership
const card = actor.get(CardComponent);
card.isOwnedBy = playerId; // Set owner

card.cardEmitter.on("cardOwnerChanged", evt => {
  console.log(`Card ownership: ${evt.previousOwnerId} -> ${evt.newOwnerId}`);
  // Update UI, sync with server, etc.
});

// Check ownership
if (card.isOwned && card.isOwnedBy === currentPlayerId) {
  // Player owns this card
}
```

---

## Best Practices

1. **Always check CardResult status** before using values
2. **Use events** for game logic triggers rather than polling
3. **Set card status** when moving between components for tracking
4. **Use setDestination()** before animating cards to reserve space
5. **Clean up** card parent relationships when moving between components
6. **Leverage the type system** with TypeScript for safety
7. **Use coroutineAction** for smooth, interruptible animations

---

## Troubleshooting

### Cards not appearing

- Ensure sprites are loaded before creating components
- Check that cards are added to the scene with `game.add(card)`
- Verify card z-index if using overlapping elements

### Hand layout not updating

- The `dirtyFlag` is set automatically when cards are added/removed
- Call `handComponent.clearHand()` and re-add if layout is stuck

### Cards not drawing from deck

- Check `deckComponent.count` to verify cards exist
- Ensure `maxCards` limit isn't reached
- Check CardResult status for error messages

### Animation conflicts

- Actions are queued by default in Excalibur
- Use `card.actions.clearActions()` before starting new animations if needed

---

## License

This card system is designed to work with Excalibur.js. Ensure compliance with Excalibur.js licensing terms.

---

## Contributing

When extending this system:

- Follow the CardResult pattern for error handling
- Emit appropriate events for state changes
- Use the Component pattern for modularity
- Document your custom components and actions

---

## Support

For Excalibur.js documentation: https://excaliburjs.com/docs/ For issues specific to this card system, check that:

- You're using compatible Excalibur.js version
- All required sprites/resources are loaded
- Component dependencies are properly configured
