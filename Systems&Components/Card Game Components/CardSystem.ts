import {
  Actor,
  Component,
  Entity,
  Sprite,
  ScreenElement,
  Vector,
  lerp,
  PreUpdateEvent,
  Graphic,
  ExcaliburGraphicsContext,
  vec,
  Random,
  clamp,
  PointerAbstraction,
  lerpVector,
  Action,
  CoroutineInstance,
  Engine,
  coroutine,
  nextActionId,
  EventEmitter,
  GameEvent,
} from "excalibur";

/*
 * Type Definitions
 */
//#region typdefs

export type CardLayout = { x: number; y: number; rotation: number; z: number };

export const CardResultStatus = {
  Success: "Success",
  Error: "Error",
} as const;
export type CardResultStatusType = (typeof CardResultStatus)[keyof typeof CardResultStatus];

export type CardResult<T = unknown> =
  | {
      status: typeof CardResultStatus.Success;
      value: T;
    }
  | {
      status: typeof CardResultStatus.Error;
      message: string;
    };

export const CardStatus = {
  InDeck: "InDeck", // resides in Deck
  InHand: "InHand", // resides in Hand
  InPlay: "InPlay", // resides nowhere
  InZone: "InZone", // resides in Zone
  InStack: "InStack", // resides in Stack
} as const;
export type CardStatusType = (typeof CardStatus)[keyof typeof CardStatus];

export interface CardOptions {
  cardFace: Sprite;
  cardBack: Sprite;
  isFaceUp?: boolean;
  data?: any;
}

export interface CardDeckOptions {
  cardBack: Sprite;
  maxCards?: number;
  isTopCardShowing?: boolean;
  deckSize?: number;
  cardThickness?: number;
  autoSizing?: boolean;
  stackDirection?: Vector;
  maxShuffles?: number;
}

export interface CardHandOptions {
  maxCards?: number;
  spread: "flat" | "fan";
  maxCardspacing?: number;
  minCardspacing?: number;
  fanAngle?: number;
  fanRadius?: number;
  cardWidth?: number;
  cardReorderSpeed?: number;
}

export interface TableStackOptions {
  offset?: Vector;
  maxVisible?: number;
  topCardOnly?: boolean;
  maxCardCount?: number;
}

export interface PlayingCardOptions extends CardOptions {
  suit: PlayingCardSuitType;
  rank: PlayingCardRankType;
}

export const PlayingCardSuit = {
  Hearts: 0,
  Diamonds: 1,
  Clubs: 2,
  Spades: 3,
} as const;
export type PlayingCardSuitType = (typeof PlayingCardSuit)[keyof typeof PlayingCardSuit];

