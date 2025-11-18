import { Actor } from "excalibur";
import { PlayingCardComponent, PlayingCardRank, PlayingCardSuit } from "./CardSystem";

// Poker hand rankings (higher is better)
export const PokerHandRank = {
  HighCard: 1,
  OnePair: 2,
  TwoPair: 3,
  ThreeOfAKind: 4,
  Straight: 5,
  Flush: 6,
  FullHouse: 7,
  FourOfAKind: 8,
  StraightFlush: 9,
  RoyalFlush: 10,
} as const;

// eslint-disable-next-line no-redeclare
export type PokerHandRank = (typeof PokerHandRank)[keyof typeof PokerHandRank];

export interface PokerHandResult {
  rank: PokerHandRank;
  rankName: string;
  score: number;
  highCards: number[]; // Tiebreaker cards in descending order
  description: string;
  usedWildCards?: number; // Number of wild cards used
  bestCards?: Actor[]; // The 5 cards used to make this hand
}

export interface ComparisonResult {
  winner: "hand1" | "hand2" | "tie";
  hand1Result: PokerHandResult;
  hand2Result: PokerHandResult;
  scoreDelta: number; // Positive means hand1 wins, negative means hand2 wins
  description: string;
}

export class PokerHandEvaluator {
  private static readonly RANK_VALUES: Record<number, number> = {
    [PlayingCardRank.Ace]: 14,
    [PlayingCardRank.King]: 13,
    [PlayingCardRank.Queen]: 12,
    [PlayingCardRank.Jack]: 11,
    [PlayingCardRank.Ten]: 10,
    [PlayingCardRank.Nine]: 9,
    [PlayingCardRank.Eight]: 8,
    [PlayingCardRank.Seven]: 7,
    [PlayingCardRank.Six]: 6,
    [PlayingCardRank.Five]: 5,
    [PlayingCardRank.Four]: 4,
    [PlayingCardRank.Three]: 3,
    [PlayingCardRank.Two]: 2,
    [PlayingCardRank.Joker]: 0, // Special value for wild card
  };

  private static readonly RANK_NAMES: Record<number, string> = {
    [PlayingCardRank.Ace]: "Ace",
    [PlayingCardRank.King]: "King",
    [PlayingCardRank.Queen]: "Queen",
    [PlayingCardRank.Jack]: "Jack",
    [PlayingCardRank.Ten]: "Ten",
    [PlayingCardRank.Nine]: "Nine",
    [PlayingCardRank.Eight]: "Eight",
    [PlayingCardRank.Seven]: "Seven",
    [PlayingCardRank.Six]: "Six",
    [PlayingCardRank.Five]: "Five",
    [PlayingCardRank.Four]: "Four",
    [PlayingCardRank.Three]: "Three",
    [PlayingCardRank.Two]: "Two",
    [PlayingCardRank.Joker]: "Joker",
  };

  private static readonly HAND_RANK_NAMES: Record<PokerHandRank, string> = {
    [PokerHandRank.HighCard]: "High Card",
    [PokerHandRank.OnePair]: "One Pair",
    [PokerHandRank.TwoPair]: "Two Pair",
    [PokerHandRank.ThreeOfAKind]: "Three of a Kind",
    [PokerHandRank.Straight]: "Straight",
    [PokerHandRank.Flush]: "Flush",
    [PokerHandRank.FullHouse]: "Full House",
    [PokerHandRank.FourOfAKind]: "Four of a Kind",
    [PokerHandRank.StraightFlush]: "Straight Flush",
    [PokerHandRank.RoyalFlush]: "Royal Flush",
  };

