# UITextInput Developer README

## Overview

The `UITextInput` component provides a fully-featured text input field with keyboard support, cursor management, password masking, and
focus handling. It extends `InteractiveUIComponent` and integrates seamlessly with the Excalibur UI Framework's focus management
system.

## Architecture

### Class Hierarchy

```
InteractiveUIComponent<T, E>
    └── UITextInput
```

### Key Features

- **Keyboard Input**: Full keyboard support with cursor navigation
- **Focus Management**: Integrates with `UIFocusManager` for tab navigation
- **Password Masking**: Optional password mode with bullet characters
- **Cursor Blinking**: Animated cursor with configurable blink rate
- **Validation**: Maximum length enforcement and character filtering
- **Event System**: Comprehensive event emission for all interactions
- **Visual States**: Normal, focused, and disabled states with gradient backgrounds

## Configuration

### UITextInputConfig

```typescript
interface UITextInputConfig {
  // Basic properties
  value?: string; // Initial text value
  placeholder?: string; // Placeholder text when empty
  maxLength?: number; // Maximum character limit
  password?: boolean; // Enable password masking
  tabStopIndex?: number; // Tab navigation order

  // Layout properties
  width: number; // Input width in pixels
  height: number; // Input height in pixels
  inputRadius?: number; // Corner radius (default: 4)
  padding?: Vector; // Text padding (default: vec(8,8))
  borderWidth?: number; // Border thickness (default: 2)

  // Text styling
  textOptions?: TextOptions; // Font, size, color configuration

  // Color theming
  colors?: UITextInputColors; // State-based color configuration
}
```

### UITextInputColors

```typescript
interface UITextInputColors {
  // Background gradients
  backgroundStarting?: Color; // Background gradient start
  backgroundEnding?: Color; // Background gradient end
  focusedStarting?: Color; // Focused state gradient start
  focusedEnding?: Color; // Focused state gradient end
  disabledStarting?: Color; // Disabled state gradient start
  disabledEnding?: Color; // Disabled state gradient end

  // Border colors
  borderNormal?: Color; // Normal state border
  borderFocused?: Color; // Focused state border
  borderDisabled?: Color; // Disabled state border

  // Cursor
  cursorColor?: Color; // Text cursor color
}
```

### Default Configuration

```typescript
const defaultTextInputConfig: UITextInputConfig = {
  width: 200,
  height: 32,
  inputRadius: 4,
  padding: vec(8, 8),
  borderWidth: 2,
  textOptions: {
    font: new Font({ size: 16, family: "Arial" }),
    color: Color.Black,
  },
  colors: {
    backgroundStarting: Color.White,
    borderNormal: Color.fromHex("#CCCCCC"),
    borderFocused: Color.fromHex("#4A90E2"),
    borderDisabled: Color.fromHex("#E0E0E0"),
    cursorColor: Color.Black,
  },
};
```

## Usage Examples

### Basic Text Input

```typescript
import { UITextInput } from "./Components/uiTextInput";

// Create a basic text input
const textInput = new UITextInput({
  width: 300,
  height: 40,
  placeholder: "Enter your name",
  value: "John Doe",
});

// Add to scene
scene.add(textInput);
```

### Password Input with Validation

```typescript
const passwordInput = new UITextInput({
  width: 300,
  height: 40,
  placeholder: "Enter password",
  password: true,
  maxLength: 20,
  colors: {
    borderNormal: Color.Gray,
    borderFocused: Color.Blue,
    backgroundStarting: Color.fromHex("#F8F8F8"),
  },
});
```

### Styled Input with Custom Colors

```typescript
const styledInput = new UITextInput({
  width: 250,
  height: 35,
  placeholder: "Search...",
  inputRadius: 6,
  padding: vec(12, 12),
  textOptions: {
    font: new Font({ size: 14, family: "Segoe UI" }),
    color: Color.fromHex("#333333"),
  },
  colors: {
    backgroundStarting: Color.fromHex("#FFFFFF"),
    backgroundEnding: Color.fromHex("#F5F5F5"),
    borderNormal: Color.fromHex("#E1E1E1"),
    borderFocused: Color.fromHex("#007ACC"),
    cursorColor: Color.fromHex("#007ACC"),
  },
});
```

### Form with Multiple Inputs

```typescript
// Create form inputs
const usernameInput = new UITextInput({
  width: 300,
  height: 40,
  placeholder: "Username",
  tabStopIndex: 0,
});

const emailInput = new UITextInput({
  width: 300,
  height: 40,
  placeholder: "Email",
  tabStopIndex: 1,
});

const passwordInput = new UITextInput({
  width: 300,
  height: 40,
  placeholder: "Password",
  password: true,
  tabStopIndex: 2,
});

// Position inputs
usernameInput.pos = vec(100, 100);
emailInput.pos = vec(100, 160);
passwordInput.pos = vec(100, 220);

// Add to scene
scene.add(usernameInput);
scene.add(emailInput);
scene.add(passwordInput);
```