export const PlayingCardRank = {
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
export type PlayingCardRankType = (typeof PlayingCardRank)[keyof typeof PlayingCardRank];

// #endregion typdefs

/*
 * Card Components
 */
//#region Card Component
export class CardComponent<TData = unknown> extends Component {
  protected _isFaceUp = false;
  protected _status: CardStatusType = CardStatus.InDeck;
  protected _cardFace: Sprite;
  protected _cardBack: Sprite;
  protected _data: TData | null = null;
  protected _isHovered = false;
  protected _isOwned = false;
  protected _isOwnedBy: number | null = null;
  protected pointerReference: PointerAbstraction | null = null;
  public cardEmitter = new EventEmitter<CardEvents>();

  constructor(config: CardOptions) {
    super();
    this._cardFace = config.cardFace;
    this._cardBack = config.cardBack;
    this._isFaceUp = config.isFaceUp ? config.isFaceUp : false;
    this._data = config.data;
  }

  get data() {
    return this._data;
  }

  set data(value: any) {
    this._data = value;
  }

  onAdd(owner: Entity): void {
    let card = qualifyEntity(owner);
    if (!card) return;

    card.graphics.add("cardFace", this._cardFace.clone());
    card.graphics.add("cardBack", this._cardBack.clone());

    if (this._isFaceUp) card.graphics.use("cardFace");
    else card.graphics.use("cardBack");
    owner.on("preupdate", this._update.bind(this));

    this.cardEmitter.emit("cardcreated", new CardCreatedEvent(card));
  }

  onRemove(previousOwner: Entity): void {
    let card = qualifyEntity(previousOwner);
    if (!card) return;
    card.off("preupdate", this._update.bind(this));
  }

  private _update(): void {
    if (!this.owner?.scene?.engine) return;
    if (!this.pointerReference) this.pointerReference = this.owner.scene.engine.input.pointers.primary;

    let bounds = (this.owner as Actor).graphics.bounds;
    let currentHovered = this._isHovered;
    this._isHovered = bounds.contains(this.pointerReference.lastWorldPos);

    if (currentHovered !== this._isHovered) {
      //hover changed
      if (this._isHovered) {
        this.cardEmitter.emit("cardhovered", new CardHoveredEvent(this.owner as Actor));
      } else {
        this.cardEmitter.emit("cardunhovered", new CardUnhoveredEvent(this.owner as Actor));
      }
    }
  }

  get isFaceUp() {
    return this._isFaceUp;
  }
  set isFaceUp(value: boolean) {
    this._isFaceUp = value;
  }

  get status() {
    return this._status;
  }
  set status(value: CardStatusType) {
    let previousStatus = this._status;
    this._status = value;

    if (previousStatus !== value)
      this.cardEmitter.emit(
        "cardOwnerStatusChanged",
        new CardOwnerStatusChangedEvent(this.owner as Actor, previousStatus, this._status)
      );
  }

  public flip(duration: number) {
    let card = qualifyEntity(this.owner as Entity);
    if (!card) return;
    card = this.owner as ScreenElement | Actor;
    card.actions.runAction(coroutineAction(flipCard, { duration, yoffset: 8, emitter: this.cardEmitter }));
  }

  set isOwned(value: boolean) {
    this._isOwned = value;
  }

  get isOwned() {
    return this._isOwned;
  }

  get isHovered() {
    return this._isHovered;
  }

  set isOwnedBy(value: number | null) {
    let previousOwner = this._isOwnedBy;
    if (value && value < 0) value = null;
    if (value == null) this._isOwned = false;
    else this._isOwned = true;

    this._isOwnedBy = value;
    if (previousOwner !== value)
      this.cardEmitter.emit("cardOwnerChanged", new CardOwnerChangedEvent(this.owner as Actor, previousOwner, value));
  }

  get isOwnedBy() {
    return this._isOwnedBy;
  }
}

export class PlayingCardComponent extends CardComponent {
  private _suit: PlayingCardSuitType = PlayingCardSuit.Spades;
  private _rank: PlayingCardRankType = PlayingCardRank.Ace;

  constructor(config: PlayingCardOptions) {
    super(config);
    this._suit = config.suit;
    this._rank = config.rank;
  }
  get suit() {
    return this._suit;
  }

  get rank() {
    return this._rank;
  }
}

export class CardDeckComponent extends Component {
  private _cards: Actor[] = [];
  private _maxCards: number = Infinity;
  private _isTopCardShowing: boolean = false;
  private _deckSize: number = 0;
  private _newDeckSize: number = 0;
  private _cardBack: Sprite;
  private _cardThickness: number = 0;
  private _autoSizing: boolean = false;
  private _stackDirection: Vector = Vector.Down;
  private _maxShuffles: number = 1;
  public emitter: EventEmitter = new EventEmitter<DeckEvents>();

  constructor(config: CardDeckOptions) {
    super();
    this._cardBack = config.cardBack;
    this._maxCards = config.maxCards ? config.maxCards : Infinity;
    this._isTopCardShowing = config.isTopCardShowing ? config.isTopCardShowing : false;
    this._newDeckSize = config.deckSize ? config.deckSize : 0;
    this._cardThickness = config.cardThickness ? config.cardThickness : 1;
    this._autoSizing = config.autoSizing ? config.autoSizing : false;
    this._stackDirection = config.stackDirection ? config.stackDirection.normalize() : Vector.Down;
    this._maxShuffles = config.maxShuffles ? config.maxShuffles : 1;
  }

  onAdd(owner: Entity): void {
    let card = qualifyEntity(owner);

    if (!card) return;
    card.graphics.use(
      new DeckGraphics({
        cardBack: this._cardBack,
        isTopCardShowing: this._isTopCardShowing,
        cardThickness: this._cardThickness,
        size: this._newDeckSize,
        topCard: this._cards[this._cards.length - 1],
        cardSize: vec(this._cardBack.width, this._cardBack.height),
        stackDirection: this._stackDirection,
      })
    );
    card.on("preupdate", this._update.bind(this));
    this.emitter.emit("deckCreated", new DeckCreatedEvent(owner as Actor));
  }

  onRemove(previousOwner: Entity): void {
    let card = qualifyEntity(previousOwner);
    if (!card) return;
    card.off("preupdate", this._update.bind(this));
  }

  public getTopCardPosition(): Vector {
    let x = 0;
    let y = 0;

    x = this._cards.length * (this._cardThickness * this._stackDirection.x);
    y = this._cards.length * (this._cardThickness * this._stackDirection.y);

    return new Vector(x, y);
  }

  get cards() {
    return this._cards;
  }

  get topCard() {
    return this._cards[this._cards.length - 1];
  }

  public setDestination(card: Actor): CardResult<Actor | ScreenElement> {
    if (this._cards.length >= this._maxCards) {
      return { status: CardResultStatus.Error, message: "Hand is full." };
    }
    this._cards.push(card);
    return { status: CardResultStatus.Success, value: card };
  }

  public addCard(card: Actor): CardResult<Actor | ScreenElement> {
    if (!this.owner) return { status: CardResultStatus.Error, message: "Deck has no owner." };
    let validatedCard = validateCard(card);
    if (!validatedCard) return { status: CardResultStatus.Error, message: "Card is not a valid CardComponent." };
    if (this._cards.length >= this._maxCards) return { status: CardResultStatus.Error, message: "Deck is full." };
    //if card isn't in cards, add it
    if (this._cards.indexOf(validatedCard as Actor) === -1) this._cards.push(validatedCard as Actor);

    (validatedCard as Actor).get(CardComponent).isOwnedBy = this.owner.id;
    (validatedCard as Actor).get(CardComponent).isOwned = true;
    (validatedCard as Actor).get(CardComponent).status = CardStatus.InDeck;
    this.emitter.emit("cardAdded", new DeckCardAddedEvent(this.owner as Actor));
    return { status: CardResultStatus.Success, value: validatedCard };
  }

  public addCards(cards: Actor[]): CardResult<Actor[]> {
    //length check
    if (this._cards.length + cards.length > this._maxCards) return { status: CardResultStatus.Error, message: "Deck is full." };
    for (let card of cards) {
      let result = this.addCard(card);
      if (result.status === CardResultStatus.Error) return result;
    }
    return { status: CardResultStatus.Success, value: cards };
  }

  public removeCard(card: Actor): CardResult<Actor | ScreenElement> {
    let validatedCard = validateCard(card);
    if (!validatedCard) return { status: CardResultStatus.Error, message: "Card is not a valid CardComponent." };

    const index = this._cards.indexOf(validatedCard as Actor);
    if (index === -1) return { status: CardResultStatus.Error, message: "Card is not in the deck." };

    // if card is child of deck, remove parentage
    if (card.parent === this.owner) {
      this.owner.removeChild(card);
    }
    this._cards.splice(index, 1);
    (card as Actor).get(CardComponent).isOwned = false;
    (card as Actor).get(CardComponent).isOwnedBy = null;
    (validatedCard as Actor).get(CardComponent).status = CardStatus.InPlay;
    this.emitter.emit("cardRemoved", new DeckCardRemovedEvent(this.owner as Actor));
    return { status: CardResultStatus.Success, value: card };
  }

  public drawCards(numCards?: number): CardResult<Actor[]> {
    if (!numCards) numCards = 1;
    // not enough cards
    if (this._cards.length < numCards) return { status: CardResultStatus.Error, message: "Not enough cards in the deck." };
    numCards = clamp(numCards, 0, this._maxCards);

    let drawn: Actor[] = [];
    for (let i = 0; i < numCards; i++) {
      let drawnCard = this._cards.pop();
      if (!drawnCard) return { status: CardResultStatus.Error, message: "Deck is empty." };
      let validatedCard = validateCard(drawnCard);
      if (!validatedCard) return { status: CardResultStatus.Error, message: "Card is not a valid CardComponent." };
      drawn.push(drawnCard);
      (drawnCard as Actor).get(CardComponent).isOwned = false;
      (drawnCard as Actor).get(CardComponent).isOwnedBy = null;
      (drawnCard as Actor).get(CardComponent).status = CardStatus.InPlay;
    }
    this.emitter.emit("cardsDrawn", new DeckCardDrawnEvent(this.owner as Actor, drawn, numCards));
    return { status: CardResultStatus.Success, value: drawn };
  }

  public clearDeck() {
    this._cards = [];
    this._newDeckSize = 0;
    this.emitter.emit("deckCleared", new DeckClearedEvent(this.owner as Actor));
  }

  set displayedSize(numCards: number) {
    numCards = clamp(numCards, 0, this._maxCards);
    this._newDeckSize = numCards;
  }

  get displayedSize() {
    return this._deckSize;
  }

  public shuffle(numShuffles?: number) {
    if (!numShuffles) numShuffles = 1;
    if (numShuffles && numShuffles > this._maxShuffles) numShuffles = this._maxShuffles;
    let rng = new Random();
    for (let i = 0; i < numShuffles; i++) this._cards = rng.shuffle(this._cards);
    this.emitter.emit("deckShuffled", new DeckShuffleEvent(this.owner as Actor, numShuffles));
  }

  get count() {
    return this._cards.length;
  }

  private _update(evt: PreUpdateEvent) {
    if (!evt) return;
    let deck = qualifyEntity(this.owner as Entity);
    if (!deck) return;

    if (this._newDeckSize !== this._deckSize) {
      if (this._autoSizing) this._deckSize = this._cards.length;
      else this._deckSize = this._newDeckSize;
      this._deckSize = clamp(this._deckSize, 0, this._maxCards);
      (deck.graphics.current as DeckGraphics).updateDeckSize(this._deckSize);
    }
  }
}

export class CardHandComponent extends Component {
  private _cards: Actor[] = [];
  private _dirtyFlag: boolean = false;
  private _maxCards: number = Infinity;
  private _spread: "flat" | "fan" = "flat";
  private _maxCardspacing: number = -1;
  private _minCardspacing: number = -1;
  private _cardWidth: number = 80;
  private _cardReorderSpeed: number = 300;
  public emitter = new EventEmitter<HandEvents>();

  // Fan layout specific properties
  private _fanAngle: number = 8; // Angle between each card in degrees
  private _fanRadius: number = 400; // Radius of the arc

  constructor(config: CardHandOptions) {
    super();
    this._maxCards = config.maxCards ? config.maxCards : Infinity;
    this._spread = config.spread ? config.spread : "flat";
    this._maxCardspacing = config.maxCardspacing ? config.maxCardspacing : -1;
    this._minCardspacing = config.minCardspacing ? config.minCardspacing : -1;
    if (config.fanAngle) this._fanAngle = config.fanAngle;
    if (config.fanRadius) this._fanRadius = config.fanRadius;
    if (config.cardWidth) this._cardWidth = config.cardWidth;
    if (config.cardReorderSpeed) this._cardReorderSpeed = config.cardReorderSpeed;
  }

  get cards() {
    return this._cards;
  }

  onAdd(owner: Entity): void {
    let hand = qualifyEntity(owner);
    if (!hand) return;
    hand.on("preupdate", this._update.bind(this));
    this.emitter.emit("handCreated", new HandCreatedEvent(owner as Actor));
  }

  onRemove(previousOwner: Entity): void {
    let hand = qualifyEntity(previousOwner);
    if (!hand) return;
    hand.off("preupdate", this._update.bind(this));
  }

  public clearHand() {
    this._cards = [];
    this._dirtyFlag = true;
    this.emitter.emit("handCleared", new HandClearedEvent(this.owner as Actor));
  }

  public addCard(card: Actor): CardResult<Actor> {
    //validate card
    if (!this.owner) return { status: CardResultStatus.Error, message: "Hand is not attached to an entity." };
    let validatedCard = validateCard(card);
    if (!validatedCard) return { status: CardResultStatus.Error, message: "Card is not a valid CardComponent." };

    // Make card a child of the hand entity
    if (this.owner && card.parent !== this.owner) {
      this.owner.addChild(card);
      this._dirtyFlag = true;
    }

    if (this._cards.indexOf(validatedCard as Actor) === -1) this._cards.push(validatedCard as Actor);
    (validatedCard as Actor).get(CardComponent).isOwnedBy = this.owner.id;
    (validatedCard as Actor).get(CardComponent).isOwned = true;
    (validatedCard as Actor).get(CardComponent).status = CardStatus.InHand;

    this.emitter.emit("cardAdded", new HandCardAddedEvent(this.owner as Actor, card));
    return { status: CardResultStatus.Success, value: card };
  }

  public addCards(cards: Actor[]): CardResult<Actor[]> {
    // check for max cards
    if (this._cards.length + cards.length > this._maxCards) return { status: CardResultStatus.Error, message: "Hand is full." };
    for (let card of cards) {
      let result = this.addCard(card);
      if (result.status === CardResultStatus.Error) return result;
    }
    return { status: CardResultStatus.Success, value: cards };
  }

  public setDestination(card: Actor): CardResult<Actor | ScreenElement> {
    if (this._cards.length >= this._maxCards) {
      return { status: CardResultStatus.Error, message: "Hand is full." };
    }
    this._cards.push(card);
    return { status: CardResultStatus.Success, value: card };
  }

  public removeCard(card: Actor): CardResult<Actor | ScreenElement> {
    //validate card
    let validatedCard = validateCard(card);
    if (!validatedCard) return { status: CardResultStatus.Error, message: "Card is not a valid CardComponent." };

    const index = this._cards.indexOf(card);
    if (index === -1) return { status: CardResultStatus.Error, message: "Card is not in the hand." };

    // Remove parentage if card is child of hand
    if (card.parent === this.owner) this.owner.removeChild(card);
    this._cards.splice(index, 1);
    (card as Actor).get(CardComponent).isOwned = false;
    (card as Actor).get(CardComponent).isOwnedBy = null;
    (card as Actor).get(CardComponent).status = CardStatus.InPlay;
    this._dirtyFlag = true;
    this.emitter.emit("cardRemoved", new HandCardRemovedEvent(this.owner as Actor, card));
    return { status: CardResultStatus.Success, value: card };
  }

  get count() {
    return this._cards.length;
  }

  private _update() {
    if (this._dirtyFlag) {
      // relayout cards in hand
      this._dirtyFlag = false;
      if (this._spread === "flat") this._useFlatLayout();
      else if (this._spread === "fan") this._useFanLayout();
      this.emitter.emit("handReordered", new HandReorderedEvent(this.owner as Actor));
    }
  }

  private _useFlatLayout() {
    const cardCount = this._cards.length;
    this._cards.forEach((card, index) => {
      const pos = this._calculateFlatPosition(index, cardCount);
      card.actions.moveTo({ pos: vec(pos.x, pos.y), duration: this._cardReorderSpeed });
      card.rotation = pos.rotation;
      card.z = pos.z;
    });
  }

  private _useFanLayout() {
    const cardCount = this._cards.length;
    this._cards.forEach((card, index) => {
      const pos: { x: number; y: number; rotation: number; z: number } = this._calculateFanPosition(index, cardCount);
      card.actions.moveTo({ pos: vec(pos.x, pos.y), duration: this._cardReorderSpeed });
      card.rotation = pos.rotation;
      card.z = pos.z;
    });
  }

  public getNextCardPosition(): CardResult<CardLayout> {
    if (this._cards.length > this._maxCards) return { status: CardResultStatus.Error, message: "Hand is full." };
    const futureCardCount = this._cards.length + 1;
    if (this._spread === "flat")
      return { status: CardResultStatus.Success, value: this._calculateFlatPosition(this._cards.length, futureCardCount) };
    else return { status: CardResultStatus.Success, value: this._calculateFanPosition(this._cards.length, futureCardCount) };
  }

  private _calculateCardSpacing(cardCount: number): number {
    if (cardCount <= 1) return 0;
    let spacing = this._cardWidth * 0.8;
    if (this._maxCardspacing > 0) {
      spacing = Math.min(spacing, this._maxCardspacing);
    }
    if (this._minCardspacing > 0) {
      spacing = Math.max(spacing, this._minCardspacing);
    }
    return spacing;
  }

  private _calculateFlatPosition(index: number, totalCards: number): CardLayout {
    if (totalCards === 0) return { x: 0, y: 0, rotation: 0, z: 0 };
    const hand = this.owner as Actor;
    if (!hand) return { x: 0, y: 0, rotation: 0, z: 0 };
    const spacing = this._calculateCardSpacing(totalCards);

    // For odd number of cards, middle card is at center (position 0)
    // For even number, cards split evenly on both sides
    const middleIndex = Math.floor(totalCards / 2);
    const isOdd = totalCards % 2 === 1;
    const offsetX = isOdd ? (index - middleIndex) * spacing : (index - middleIndex + 0.5) * spacing;
    const x = 0 + offsetX;
    const y = 0;
    const rotation = 0;
    // Z-index: left to right, leftmost card has lowest z
    const z = index;
    return { x, y, rotation, z };
  }

  private _calculateFanPosition(index: number, totalCards: number): CardLayout {
    if (totalCards === 0) {
      return { x: 0, y: 0, rotation: 0, z: 0 };
    }

    const hand = this.owner as Actor;
    if (!hand) {
      return { x: 0, y: 0, rotation: 0, z: 0 };
    }

    // Calculate angle for this card based on per-card separation
    // const middleIndex = (totalCards - 1) / 2;

    let angle: number;
    if (totalCards === 1) {
      angle = 0;
    } else {
      // Each card is separated by fanAngle degrees
      const totalArcAngle = this._fanAngle * (totalCards - 1);
      const startAngle = -totalArcAngle / 2;
      angle = startAngle + index * this._fanAngle;
    }

    const angleRad = (angle * Math.PI) / 180;

    // Calculate position on the arc
    const offsetX = Math.sin(angleRad) * this._fanRadius;
    const offsetY = (1 - Math.cos(angleRad)) * this._fanRadius;

    const x = offsetX;
    const y = offsetY;

    // Cards rotate to follow the arc (convert to radians)
    const rotation = angleRad;

    // Z-index: left to right, so rightmost cards overlap leftmost
    const z = index;
    return { x, y, rotation, z };
  }

  public canTakeCard(): boolean {
    return this._cards.length < this._maxCards;
  }
}

export class TableZoneComponent extends Component {
  private _cards: Actor[] = [];
  private _zoneSprite: Sprite | null = null;
  private _size: Vector;
  public emitter = new EventEmitter<ZoneEvents>();

  constructor(size: Vector, sprite?: Sprite) {
    super();
    if (sprite) this._zoneSprite = sprite;
    this._size = size;
  }

  onAdd(owner: Entity): void {
    if (!owner) return;
    if (!(owner instanceof Actor || owner instanceof ScreenElement)) return;

    if (this._zoneSprite && owner.graphics) {
      owner.graphics.use(this._zoneSprite);
      owner.graphics.current!.width = this._size.x;
      owner.graphics.current!.height = this._size.y;
    }
  }

  get cards() {
    return this._cards;
  }

  public setDestination(card: Actor): CardResult<Actor | ScreenElement> {
    this._cards.push(card);
    return { status: CardResultStatus.Success, value: card };
  }

  public addCard(card: Actor): CardResult<Actor | ScreenElement> {
    // snap card to zone's position
    if (!this.owner) return { status: CardResultStatus.Error, message: "Zone has no owner." };
    if (!(this.owner instanceof Actor || this.owner instanceof ScreenElement)) {
      return { status: CardResultStatus.Error, message: "Zone owner is not an Actor or ScreenElement." };
    }
    //validate card
    let validatedCard = validateCard(card);
    if (!validatedCard) return { status: CardResultStatus.Error, message: "Card is not a valid CardComponent." };

    //if card isn't in cards, add it
    if (this._cards.indexOf(validatedCard as Actor) === -1) this._cards.push(validatedCard as Actor);
    card.pos = this.owner.pos.clone();
    (validatedCard as Actor).get(CardComponent).isOwnedBy = this.owner.id;
    (validatedCard as Actor).get(CardComponent).isOwned = true;
    (validatedCard as Actor).get(CardComponent).status = CardStatus.InZone;

    return { status: CardResultStatus.Success, value: card };
  }

  public removeCard(card: Actor): CardResult<Actor | ScreenElement> {
    //validate card
    let validatedCard = validateCard(card);
    if (!validatedCard) return { status: CardResultStatus.Error, message: "Card is not a valid CardComponent." };
    const index = this._cards.indexOf(card);
    if (index === -1) return { status: CardResultStatus.Error, message: "Card not found in zone." };
    if (index !== -1) this._cards.splice(index, 1);
    (validatedCard as Actor).get(CardComponent).isOwnedBy = null;
    (validatedCard as Actor).get(CardComponent).isOwned = false;
    (validatedCard as Actor).get(CardComponent).status = CardStatus.InPlay;
    return { status: CardResultStatus.Success, value: card };
  }

  public clear() {
    this._cards = [];
  }

  get count() {
    return this._cards.length;
  }
}

export class TableStackComponent extends Component {
  private _offset: Vector = vec(0, 0);
  private _maxVisible: number = 0;
  private _topCardOnly: boolean = true;
  private _cards: Actor[] = [];
  private _dirtyFlag: boolean = false;
  private _maxCardCount: number = 0;

  constructor(config: TableStackOptions) {
    super();
    this._offset = config.offset ? config.offset : vec(0, 0);
    this._maxVisible = config.maxVisible ? config.maxVisible : 0;
    this._topCardOnly = config.topCardOnly ? config.topCardOnly : true;
    this._maxCardCount = config.maxCardCount ? config.maxCardCount : 0;
  }

  onAdd(owner: Entity): void {
    let stack = qualifyEntity(owner);
    if (!stack) return;

    stack.on("preupdate", this._update.bind(this));
  }
  onRemove(previousOwner: Entity): void {
    let stack = qualifyEntity(previousOwner);
    if (!stack) return;
    stack.off("preupdate", this._update.bind(this));
  }

  // getters and setters
  get cards() {
    return this._cards;
  }

  get maxVisible() {
    return this._maxVisible;
  }

  get topCardOnly() {
    return this._topCardOnly;
  }

  get offset() {
    return this._offset;
  }

  set offset(value: Vector) {
    this._offset = value;
  }

  get dirtyFlag() {
    return this._dirtyFlag;
  }

  set dirtyFlag(value: boolean) {
    this._dirtyFlag = value;
  }

  public clear() {
    this._cards = [];
  }

  get count() {
    return this._cards.length;
  }

  get topCard() {
    return this._cards[this._cards.length - 1];
  }

  public canTakeCard(): boolean {
    if (this._maxCardCount === 0) return true;
    return this._cards.length < this._maxCardCount;
  }

  // class utilities
  public addCard(card: Actor): CardResult<Actor | ScreenElement> {
    //validate card
    let validatedCard = validateCard(card);
    if (!validatedCard) return { status: CardResultStatus.Error, message: "Card is not a valid CardComponent." };

    if (this._maxCardCount !== 0 && this._cards.length >= this._maxCardCount) {
      return { status: CardResultStatus.Error, message: "Stack is full, cannot add more cards" };
    }

    if (!this.owner) return { status: CardResultStatus.Error, message: "Stack has no owner." };
    this.owner.addChild(card);
    card.pos = this.getNextCardPosition();
    if (this._cards.indexOf(validatedCard as Actor) === -1) this._cards.push(validatedCard as Actor);
    validatedCard.get(CardComponent).isOwned = true;
    validatedCard.get(CardComponent).isOwnedBy = this.owner.id;
    validatedCard.get(CardComponent).status = CardStatus.InStack;
    this.dirtyFlag = true;
    return { status: CardResultStatus.Success, value: card };
  }

  public setDestination(card: Actor): CardResult<Actor | ScreenElement> {
    //validate card has card component
    let validCard = validateCard(card);
    if (!validCard) return { status: CardResultStatus.Error, message: "Card is not a valid CardComponent." };

    if (this._maxCardCount !== 0 && this._cards.length >= this._maxCardCount) {
      return { status: CardResultStatus.Error, message: "Stack is full, cannot add more cards" };
    }
    this._cards.push(card);
    return { status: CardResultStatus.Success, value: card };
  }

  public addCards(cards: Actor[]): CardResult<Actor[]> {
    for (let i = 0; i < cards.length; i++) {
      let result = this.addCard(cards[i]);
      if (result.status === CardResultStatus.Error) return result;
    }
    this.dirtyFlag = true;
    return { status: CardResultStatus.Success, value: cards };
  }

  public removeCard(card: Actor): CardResult<Actor | ScreenElement> {
    //validate card
    if (!this.owner) return { status: CardResultStatus.Error, message: "Stack has no owner." };
    let validatedCard = validateCard(card);
    if (!validatedCard) return { status: CardResultStatus.Error, message: "Card is not a valid CardComponent." };

    const index = this._cards.indexOf(card);
    if (index === -1) return { status: CardResultStatus.Error, message: "Card is not in the stack." };

    // remove child if card is child of stack
    if (card.parent === this.owner) this.owner?.removeChild(card);
    this._cards.splice(index, 1);
    validatedCard.get(CardComponent).isOwned = true;
    validatedCard.get(CardComponent).isOwnedBy = this.owner.id;
    validatedCard.get(CardComponent).status = CardStatus.InPlay;
    this.dirtyFlag = true;
    return { status: CardResultStatus.Success, value: card };
  }
  public removeCards(cards: Actor[]) {
    cards.forEach(card => this.removeCard(card));
  }

  public getNextCardPosition(): Vector {
    const owner = this.owner as Actor;
    if (!owner) return vec(0, 0);
    const basePos = owner.pos.clone();
    const offsetAmount = this._offset.scale(this._cards.length - 1);
    return basePos.add(offsetAmount);
  }

  private _update(evt: PreUpdateEvent) {
    if (!evt) return;
    if (!this._dirtyFlag) return;
    let owner = this.owner as Actor;
    if (!owner) return;

    const basePos = owner.pos.clone();
    this._cards.forEach((card, index) => {
      if (card.parent !== this.owner) return;
      const offsetAmount = this._offset.scale(index);
      card.pos = basePos.add(offsetAmount);
      card.z = owner.z + index + 1;
    });
    this._dirtyFlag = false;
  }
}

export class TableComponent extends Component {
  private _zones: Record<string, TableZoneComponent> = {};
  private _zonesToAdd: Record<string, TableZoneComponent> = {};

  onAdd(owner: Entity): void {
    if (!owner) return;
    if (!(owner instanceof Actor || owner instanceof ScreenElement)) return;
    owner.on("preupdate", this._update.bind(this));
  }

  onRemove(previousOwner: Entity): void {
    if (!previousOwner) return;
    if (!(previousOwner instanceof Actor || previousOwner instanceof ScreenElement)) return;
    previousOwner.off("preupdate", this._update.bind(this));
  }

  public addZone(name: string, zone: Actor | ScreenElement): CardResult<Actor | ScreenElement> {
    if (!zone.has(TableZoneComponent)) return { status: CardResultStatus.Error, message: "Zone is not a valid TableZoneComponent." };
    this._zonesToAdd[name] = zone.get(TableZoneComponent);
    return { status: CardResultStatus.Success, value: zone };
  }

  public getZone(name: string): CardResult<TableZoneComponent> {
    if (!this._zones[name]) return { status: CardResultStatus.Error, message: "Zone does not exist." };
    return { status: CardResultStatus.Success, value: this._zones[name] };
  }

  private _update() {
    if (!this.owner) return;

    // check zone add for scheduled zones to add
    for (let zoneName in this._zonesToAdd) {
      let zone = this._zonesToAdd[zoneName];
      if (!zone.owner) continue;
      this._zones[zoneName] = this._zonesToAdd[zoneName];
      this.owner.addChild(zone.owner);
      delete this._zonesToAdd[zoneName];
    }
  }
}

//#endregion Card Component

/**
 * Card Actions
 */
// #region Card Actions

/**
 * Flips a card
 */
export function* flipCard(
  actor: Actor | ScreenElement,
  ctx: {
    duration?: number;
    yOffset?: number;
    emitter?: EventEmitter<CardEvents>;
  } = {}
) {
  const duration = ctx.duration ?? 200;
  const yOffset = ctx.yOffset ?? 10;
  const emitter = ctx.emitter;

  const startY = actor.pos.y;
  const startRotation = actor.rotation;
  const startScaleX = actor.scale.x;
  const startScaleY = actor.scale.y;

  let elapsedTime = 0;
  let flipped = false;

  const cardComp = actor.get(CardComponent);
  if (!cardComp) {
    console.warn("Actor does not have CardComponent");
    return;
  }

  const halfDuration = duration / 2;
  if (emitter) {
    emitter.emit("flipstarted", new CardFlippedEventStarted(actor, duration));
  }

  while (elapsedTime < duration) {
    const deltaTime: number = yield;
    elapsedTime += deltaTime;

    if (!flipped) {
      const progress = Math.min(elapsedTime / halfDuration, 1);
      const scaleX = Math.abs(startScaleX) * (1 - progress);

      actor.rotation = startRotation;
      actor.scale.x = scaleX;
      actor.scale.y = startScaleY;
      actor.pos.y = lerp(startY, startY - yOffset, progress);

      if (elapsedTime >= halfDuration) {
        cardComp.isFaceUp = !cardComp.isFaceUp;
        if (actor.graphics) {
          actor.graphics.use(cardComp.isFaceUp ? "cardFace" : "cardBack");
        }
        flipped = true;
      }
    } else {
      const progress = Math.min((elapsedTime - halfDuration) / halfDuration, 1);
      const scaleX = Math.abs(startScaleX) * progress;

      // Flip rotation by 180° for the second half
      actor.rotation = startRotation - Math.PI;
      actor.scale.x = scaleX;
      actor.scale.y = startScaleY;
      actor.pos.y = lerp(startY - yOffset, startY, progress);
    }
  }

  // Ensure final state (with flipped rotation)
  actor.scale.x = startScaleX;
  actor.scale.y = startScaleY;
  actor.rotation = startRotation + Math.PI;
  actor.pos.y = startY;
  if (emitter) {
    emitter.emit("flipcompleted", new CardFlippedEventStarted(actor, duration));
  }
}
export function* moveAndFlipCard(
  actor: Actor,
  ctx: {
    targetX: number;
    targetY: number;
    duration: number; // Total animation duration in ms
    flipDuration?: number; // Duration of flip animation in ms (defaults to half of duration)
    emitter?: EventEmitter<CardEvents>;
  }
) {
  const startX = actor.pos.x;
  const startY = actor.pos.y;
  const startScaleX = actor.scale.x;
  const emitter = ctx.emitter;

  const flipDur = ctx.flipDuration ?? ctx.duration / 2;
  let elapsedTime = 0;
  let flipped = false;

  if (emitter) {
    emitter.emit("moveAndFlipStarted", new CardMovedAndFlippedEventStarted(actor));
  }

  while (elapsedTime < ctx.duration) {
    const deltaTime: number = yield; // Get elapsed time since last frame
    elapsedTime += deltaTime;

    // Calculate progress (0 to 1)
    const progress = Math.min(elapsedTime / ctx.duration, 1);

    // Ease-out cubic for smooth movement
    const eased = 1 - Math.pow(1 - progress, 3);

    // Interpolate position
    actor.pos.x = startX + (ctx.targetX - startX) * eased;
    actor.pos.y = startY + (ctx.targetY - startY) * eased;

    // Flip animation (shrink to 0 then grow back)
    const flipProgress = Math.min(elapsedTime / flipDur, 1);
    if (flipProgress < 0.5) {
      // First half: scale down to 0
      actor.scale.x = startScaleX * (1 - flipProgress * 2);
    } else {
      // Second half: scale back up to original
      actor.scale.x = startScaleX * ((flipProgress - 0.5) * 2);
    }

    if (elapsedTime >= ctx.duration / 2 && !flipped) {
      const cardComponent = actor.get(CardComponent);
      if (!cardComponent) {
        console.warn("Actor does not have CardComponent");
        return; // or continue without flipping
      }
      cardComponent.isFaceUp = !cardComponent.isFaceUp;
      if (actor.graphics) {
        actor.graphics.use(cardComponent.isFaceUp ? "cardFace" : "cardBack");
      }
      flipped = true;
    }
  }

  // Ensure final position and scale
  actor.pos.x = ctx.targetX;
  actor.pos.y = ctx.targetY;
  actor.scale.x = startScaleX;
  actor.rotation = 0;
  if (emitter) {
    emitter.emit("moveAndFlipCompleted", new CardMovedAndFlippedEventCompleted(actor, ctx.duration));
  }
}
export function* moveAndRotateCard(
  actor: Actor,
  ctx: {
    targetX: number;
    targetY: number;
    duration: number; // Total animation duration in ms
    rotationSpeed?: number;
    emitter?: EventEmitter<CardEvents>;
  }
) {
  const startPos = actor.pos.clone();
  const startRotation = actor.rotation;
  const targetVector = vec(ctx.targetX, ctx.targetY);
  const duration = ctx.duration;
  const rotationSpeed = (Math.PI * 2) / duration;
  const emitter = ctx.emitter;
  let elapsedTime = 0;

  if (emitter) {
    emitter.emit("moveAndRotateStarted", new CardMovedAndRotatedEventStarted(actor));
  }

  while (elapsedTime < duration) {
    const deltaTime: number = yield; // Get elapsed time since last frame
    // Calculate progress (0 to 1)
    const progress = Math.min(elapsedTime / ctx.duration, 1);
    elapsedTime += deltaTime;
    actor.pos = lerpVector(startPos, targetVector, progress);
    actor.rotation = startRotation + rotationSpeed * elapsedTime;
  }

  // Ensure final state
  actor.pos.x = ctx.targetX;
  actor.pos.y = ctx.targetY;
  actor.rotation = startRotation;
  if (emitter) {
    emitter.emit("moveAndRotateCompleted", new CardMovedAndRotatedEventCompleted(actor, duration));
  }
}
export class CoroutineAction implements Action {
  id = nextActionId();
  private _stopped = false;
  private _coroutineInstance: CoroutineInstance | null = null;
  private _actor: Actor | null = null;

  /**
   * @param coroutineFactory - Function that creates the coroutine generator
   * @param ctx - Optional context object to pass to the coroutine
   */
  // eslint-disable-next-line no-unused-vars
  constructor(private coroutineFactory: (actor: Actor, ctx?: any) => Generator<any, void, number>, private ctx?: any) {}

  isComplete(actor: Actor): boolean {
    // Store actor reference for update method
    if (!this._actor) {
      this._actor = actor;
    }
    // Complete when coroutine finishes or is stopped
    return this._stopped || (this._coroutineInstance?.isComplete() ?? false);
  }

  update(): void {
    if (!this._coroutineInstance && !this._stopped && this._actor) {
      // Start the coroutine on first update
      const engine = Engine.useEngine();
      const actor = this._actor;
      const ctx = this.ctx;

      // Wrap in a CoroutineGenerator (no parameters)
      const generator = () => this.coroutineFactory.call(actor, actor, ctx);

      this._coroutineInstance = coroutine(actor, engine, generator, {
        autostart: true,
      });
    }
  }

  reset(): void {
    this._stopped = false;
    if (this._coroutineInstance) {
      this._coroutineInstance.cancel();
      this._coroutineInstance = null;
    }
  }

  stop(): void {
    this._stopped = true;
    if (this._coroutineInstance) {
      this._coroutineInstance.cancel();
    }
  }
}

// eslint-disable-next-line no-unused-vars
export function coroutineAction(coroutine: (actor: Actor, ctx?: any) => Generator<any, void, number>, ctx?: any): CoroutineAction {
  return new CoroutineAction(coroutine, ctx);
}

// #endregion Card Actions

/**
 * Card Events
 */

// #region Events

//#region cardEvents
export type CardEvents = {
  cardCreated: CardCreatedEvent;
  flipStarted: CardFlippedEventStarted;
  flipCompleted: CardFlippedEventCompleted;
  moveAndRotateStarted: CardMovedAndRotatedEventStarted;
  moveAndRotateCompleted: CardMovedAndRotatedEventCompleted;
  moveAndFlipStarted: CardMovedAndFlippedEventStarted;
  moveAndFlipCompleted: CardMovedAndFlippedEventCompleted;
  cardHovered: CardHoveredEvent;
  cardUnhovered: CardUnhoveredEvent;
  cardOwnerChanged: CardOwnerChangedEvent;
  cardOwnerStatusChanged: CardOwnerStatusChangedEvent;
};

// eslint-disable-next-line no-redeclare
export const CardEvents = {
  cardCreated: "cardcreated",
  flipStarted: "flipstarted",
  flipCompleted: "flipcompleted",
  moveAndRotateStarted: "moveandrotatestarted",
  moveAndRotateCompleted: "moveandrotatecompleted",
  moveAndFlipStarted: "moveandflipstarted",
  moveAndFlipCompleted: "moveandflipcompleted",
  cardHovered: "cardhovered",
  cardUnhovered: "cardunhovered",
  cardOwnerChanged: "cardownerchanged",
  cardOwnerStatusChanged: "cardownerstatuschanged",
} as const;

//Events: card:created

export class CardCreatedEvent extends GameEvent<Entity> {
  card: Actor | ScreenElement;
  constructor(card: Actor | ScreenElement) {
    super();
    this.card = card;
  }
}

//Events: card:flipped:started
export class CardFlippedEventStarted extends GameEvent<Entity> {
  card: Actor | ScreenElement;
  duration: number;
  constructor(card: Actor | ScreenElement, duration: number) {
    super();
    this.card = card;
    this.duration = duration;
  }
}

//Events: card:flipped:completed
export class CardFlippedEventCompleted extends GameEvent<Entity> {
  card: Actor | ScreenElement;
  constructor(card: Actor | ScreenElement) {
    super();
    this.card = card;
  }
}

//Events: card:movedandrotated:started
export class CardMovedAndRotatedEventStarted extends GameEvent<Entity> {
  card: Actor | ScreenElement;
  constructor(card: Actor | ScreenElement) {
    super();
    this.card = card;
  }
}

//Events: card:movedandrotated:completed
export class CardMovedAndRotatedEventCompleted extends GameEvent<Entity> {
  card: Actor | ScreenElement;
  duration: number;
  constructor(card: Actor | ScreenElement, duration: number) {
    super();
    this.card = card;
    this.duration = duration;
  }
}

//Events: card:movedandflipped:started
export class CardMovedAndFlippedEventStarted extends GameEvent<Entity> {
  card: Actor | ScreenElement;
  constructor(card: Actor | ScreenElement) {
    super();
    this.card = card;
  }
}

//Events: card:movedandflipped:completed
export class CardMovedAndFlippedEventCompleted extends GameEvent<Entity> {
  card: Actor | ScreenElement;
  duration: number;
  constructor(card: Actor | ScreenElement, duration: number) {
    super();
    this.card = card;
    this.duration = duration;
  }
}

//Events: card:hovered
export class CardHoveredEvent extends GameEvent<Entity> {
  card: Actor | ScreenElement;
  constructor(card: Actor | ScreenElement) {
    super();
    this.card = card;
  }
}

//Events: card:unhovered
export class CardUnhoveredEvent extends GameEvent<Entity> {
  card: Actor | ScreenElement;
  constructor(card: Actor | ScreenElement) {
    super();
    this.card = card;
  }
}

//Events: card:ownerChanged
export class CardOwnerChangedEvent extends GameEvent<Entity> {
  card: Actor | ScreenElement;
  previousOwnerId: number | null;
  newOwnerId: number | null;
  constructor(card: Actor | ScreenElement, previousOwnerId: number | null, newOwnerId: number | null) {
    super();
    this.card = card;
    this.previousOwnerId = previousOwnerId;
    this.newOwnerId = newOwnerId;
  }
}

export class CardOwnerStatusChangedEvent extends GameEvent<Entity> {
  card: Actor | ScreenElement;
  previousStatus: CardStatusType;
  newStatus: CardStatusType;
  constructor(card: Actor | ScreenElement, previousStatus: keyof typeof CardStatus, newStatus: keyof typeof CardStatus) {
    super();
    this.card = card;
    this.previousStatus = previousStatus;
    this.newStatus = newStatus;
  }
}
//#endregion cardEvents

//Deck Events
// #region deckEvents
export type DeckEvents = {
  created: DeckCreatedEvent;
  shuffle: DeckShuffleEvent;
  cardAdded: DeckCardAddedEvent;
  cardRemoved: DeckCardRemovedEvent;
  cleared: DeckClearedEvent;
  cardDrawn: DeckCardDrawnEvent;
};

// eslint-disable-next-line no-redeclare
export const DeckEvents = {
  created: "created",
  shuffle: "shuffle",
  cardAdded: "cardadded",
  cardRemoved: "cardremoved",
  cleared: "cleared",
  cardDrawn: "carddrawn",
} as const;

//Events: deck:created
export class DeckCreatedEvent extends GameEvent<Entity> {
  deck: Actor | ScreenElement;
  constructor(deck: Actor | ScreenElement) {
    super();
    this.deck = deck;
  }
}

//Events: deck:shuffled
export class DeckShuffleEvent extends GameEvent<Entity> {
  deck: Actor | ScreenElement;
  numShuffles: number;
  constructor(deck: Actor | ScreenElement, numShuffles: number) {
    super();
    this.deck = deck;
    this.numShuffles = numShuffles;
  }
}
//Events: deck:cardadded
export class DeckCardAddedEvent extends GameEvent<Entity> {
  card: Actor | ScreenElement;
  constructor(card: Actor | ScreenElement) {
    super();
    this.card = card;
  }
}
//Events: deck:cardremoved
export class DeckCardRemovedEvent extends GameEvent<Entity> {
  card: Actor | ScreenElement;
  constructor(card: Actor | ScreenElement) {
    super();
    this.card = card;
  }
}
//Events: deck:cleared
export class DeckClearedEvent extends GameEvent<Entity> {
  deck: Actor | ScreenElement;
  constructor(deck: Actor | ScreenElement) {
    super();
    this.deck = deck;
  }
}

//Events: deck:cardDrawn
export class DeckCardDrawnEvent extends GameEvent<Entity> {
  deck: Actor | ScreenElement;
  cards: Actor[] | ScreenElement[];
  numCards?: number;
  constructor(deck: Actor | ScreenElement, cards: Actor[] | ScreenElement[], numCards: number) {
    super();
    this.deck = deck;
    this.cards = cards;
    this.numCards = numCards;
  }
}

// #endregion deckEvents

//Hand Events
// #region handEvents
export type HandEvents = {
  created: HandCreatedEvent;
  cardAdded: HandCardAddedEvent;
  cardRemoved: HandCardRemovedEvent;
  cleared: HandClearedEvent;

  handReordered: HandReorderedEvent;
};

// eslint-disable-next-line no-redeclare
export const HandEvents = {
  created: "created",
  cardAdded: "cardadded",
  cardRemoved: "cardremoved",
  cleared: "cleared",
  handReordered: "handreordered",
} as const;

//Events: hand:created
export class HandCreatedEvent extends GameEvent<Entity> {
  hand: Actor | ScreenElement;
  constructor(hand: Actor | ScreenElement) {
    super();
    this.hand = hand;
  }
}
//Events: hand:cardremoved
export class HandCardRemovedEvent extends GameEvent<Entity> {
  hand: Actor | ScreenElement;
  card: Actor | ScreenElement;
  constructor(hand: Actor | ScreenElement, card: Actor | ScreenElement) {
    super();
    this.hand = hand;
    this.card = card;
  }
}

//Events: hand:cleared
export class HandClearedEvent extends GameEvent<Entity> {
  hand: Actor | ScreenElement;
  constructor(hand: Actor | ScreenElement) {
    super();
    this.hand = hand;
  }
}
//Events: hand:cardadded
export class HandCardAddedEvent extends GameEvent<Entity> {
  hand: Actor | ScreenElement;
  card: Actor | ScreenElement;
  constructor(hand: Actor | ScreenElement, card: Actor | ScreenElement) {
    super();
    this.hand = hand;
    this.card = card;
  }
}

//Events: hand:reordered
export class HandReorderedEvent extends GameEvent<Entity> {
  hand: Actor | ScreenElement;
  constructor(hand: Actor | ScreenElement) {
    super();
    this.hand = hand;
  }
}

// #endregion handEvents

//Table/Zone Events
//#region zoneEvents
//Events: table:zonecreated
export type ZoneEvents = {
  created: ZoneCreatedEvent;
};

// eslint-disable-next-line no-redeclare
export const ZoneEvents = {
  created: "created",
} as const;

export class ZoneCreatedEvent extends GameEvent<Entity> {
  zone: Actor | ScreenElement;
  table: Actor | ScreenElement;
  constructor(zone: Actor | ScreenElement, table: Actor | ScreenElement) {
    super();
    this.zone = zone;
    this.table = table;
  }
}
// #endregion zoneEvents

// #endregion events

/**
 * Card System Graphics
 */

export class DeckGraphics extends Graphic {
  size: number;
  cardBack: Sprite;
  cardThickness: number = 1;
  stackDirection: Vector = Vector.Down;
  config: {
    size: number;
    cardBack: Sprite;
    isTopCardShowing: boolean;
    cardThickness: number;
    topCard: Actor | null;
    cardSize: Vector;
    stackDirection: Vector;
  };

  constructor(config: {
    size: number;
    cardBack: Sprite;
    isTopCardShowing: boolean;
    cardThickness: number;
    topCard: Actor | null;
    cardSize: Vector;
    stackDirection: Vector;
  }) {
    super({});
    this.config = config;
    this.size = config.size;
    this.cardBack = config.cardBack;
    this.cardThickness = config.cardThickness;
    this.width = config.cardSize.x;
    this.height = config.cardSize.y;
    this.stackDirection = config.stackDirection;
  }

  protected _drawImage(ex: ExcaliburGraphicsContext, x: number, y: number): void {
    for (let i = 0; i < this.size - 1; i++) {
      this.cardBack.draw(ex, x, y);
      x += this.cardThickness * this.stackDirection.x;
      y += this.cardThickness * this.stackDirection.y;
    }
  }

  updateDeckSize(newSize: number) {
    this.size = newSize;
  }

  clone(): Graphic {
    return new DeckGraphics(this.config);
  }
}

/*
 * Utility functions
 */

function qualifyEntity(ent: Entity): Actor | ScreenElement | null {
  if (ent instanceof Actor || ent instanceof ScreenElement) return ent as Actor | ScreenElement;
  return null;
}

function validateCard(ent: Entity): Actor | null {
  if (!(ent instanceof Actor)) return null;
  if (!(ent.has(CardComponent) || ent.has(PlayingCardComponent))) return null;
  return ent as Actor;
}