  /**
   * Evaluates a poker hand and returns its ranking and score
   * @param cards Array of 5+ Actor cards (will use best 5)
   * @param jokersAreWild If true, Jokers act as wild cards (default: true)
   */
  static evaluateHand(cards: Actor[], jokersAreWild: boolean = true): PokerHandResult {
    if (cards.length < 5) {
      throw new Error("Poker hand must contain at least 5 cards");
    }

    // If more than 5 cards, find the best 5-card combination
    if (cards.length > 5) {
      return this.findBestHand(cards, jokersAreWild);
    }

    // Extract card components
    const cardComponents = cards.map(card => {
      const component = card.get(PlayingCardComponent);
      if (!component) {
        throw new Error("Card does not have PlayingCardComponent");
      }
      return component;
    });

    // Count wild cards (Jokers)
    const wildCards = jokersAreWild ? cardComponents.filter(c => c.rank === PlayingCardRank.Joker) : [];
    const wildCardCount = wildCards.length;

    // If we have wild cards, find the best possible hand
    if (wildCardCount > 0 && jokersAreWild) {
      const result = this.evaluateWithWildCards(cardComponents, wildCardCount);
      result.bestCards = cards;
      return result;
    }

    // Get ranks and suits (no wild cards)
    const ranks = cardComponents.map(c => this.RANK_VALUES[c.rank]);
    const suits = cardComponents.map(c => c.suit);

    const result = this.evaluateStandardHand(ranks, suits);
    result.bestCards = cards;
    return result;
  }

  /**
   * Finds the best 5-card hand from 6+ cards
   */
  private static findBestHand(cards: Actor[], jokersAreWild: boolean): PokerHandResult {
    let bestResult: PokerHandResult | null = null;

    // Generate all 5-card combinations
    const combinations = this.getCombinations(cards, 5);

    for (const combo of combinations) {
      const result = this.evaluateHand(combo, jokersAreWild);
      if (!bestResult || result.score > bestResult.score) {
        bestResult = result;
      }
    }

    return bestResult!;
  }

  /**
   * Generates all k-combinations from an array
   */
  private static getCombinations<T>(arr: T[], k: number): T[][] {
    const result: T[][] = [];

    const helper = (start: number, combo: T[]) => {
      if (combo.length === k) {
        result.push([...combo]);
        return;
      }

      for (let i = start; i < arr.length; i++) {
        combo.push(arr[i]);
        helper(i + 1, combo);
        combo.pop();
      }
    };

    helper(0, []);
    return result;
  }

  /**
   * Compares two poker hands and determines the winner
   * @param jokersAreWild If true, Jokers act as wild cards (default: true)
   */
  static compareHands(hand1: Actor[], hand2: Actor[], jokersAreWild: boolean = true): ComparisonResult {
    const result1 = this.evaluateHand(hand1, jokersAreWild);
    const result2 = this.evaluateHand(hand2, jokersAreWild);

    let winner: "hand1" | "hand2" | "tie";
    let description: string;

    // Compare by hand rank first
    if (result1.rank > result2.rank) {
      winner = "hand1";
      description = `Hand 1 wins with ${result1.description} vs ${result2.description}`;
    } else if (result2.rank > result1.rank) {
      winner = "hand2";
      description = `Hand 2 wins with ${result2.description} vs ${result1.description}`;
    } else {
      // Same hand rank, compare high cards
      const comparison = this.compareHighCards(result1.highCards, result2.highCards);
      if (comparison > 0) {
        winner = "hand1";
        description = `Hand 1 wins with better ${this.HAND_RANK_NAMES[result1.rank]}`;
      } else if (comparison < 0) {
        winner = "hand2";
        description = `Hand 2 wins with better ${this.HAND_RANK_NAMES[result2.rank]}`;
      } else {
        winner = "tie";
        description = `Tie with ${result1.description}`;
      }
    }

    const scoreDelta = result1.score - result2.score;

    return {
      winner,
      hand1Result: result1,
      hand2Result: result2,
      scoreDelta,
      description,
    };
  }

  /**
   * Creates a hand result with calculated score based ONLY on hand rank and relevant cards
   */
  private static createResult(
    rank: PokerHandRank,
    highCards: number[],
    description: string,
    usedWildCards: number = 0
  ): PokerHandResult {
    // Score is based purely on hand rank and the relevant high cards for that hand type
    // Base score ensures higher ranks always beat lower ones
    let score = rank * 100000000;

    // Add ONLY the high cards that matter for this hand type
    // Each position gets less weight (base 15 since Ace = 14)
    highCards.forEach((card, index) => {
      score += card * Math.pow(15, highCards.length - index - 1);
    });

    // Natural hands beat wild card hands with identical cards (tiny penalty)
    if (usedWildCards > 0) {
      score -= usedWildCards * 0.001;
    }

    return {
      rank,
      rankName: this.HAND_RANK_NAMES[rank],
      score,
      highCards,
      description,
      usedWildCards,
    };
  }