## Event Handling

### Event Types

```typescript
// Value changed event
textInput.eventEmitter.on("UITextInputValueChanged", evt => {
  console.log("Value changed:", evt.value);
});

// Focus events
textInput.eventEmitter.on("UITextInputFocused", evt => {
  console.log("Input focused");
});

textInput.eventEmitter.on("UITextInputUnfocused", evt => {
  console.log("Input unfocused");
});

// Submit event (Enter key)
textInput.eventEmitter.on("UITextInputSubmit", evt => {
  console.log("Submitted:", evt.value);
  // Process form submission
});

// Enable/disable events
textInput.eventEmitter.on("UITextInputEnabled", evt => {
  console.log("Input enabled");
});

textInput.eventEmitter.on("UITextInputDisabled", evt => {
  console.log("Input disabled");
});
```

### Event Objects

```typescript
interface UITextInputValueChanged extends GameEvent<UITextInput> {
  target: UITextInput;
  value: string;
}

interface UITextInputFocused extends GameEvent<UITextInput> {
  target: UITextInput;
}

interface UITextInputUnfocused extends GameEvent<UITextInput> {
  target: UITextInput;
}

interface UITextInputSubmit extends GameEvent<UITextInput> {
  target: UITextInput;
  value: string;
}
```

## API Reference

### Properties

| Property         | Type               | Description             |
| ---------------- | ------------------ | ----------------------- |
| `value`          | `string`           | Current text value      |
| `cursorPosition` | `number`           | Current cursor position |
| `isFocused`      | `boolean`          | Whether input has focus |
| `inputState`     | `UITextInputState` | Current visual state    |
| `eventEmitter`   | `EventEmitter`     | Event emitter instance  |

### Methods

#### Value Management

```typescript
// Get current value
const value = textInput.getValue();

// Set new value (respects maxLength)
textInput.setValue("New text value");
```

#### Cursor Control

```typescript
// Get cursor position
const pos = textInput.getCursorPosition();

// Set cursor position
textInput.setCursorPosition(5);
```

#### Focus Management

```typescript
// Give focus programmatically
textInput.focus();

// Remove focus
textInput.loseFocus();

// Check focus state
if (textInput.isFocused) {
  // Input has focus
}
```

#### State Management

```typescript
// Enable/disable input
textInput.setEnabled(true);
textInput.setEnabled(false);

// Get current state
const state = textInput.inputState; // "normal" | "focused" | "disabled"
```

## Keyboard Controls

| Key               | Action                                 |
| ----------------- | -------------------------------------- |
| `Left Arrow`      | Move cursor left                       |
| `Right Arrow`     | Move cursor right                      |
| `Home`            | Move cursor to start                   |
| `End`             | Move cursor to end                     |
| `Backspace`       | Delete character before cursor         |
| `Delete`          | Delete character after cursor          |
| `Enter`           | Submit input (emits submit event)      |
| `Escape`          | Lose focus                             |
| `Tab`             | Navigate to next focusable element     |
| `Shift+Tab`       | Navigate to previous focusable element |
| `Printable chars` | Insert character at cursor             |

## Focus Management Integration

The `UITextInput` integrates with the `UIFocusManager` for keyboard navigation:

```typescript
import { UIFocusManager } from "./Components/uiFocusManager";

// Create focus manager
const focusManager = new UIFocusManager();

// Add inputs to manager
focusManager.addFocusable(usernameInput);
focusManager.addFocusable(emailInput);
focusManager.addFocusable(passwordInput);

// Set initial focus
focusManager.setFocus(usernameInput);
```

## Styling Guide

### Color Schemes

#### Light Theme

```typescript
colors: {
  backgroundStarting: Color.White,
  backgroundEnding: Color.fromHex("#FAFAFA"),
  borderNormal: Color.fromHex("#E1E1E1"),
  borderFocused: Color.fromHex("#007ACC"),
  borderDisabled: Color.fromHex("#F3F2F1"),
  cursorColor: Color.Black
}
```

#### Dark Theme

```typescript
colors: {
  backgroundStarting: Color.fromHex("#2D2D30"),
  backgroundEnding: Color.fromHex("#1E1E1E"),
  borderNormal: Color.fromHex("#3C3C3C"),
  borderFocused: Color.fromHex("#007ACC"),
  borderDisabled: Color.fromHex("#2D2D30"),
  cursorColor: Color.White
}
```

### Typography

```typescript
textOptions: {
  font: new Font({
    size: 14,
    family: 'Segoe UI, system-ui, sans-serif',
    bold: false
  }),
  color: Color.fromHex("#333333")
}
```
