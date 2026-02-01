# UIFocusManager Usage Guide

The `UIFocusManager` provides keyboard navigation and focus management for interactive UI components in your Excalibur game. It enables
Tab/Shift+Tab navigation between buttons, checkboxes, text inputs, and other focusable elements.

## Quick Start

```typescript
import { UIFocusManager } from "excalibur-ui";
import { UIButton, UICheckbox } from "excalibur-ui";

// Create focus manager
const focusManager = new UIFocusManager();

// Create focusable components
const button1 = new UIButton({
  name: "button1",
  pos: vec(100, 100),
  tabStopIndex: 1,
});

const button2 = new UIButton({
  name: "button2",
  pos: vec(100, 150),
  tabStopIndex: 2,
});

const checkbox = new UICheckbox({
  name: "checkbox",
  pos: vec(100, 200),
  tabStopIndex: 3,
});

// Register components with focus manager
focusManager.register([button1, button2, checkbox]);

// Add to engine
engine.add(button1);
engine.add(button2);
engine.add(checkbox);

// Cycle through components
focusManager.moveFocus(); // increments to next index
focusManager.moveFocus(false); // decrements to proceeding index
```

## Basic Concepts

### Tab Stop Index

Every focusable component has a `tabStopIndex` property that determines its position in the navigation order:

- **-1**: Component is not focusable (default)
- **0+**: Component is focusable, ordered by index value

```typescript
// Make components focusable
const button = new UIButton({
  tabStopIndex: 1, // Can be focused and navigated to
});

const disabledButton = new UIButton({
  tabStopIndex: -1, // Cannot be focused
});
```

### Focus States

Components can be in one of these focus states:

- **Unfocused**: Default state
- **Focused**: Currently receiving keyboard input
- **Programmatically Focused**: Set via `focusManager.setFocus()`

### Programmatic Navigation

```typescript
// Move focus programmatically
focusManager.moveFocus(true); // Forward (Tab)
focusManager.moveFocus(false); // Backward (Shift+Tab)

// Set focus to specific component
focusManager.setFocus(button1);

// Clear all focus
focusManager.clearFocus();

// Check current focus
if (focusManager.focused) {
  console.log("Currently focused:", focusManager.focused.name);
}
```

## Component Registration

### Registering Components

```typescript
const focusManager = new UIFocusManager();

// Register single component
focusManager.register(button);

// Register multiple components
focusManager.register([button1, button2, checkbox]);

// Register at different times
focusManager.register(button1);
focusManager.register(button2);
```

### Unregistering Components

```typescript
// Remove single component
focusManager.unregister(button);

// Remove multiple components
focusManager.unregister([button1, button2]);

// Components are automatically unregistered when removed from engine
```

## Focus Events

Listen to focus events on individual components:

```typescript
button.emitter.on("UIButtonFocused", () => {
  console.log("Button gained focus");
});

button.emitter.on("UIButtonUnfocused", () => {
  console.log("Button lost focus");
});

checkbox.emitter.on("UICheckboxFocused", () => {
  console.log("Checkbox gained focus");
});
```

### Focus Indicators

Ensure users can see which element is focused:

```typescript
// Components automatically show focus indicators
// But you can customize them:

const button = new UIButton({
  focusIndicator: vec(10, 10), // Custom position
  customFocus: (ctx, width, height) => {
    // Custom focus drawing
    ctx.strokeStyle = "#FF0000";
    ctx.lineWidth = 3;
    ctx.strokeRect(2, 2, width - 4, height - 4);
  },
});
```

## API Reference

### UIFocusManager Methods

- `register(componentOrArray)` - Add component(s) to focus management
- `unregister(componentOrArray)` - Remove component(s) from focus management
- `setFocus(component)` - Set focus to specific component
- `clearFocus()` - Remove focus from all components
- `moveFocus(forward = true)` - Move focus forward/backward
- `focused` - Get currently focused component (getter)

### Focusable Component Properties

- `tabStopIndex` - Position in navigation order (-1 = not focusable)
- `isFocused` - Whether component currently has focus (getter)
- `focus()` - Give focus to component
- `loseFocus()` - Remove focus from component

## Examples in Test App

Check the `test App/` directory for complete working examples of focus management in action, including:

- Form navigation
- Menu systems
- Modal dialogs
- Complex UI layouts

## Related Components

- **UIButton**: Clickable buttons with focus support
- **UICheckbox**: Toggle checkboxes with focus support
- **UITextInput**: Text input fields with focus support
- **UIRadioGroup**: Radio button groups with focus support
- **UISlider**: Draggable sliders with focus support