  /**
   * Evaluates a hand with wild cards by finding the best possible combination
   */
  private static evaluateWithWildCards(cardComponents: PlayingCardComponent[], wildCardCount: number): PokerHandResult {
    // Get non-wild cards
    const nonWildCards = cardComponents.filter(c => c.rank !== PlayingCardRank.Joker);
    const nonWildRanks = nonWildCards.map(c => this.RANK_VALUES[c.rank]);
    const nonWildSuits = nonWildCards.map(c => c.suit);

    let bestResult: PokerHandResult | null = null;

    // With 4+ wilds, we can make Five of a Kind (treating as Royal Flush)
    if (wildCardCount >= 4) {
      return this.createResult(PokerHandRank.RoyalFlush, [14], "Five of a Kind (Wild)", wildCardCount);
    }

    // With wilds, try to make the best possible hand
    const possibleRanks = [14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2];
    const possibleSuits = [PlayingCardSuit.Hearts, PlayingCardSuit.Diamonds, PlayingCardSuit.Clubs, PlayingCardSuit.Spades];

    // Generate possible hands based on wild count
    if (wildCardCount === 1) {
      for (const rank of possibleRanks) {
        for (const suit of possibleSuits) {
          const testRanks = [...nonWildRanks, rank].sort((a, b) => b - a);
          const testSuits = [...nonWildSuits, suit];
          const result = this.evaluateStandardHand(testRanks, testSuits, wildCardCount);
          if (!bestResult || result.score > bestResult.score) {
            bestResult = result;
          }
        }
      }
    } else if (wildCardCount === 2) {
      for (const rank1 of possibleRanks) {
        for (const rank2 of possibleRanks) {
          for (const suit1 of possibleSuits) {
            for (const suit2 of possibleSuits) {
              const testRanks = [...nonWildRanks, rank1, rank2].sort((a, b) => b - a);
              const testSuits = [...nonWildSuits, suit1, suit2];
              const result = this.evaluateStandardHand(testRanks, testSuits, wildCardCount);
              if (!bestResult || result.score > bestResult.score) {
                bestResult = result;
              }
            }
          }
        }
      }
    } else if (wildCardCount === 3) {
      for (const rank1 of possibleRanks) {
        for (const rank2 of possibleRanks) {
          for (const rank3 of possibleRanks) {
            const testRanks = [...nonWildRanks, rank1, rank2, rank3].sort((a, b) => b - a);
            // Try all flush
            const testSuits = [...nonWildSuits, possibleSuits[0], possibleSuits[0], possibleSuits[0]];
            const result = this.evaluateStandardHand(testRanks, testSuits, wildCardCount);
            if (!bestResult || result.score > bestResult.score) {
              bestResult = result;
            }
          }
        }
      }
    }

    return bestResult || this.createResult(PokerHandRank.HighCard, [14], "High Card (Wild)", wildCardCount);
  }

