# PokerHandEvaluator

A flexible, Excalibur-powered poker hand evaluation module supporting:

- ✔ Standard 5-card poker
- ✔ Hands larger than 5 cards (best 5-card hand auto-selected)
- ✔ Full hand comparison
- ✔ Jokers as optional wildcards
- ✔ Detailed ranking, score breakdowns, and high-card tiebreaking
- ✔ Works directly with Excalibur Actors that use your PlayingCardComponent

This module is designed for card games, casino systems, RPG minigames, roguelike card mechanics, and any gameplay systems involving
poker hands.

## ✨ Features

Evaluate any hand of 5+ cards Automatically finds the best 5-card combination from 6+ cards.

Jokers as Wild Cards (optional) Full wild-card simulation, including substitution across all possible ranks/suits.

All Standard Poker Hands From High Card → Royal Flush, with consistent scoring.

Five-of-a-Kind Support Automatically handled when 4+ jokers are present.

Excalibur Integration Works with Actor objects that contain a PlayingCardComponent.

Robust Tiebreaking Includes score values and high-card arrays for deterministic comparison.

## 📦 Installation

Just add the file to your project and import:

```ts
import { PokerHandEvaluator, PokerHandRank } from "./PokerHandEvaluator";
```

You must have also your CardSystem setup:

```ts
import { PlayingCardComponent } from "./CardSystem";
```

## 🃏 Usage

1. Evaluating a Hand

```ts
const hand = [cardA, cardB, cardC, cardD, cardE]; // Actors w/ PlayingCardComponent

const result = PokerHandEvaluator.evaluateHand(hand);

console.log(result.rankName); // "Flush"
console.log(result.highCards); // [12, 10, 9, 7, 4]
console.log(result.score); // Numeric score for comparisons
console.log(result.description); // "Flush, Queen high"
```

Result Structure

```ts
interface PokerHandResult { rank: PokerHandRank; // e.g. PokerHandRank.Flush
rankName: string; // "Flush"
score: number; // Composite numerical score
highCards: number[]; // Used for tiebreaking
description: string; // Human-readable breakdown
usedWildCards?: number; // Jokers used
bestCards?: Actor[]; // The 5 cards forming the hand }
```

## 🎴 Handling 6+ Card Hands

If you pass more than 5 cards, the evaluator automatically tests every 5-card combination:

```ts
const bestResult = PokerHandEvaluator.evaluateHand(sevenCardHand);
```

You get back the best possible 5-card hand.

## 🃟 Jokers as Wild Cards

Jokers are treated as wild by default:

```ts
PokerHandEvaluator.evaluateHand(hand, true);
```

Disable wild behavior:

```ts
PokerHandEvaluator.evaluateHand(hand, false);
```

Wild-card evaluation is exhaustive and will always return the optimal hand.

## ⚔ Comparing Two Hands

```ts
const comparison = PokerHandEvaluator.compareHands(hand1, hand2);

console.log(comparison.winner); // "hand1", "hand2", or "tie"
console.log(comparison.description); // "Hand 1 wins with..."
console.log(comparison.scoreDelta); // Difference in scores
```

ComparisonResult Structure

```ts
interface ComparisonResult {
  winner: "hand1" | "hand2" | "tie";
  hand1Result: PokerHandResult;
  hand2Result: PokerHandResult;
  scoreDelta: number;
  description: string;
}
```

## 🏆 Supported Poker Hand Rankings

    HighCard:        1
    OnePair:         2
    TwoPair:         3
    ThreeOfAKind:    4
    Straight:        5
    Flush:           6
    FullHouse:       7
    FourOfAKind:     8
    StraightFlush:   9
    RoyalFlush:     10

All ranking values scale the internal score, guaranteeing that e.g. any Flush beats any Straight.

## 🧠 Scoring System

Scores are composed of:

1. Hand Rank Multiplier

   Ensures Royal Flush > Straight Flush > Four of a Kind…

2. Relevant High Cards Only

   (E.g. pair + top 3 kickers)

3. Natural Hands Beat Wild Hands

   Tiny penalty applied when wild cards are used.

This ensures stable, consistent, and deterministic outcomes.

## 🔗 Requirements

You must use PlayingCardComponent and PlayingCardRank, PlayingCardSuit from your CardSystem, and attach that component to each card's
Actor.

Example:

```ts
const card = new Actor();
card.addComponent(new PlayingCardComponent(PlayingCardSuit.Spades, PlayingCardRank.Ace));
```

## 📜 License

You may license or redistribute this file as needed for your project.
