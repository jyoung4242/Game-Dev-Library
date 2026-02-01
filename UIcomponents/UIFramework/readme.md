# Excalibur UI Framework

![ss](./ss.png)

A comprehensive UI component library for [Excalibur.js](https://excaliburjs.com/), providing interactive and accessible UI elements for
game development.

## Features

- **Full Excalibur Integration**: Built specifically for Excalibur.js game engine
- **Interactive Components**: Buttons, panels, sliders, checkboxes, text inputs, and more
- **Keyboard Navigation**: Full keyboard and focus management support
- **Customizable Theming**: Extensive color and styling options
- **TypeScript Support**: Fully typed for better development experience
- **Event-Driven**: Rich event system for component interactions
- **Accessibility**: Visual focus indicators, tab navigation, and keyboard activation (Enter/Space)

## Components

### Input Components

- [UIButton](./UIButton/readme.md)
- [UISlider](./UISlider/readme.md)
- [UISwitch](./UISwitch/readme.md)
- [UITextInput](./UITextBox/readme.md)
- [UICheckbox](./UICheckbox/readme.md)
- [UIRadioGroup](./UIRadioButton/readme.md)
- [UINumeric](./UINumeric/readme.md)

### Display Components

- [UILabel](./UILabel/readme.md)
- [UIImage](./UIImage/readme.md)
- [UIProgressBar](./UIProgress/readme.md)

### Layout Components

- [UIPanel](./UIPanel/readme.md)
- [UITabbedPanel](./UITabbedPanel/readme.md)

### Systems

- [UIFocusManager](./UIFocusManager/readme.md)

## Installation

This isn't published to npm.

In the repo just pull down the `./excalibur-ui/Components` folder and include as such:

```ts
import { UIButton, UIPanel } from "./Components";
```

## Quick Start

```typescript
import { Engine, vec, Color } from "excalibur";
import { UIButton, UIPanel } from "./Components";

const engine = new Engine();

// Create a panel
const panel = new UIPanel({
  name: "mainPanel",
  width: 300,
  height: 200,
  pos: vec(100, 100),
  colors: {
    backgroundStarting: Color.LightGray,
  },
});

// Create a button
const button = new UIButton({
  name: "myButton",
  width: 100,
  height: 50,
  pos: vec(150, 150),
  idleText: "Click Me!",
  callback: () => console.log("Button clicked!"),
});

// Add to engine
engine.add(panel);
engine.add(button);

engine.start();
```

### Keyboard Navigation

```ts
import { UIFocusManager } from "./Components";

const focusManager = new UIFocusManager();
focusManager.register(button, slider, input);
focusManager.setFocus(button); // sets initial focus state
focusManager.moveFocus(); // moves to next tab Index
```

## Documentation

### Component Configuration

Each component accepts a configuration object with common properties:

- `name`: Component identifier
- `width/height`: Dimensions
- `pos`: Position vector
- `z`: Z-index for layering
- `colors`: Color scheme configuration
- `tabStopIndex`: Keyboard navigation order

### Events

Components emit various events you can listen to:

```typescript
button.emitter.on("UIButtonClicked", event => {
  console.log("Button was clicked!");
});
```

### Theming

Components support extensive theming through color configurations:

```typescript
const button = new UIButton({
  colors: {
    mainStarting: Color.Blue,
    hoverStarting: Color.LightBlue,
    disabledStarting: Color.Gray,
  },
});
```

## Examples

Check out the `/test App/` directory for comprehensive examples showing all components in action.

## Development

### Building

```bash
npm run build
```

### Running Examples

```bash
cd "./test App/"
npm install
npm run dev
```

## Contributing

Contributions are welcome! Please feel free to submit issues and pull requests.

## License

MIT License

## Dependencies

- [Excalibur.js](https://excaliburjs.com/) ^0.32.0
- [canvas-txt](https://github.com/georgedoescode/canvas-txt) ^4.1.1

> ⚠️ This project is under active development. APIs may change before v1.0.