  /**
   * Evaluates a standard hand (no wild cards or already substituted)
   */
  private static evaluateStandardHand(ranks: number[], suits: number[], usedWildCards: number = 0): PokerHandResult {
    const sortedRanks = [...ranks].sort((a, b) => b - a);

    const isFlush = suits.every(suit => suit === suits[0]);
    const isStraight = this.checkStraight(sortedRanks);
    const straightHighCard = isStraight ? sortedRanks[0] : 0;

    const isAceLowStraight =
      sortedRanks[0] === 14 && sortedRanks[1] === 5 && sortedRanks[2] === 4 && sortedRanks[3] === 3 && sortedRanks[4] === 2;

    const rankCounts = this.countRanks(sortedRanks);

    // Royal Flush
    if (isFlush && isStraight && sortedRanks[0] === 14 && sortedRanks[1] === 13) {
      const desc = usedWildCards > 0 ? "Royal Flush (Wild)" : "Royal Flush";
      return this.createResult(PokerHandRank.RoyalFlush, [14], desc, usedWildCards);
    }

    // Straight Flush
    if (isFlush && isStraight) {
      const highCard = isAceLowStraight ? 5 : straightHighCard;
      const desc =
        usedWildCards > 0
          ? `Straight Flush, ${this.RANK_NAMES[this.getKeyByValue(this.RANK_VALUES, highCard)!]} high (Wild)`
          : `Straight Flush, ${this.RANK_NAMES[this.getKeyByValue(this.RANK_VALUES, highCard)!]} high`;
      return this.createResult(PokerHandRank.StraightFlush, [highCard], desc, usedWildCards);
    }

    // Four of a Kind
    if (rankCounts.fourOfAKind) {
      const desc =
        usedWildCards > 0
          ? `Four ${this.RANK_NAMES[this.getKeyByValue(this.RANK_VALUES, rankCounts.fourOfAKind)!]}s (Wild)`
          : `Four ${this.RANK_NAMES[this.getKeyByValue(this.RANK_VALUES, rankCounts.fourOfAKind)!]}s`;
      // Score: quad rank + kicker
      return this.createResult(PokerHandRank.FourOfAKind, [rankCounts.fourOfAKind, rankCounts.kickers[0]], desc, usedWildCards);
    }

    // Full House
    if (rankCounts.threeOfAKind && rankCounts.pairs.length > 0) {
      const desc =
        usedWildCards > 0
          ? `Full House, ${this.RANK_NAMES[this.getKeyByValue(this.RANK_VALUES, rankCounts.threeOfAKind)!]}s over ${
              this.RANK_NAMES[this.getKeyByValue(this.RANK_VALUES, rankCounts.pairs[0])!]
            }s (Wild)`
          : `Full House, ${this.RANK_NAMES[this.getKeyByValue(this.RANK_VALUES, rankCounts.threeOfAKind)!]}s over ${
              this.RANK_NAMES[this.getKeyByValue(this.RANK_VALUES, rankCounts.pairs[0])!]
            }s`;
      // Score: trips rank + pair rank
      return this.createResult(PokerHandRank.FullHouse, [rankCounts.threeOfAKind, rankCounts.pairs[0]], desc, usedWildCards);
    }

    // Flush
    if (isFlush) {
      const desc =
        usedWildCards > 0
          ? `Flush, ${this.RANK_NAMES[this.getKeyByValue(this.RANK_VALUES, sortedRanks[0])!]} high (Wild)`
          : `Flush, ${this.RANK_NAMES[this.getKeyByValue(this.RANK_VALUES, sortedRanks[0])!]} high`;
      // Score: all 5 cards matter
      return this.createResult(PokerHandRank.Flush, sortedRanks, desc, usedWildCards);
    }

    // Straight
    if (isStraight) {
      const highCard = isAceLowStraight ? 5 : straightHighCard;
      const desc =
        usedWildCards > 0
          ? `Straight, ${this.RANK_NAMES[this.getKeyByValue(this.RANK_VALUES, highCard)!]} high (Wild)`
          : `Straight, ${this.RANK_NAMES[this.getKeyByValue(this.RANK_VALUES, highCard)!]} high`;
      // Score: just high card
      return this.createResult(PokerHandRank.Straight, [highCard], desc, usedWildCards);
    }

    // Three of a Kind
    if (rankCounts.threeOfAKind) {
      const desc =
        usedWildCards > 0
          ? `Three ${this.RANK_NAMES[this.getKeyByValue(this.RANK_VALUES, rankCounts.threeOfAKind)!]}s (Wild)`
          : `Three ${this.RANK_NAMES[this.getKeyByValue(this.RANK_VALUES, rankCounts.threeOfAKind)!]}s`;
      // Score: trips rank + top 2 kickers
      return this.createResult(
        PokerHandRank.ThreeOfAKind,
        [rankCounts.threeOfAKind, ...rankCounts.kickers.slice(0, 2)],
        desc,
        usedWildCards
      );
    }

    // Two Pair
    if (rankCounts.pairs.length === 2) {
      const desc =
        usedWildCards > 0
          ? `Two Pair, ${this.RANK_NAMES[this.getKeyByValue(this.RANK_VALUES, rankCounts.pairs[0])!]}s and ${
              this.RANK_NAMES[this.getKeyByValue(this.RANK_VALUES, rankCounts.pairs[1])!]
            }s (Wild)`
          : `Two Pair, ${this.RANK_NAMES[this.getKeyByValue(this.RANK_VALUES, rankCounts.pairs[0])!]}s and ${
              this.RANK_NAMES[this.getKeyByValue(this.RANK_VALUES, rankCounts.pairs[1])!]
            }s`;
      // Score: high pair + low pair + kicker
      return this.createResult(
        PokerHandRank.TwoPair,
        [rankCounts.pairs[0], rankCounts.pairs[1], rankCounts.kickers[0]],
        desc,
        usedWildCards
      );
    }

    // One Pair
    if (rankCounts.pairs.length === 1) {
      const desc =
        usedWildCards > 0
          ? `Pair of ${this.RANK_NAMES[this.getKeyByValue(this.RANK_VALUES, rankCounts.pairs[0])!]}s (Wild)`
          : `Pair of ${this.RANK_NAMES[this.getKeyByValue(this.RANK_VALUES, rankCounts.pairs[0])!]}s`;
      // Score: pair rank + top 3 kickers
      return this.createResult(PokerHandRank.OnePair, [rankCounts.pairs[0], ...rankCounts.kickers.slice(0, 3)], desc, usedWildCards);
    }

    // High Card
    const desc =
      usedWildCards > 0
        ? `${this.RANK_NAMES[this.getKeyByValue(this.RANK_VALUES, sortedRanks[0])!]} high (Wild)`
        : `${this.RANK_NAMES[this.getKeyByValue(this.RANK_VALUES, sortedRanks[0])!]} high`;
    // Score: only the highest card matters
    return this.createResult(PokerHandRank.HighCard, [sortedRanks[0]], desc, usedWildCards);
  }

