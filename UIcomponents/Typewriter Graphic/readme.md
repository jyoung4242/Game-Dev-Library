# Typewriter Graphic Module

![Typewriter](./type.gif)

A typewriter effect graphic component for ExcaliburJS that displays text character-by-character with customizable timing and styling.

## Features

- **Character-by-character animation** - Text reveals one letter at a time
- **Customizable typing speed** - Control delay between character renders
- **Full text styling** - Leverage canvas-txt for advanced text formatting
- **Event system** - Hook into typing lifecycle with events
- **ExcaliburJS integration** - Extends the `Graphic` class for seamless use in actors or screen elements

## Installation

Copy the `typewriter.ts` file into your ExcaliburJS project.

## Dependencies

- **excalibur** - ExcaliburJS game engine
- **canvas-txt** - Advanced canvas text rendering library

## API Reference

### TypeWriterConfig

Configuration interface for creating a TypeWriter instance.

```typescript
interface TypeWriterConfig {
  text: string; // The complete text to display
  typeDelay: number; // Milliseconds between character reveals
  textConfig: CanvasTextConfig; // canvas-txt text styling configuration
  color?: Color; // Text color (default: Color.White)
}
```

### TypeWriter Class

Extends `Graphic` to display typewriter text effect.

#### Constructor

```typescript
const typewriter = new TypeWriter({
  text: "Hello, World!",
  typeDelay: 50,
  textConfig: {
    width: 400,
    height: 100,
    font: "Arial",
    fontSize: 24,
    align: "left",
  },
  color: Color.Black,
});
```

#### Properties

| Property            | Type      | Description                          |
| ------------------- | --------- | ------------------------------------ |
| `endStringText`     | `string`  | The complete text to display         |
| `currentStringText` | `string`  | Currently typed text                 |
| `stringIndex`       | `number`  | Current character index              |
| `typeDelay`         | `number`  | Milliseconds between characters      |
| `isDone`            | `boolean` | Whether typing animation is complete |
| `isFinishing`       | `boolean` | Whether finish() has been called     |

#### Methods

| Method     | Description                                          |
| ---------- | ---------------------------------------------------- |
| `clone()`  | Creates a copy of this TypeWriter graphic            |
| `reset()`  | Resets animation state to beginning                  |
| `finish()` | Immediately displays all remaining text (skip ahead) |

### Events

The TypeWriter emits events through its `events` property. Listen to events using:

```typescript
typewriter.events.on('eventName', (data) => { ... });
```

#### Available Events

| Event            | Payload          | Description                                                   |
| ---------------- | ---------------- | ------------------------------------------------------------- |
| `typingStart`    | `TypingStart`    | Fired when typing animation begins                            |
| `letterTyped`    | `LetterTyped`    | Fired when each letter is added (includes `letter` property)  |
| `typingComplete` | `TypingComplete` | Fired when all text is typed (includes `endingText` property) |

## Usage Examples

### Basic Setup

```typescript
import { TypeWriter } from "./typewriter";
import { Color } from "excalibur";

const typewriter = new TypeWriter({
  text: "Welcome to my game!",
  typeDelay: 100,
  textConfig: {
    width: 500,
    height: 200,
    font: "Arial",
    fontSize: 32,
    align: "center",
  },
  color: Color.White,
});

actor.graphics.add(typewriter);
```

### Using Events

```typescript
// Respond to typing completion
typewriter.events.on("typingComplete", event => {
  console.log("Typing finished: " + event.endingText);
  // Show a skip button, trigger next dialog, etc.
});

// Play sound for each letter
typewriter.events.on("letterTyped", event => {
  audioManager.play("beep_sound");
});

// Perform action when typing starts
typewriter.events.on("typingStart", () => {
  console.log("Typing started");
});
```

### With Actor Integration

```typescript
import { Actor, Vector } from "excalibur";

const dialogueActor = new Actor({
  x: 400,
  y: 300,
});

const typewriter = new TypeWriter({
  text: "This is a long dialogue with lots of text...",
  typeDelay: 50,
  textConfig: {
    width: 600,
    height: 200,
    font: "Georgia",
    fontSize: 20,
    lineHeight: 30,
  },
});

dialogueActor.graphics.add(typewriter);
scene.add(dialogueActor);

// Skip to end on click using finish()
dialogueActor.on("pointerup", () => {
  if (!typewriter.isDone) {
    typewriter.finish();
  }
});
```

### Advanced Text Styling

Leverage all `CanvasTextConfig` options from canvas-txt for rich formatting:

```typescript
const typewriter = new TypeWriter({
  text: "Styled typewriter text",
  typeDelay: 75,
  textConfig: {
    width: 400,
    height: 300,
    font: "Georgia",
    fontSize: 24,
    fontWeight: "bold",
    align: "center",
    vAlign: "middle",
    lineHeight: 40,
    word_break: true,
  },
  color: Color.Gold,
});
```

## Tips & Best Practices

1. **Adjust typeDelay for pace** - Lower values (25-50ms) feel snappy, higher values (100-150ms) feel deliberate
2. **Handle canvas-txt config sizing** - Width and height in `textConfig` determine the rendering area
3. **Reset before reuse** - If reusing the same TypeWriter across multiple dialogues, call `reset()`
4. **Event-driven skipping** - Use the `isDone` property to create skip-to-end functionality
5. **Chain with other graphics** - Add multiple typewriters to an actor for multi-line dialogue

## Common Patterns

### Dialogue Box with Skip

```typescript
const typewriter = new TypeWriter({...});

typewriter.events.on('typingComplete', () => {
  showContinueButton();
});

// Clicking the actor skips typing
actor.on('pointerup', () => {
  if (!typewriter.isDone) {
    typewriter.finish();
  }
});
```

### Sequential Dialogues

```typescript
const dialogues = ["First message", "Second message"];
let currentIndex = 0;

function showNextDialogue() {
  if (currentIndex >= dialogues.length) return;

  const typewriter = new TypeWriter({
    text: dialogues[currentIndex],
    typeDelay: 80,
    textConfig: { width: 500, height: 150, fontSize: 20 },
  });

  typewriter.events.on("typingComplete", () => {
    currentIndex++;
    // Show button to trigger next dialogue
  });
}
```

## License

MIT licensed