  /**
   * Checks if ranks form a straight
   */
  private static checkStraight(sortedRanks: number[]): boolean {
    for (let i = 0; i < sortedRanks.length - 1; i++) {
      if (sortedRanks[i] - sortedRanks[i + 1] !== 1) {
        if (sortedRanks[0] === 14 && sortedRanks[1] === 5 && sortedRanks[2] === 4 && sortedRanks[3] === 3 && sortedRanks[4] === 2) {
          return true;
        }
        return false;
      }
    }
    return true;
  }

  /**
   * Counts rank frequencies and organizes them
   */
  private static countRanks(sortedRanks: number[]): {
    fourOfAKind: number | null;
    threeOfAKind: number | null;
    pairs: number[];
    kickers: number[];
  } {
    const counts = new Map<number, number>();
    sortedRanks.forEach(rank => {
      counts.set(rank, (counts.get(rank) || 0) + 1);
    });

    let fourOfAKind: number | null = null;
    let threeOfAKind: number | null = null;
    const pairs: number[] = [];
    const kickers: number[] = [];

    const sortedEntries = Array.from(counts.entries()).sort((a, b) => {
      if (a[1] !== b[1]) return b[1] - a[1];
      return b[0] - a[0];
    });

    sortedEntries.forEach(([rank, count]) => {
      if (count === 4) {
        fourOfAKind = rank;
      } else if (count === 3) {
        threeOfAKind = rank;
      } else if (count === 2) {
        pairs.push(rank);
      } else {
        kickers.push(rank);
      }
    });

    pairs.sort((a, b) => b - a);
    kickers.sort((a, b) => b - a);

    return { fourOfAKind, threeOfAKind, pairs, kickers };
  }

  /**
   * Compares high cards for tiebreaking
   */
  private static compareHighCards(cards1: number[], cards2: number[]): number {
    for (let i = 0; i < Math.min(cards1.length, cards2.length); i++) {
      if (cards1[i] > cards2[i]) return 1;
      if (cards1[i] < cards2[i]) return -1;
    }
    return 0;
  }

  /**
   * Helper to get key by value from object
   */
  private static getKeyByValue(object: Record<number, number>, value: number): number | undefined {
    return Number(Object.keys(object).find(key => object[Number(key)] === value));
  }
}
