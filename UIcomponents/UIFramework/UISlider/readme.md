# UISlider

![ss](./ss.png)

Interactive slider components for the Excalibur UI Framework that allow users to select numeric values within a range through
mouse/touch dragging or keyboard navigation.

## Slider Types

### Standard Slider (UISlider)

A procedurally rendered slider with customizable colors, track radius, and knob styling. Perfect for settings menus and value
selection.

### Sprite Slider (UISpriteSlider)

A sprite-based slider that uses images for visual representation, allowing for themed or artistic slider controls.

## Quick Start

```typescript
import { UISlider, Color } from "excalibur-ui";

// Create a volume slider
const volumeSlider = new UISlider({
  width: 200,
  height: 24,
  pos: vec(100, 100),
  min: 0,
  max: 100,
  value: 75,
  step: 5,
  colors: {
    track: Color.DarkGray,
    fill: Color.Green,
    knob: Color.White,
  },
});

engine.add(volumeSlider);

// Listen for value changes
volumeSlider.emitter.on("UISliderChanged", event => {
  console.log(`Volume: ${event.value}%`);
  setGameVolume(event.percent);
});
```

## Features

- **Dual Rendering Modes**: Procedural colors or sprite-based graphics
- **Orientation Support**: Horizontal and vertical sliders
- **Precise Value Control**: Min/max ranges with step increments
- **Multiple Input Methods**: Mouse/touch dragging and keyboard navigation
- **Focus Management**: Visual focus indicators and keyboard accessibility
- **Event System**: Comprehensive events for all interactions
- **Accessibility**: Tab navigation and keyboard support
- **Performance Optimized**: Efficient canvas-based rendering

## Basic Usage

### Horizontal Slider

```typescript
const brightnessSlider = new UISlider({
  name: "brightness",
  width: 300,
  height: 30,
  pos: vec(50, 50),
  min: 0,
  max: 255,
  value: 128,
  step: 1,
  orientation: "horizontal",
  trackRadius: 8,
  knobRadius: 12,
  colors: {
    track: Color.fromHex("#333333"),
    fill: Color.fromHex("#FFD700"),
    knob: Color.White,
  },
});
```

### Vertical Slider

```typescript
const speedSlider = new UISlider({
  name: "speed",
  width: 24,
  height: 150,
  pos: vec(400, 100),
  orientation: "vertical",
  min: 1,
  max: 10,
  value: 5,
  colors: {
    track: Color.DarkGray,
    fill: Color.Blue,
    knob: Color.White,
  },
});
```

### Sprite-Based Slider

```typescript
const spriteSlider = new UISpriteSlider({
  name: "customSlider",
  width: 250,
  height: 20,
  pos: vec(100, 200),
  sprites: {
    track: sliderTrackSprite,
    fill: sliderFillSprite,
    knob: sliderKnobSprite,
    border: sliderBorderSprite,
  },
  min: 0,
  max: 100,
  value: 50,
});
```

## Value Management

### Setting Values Programmatically

```typescript
// Direct value assignment (auto-clamped and stepped)
slider.value = 75;

// Set to extremes
slider.value = slider.getMin(); // Minimum value
slider.value = slider.getMax(); // Maximum value

// Increment/decrement
slider.value += 10;
slider.value -= 5;
```

### Range Configuration

```typescript
// Set range limits
slider.setMin(0);
slider.setMax(1000);

// Set both min and max
slider.setRange(-50, 50);

// Change step size
slider.setStep(0.1); // For decimal values
```

### Reading Values

```typescript
// Current value
const current = slider.value;

// Percentage (0.0 to 1.0)
const percent = slider.percent;

// Formatted display
const displayValue = `${slider.value} / ${slider.getMax()}`;
const percentText = `${Math.round(slider.percent * 100)}%`;
```

## Input Handling

### Mouse/Touch Interaction

Sliders automatically handle pointer events:

- **Click**: Instantly sets value to clicked position
- **Drag**: Smooth value changes while dragging
- **Release**: Ends dragging operation

```typescript
// Listen to pointer events
slider.emitter.on("UISliderDown", event => {
  console.log("Slider interaction started");
});

slider.emitter.on("UISliderUp", event => {
  console.log("Slider interaction ended");
});
```

### Keyboard Navigation

When focused, sliders support arrow key navigation:

- **Left/Up arrows**: Decrease value
- **Right/Down arrows**: Increase value
- **Tab**: Navigate between focusable elements

```typescript
// Focus management
slider.focus(); // Give keyboard focus
slider.loseFocus(); // Remove keyboard focus

// Check focus state
if (slider.isFocused) {
  console.log("Slider has keyboard focus");
}
```

## Event Handling

### Value Change Events

```typescript
slider.emitter.on("UISliderChanged", event => {
  console.log("Value changed:");
  console.log("  New value:", event.value);
  console.log("  Percentage:", Math.round(event.percent * 100) + "%");
  console.log("  Slider:", event.target.name);

  // Apply the change
  updateGameSetting(event.target.name, event.value);
});
```

### Focus Events

```typescript
slider.emitter.on("UISliderFocused", event => {
  console.log("Slider gained focus");
  // Show focus styling or help text
});

slider.emitter.on("UISliderUnfocused", event => {
  console.log("Slider lost focus");
  // Hide focus styling
});
```

### State Events

```typescript
slider.emitter.on("UISliderEnabled", event => {
  console.log("Slider is now enabled");
});

slider.emitter.on("UISliderDisabled", event => {
  console.log("Slider is now disabled");
});
```

## Advanced Examples

### Volume Control with Audio Feedback

```typescript
class VolumeControl {
  private slider: UISlider;
  private audioContext: AudioContext;

  constructor() {
    this.slider = new UISlider({
      name: "volume",
      width: 200,
      height: 24,
      pos: vec(100, 100),
      min: 0,
      max: 100,
      value: 50,
      colors: {
        track: Color.DarkGray,
        fill: Color.Green,
        knob: Color.White,
      },
    });

    this.slider.emitter.on("UISliderChanged", event => {
      this.setVolume(event.percent);
      this.playTestSound();
    });
  }

  private setVolume(percent: number) {
    // Set master volume
    Howler.volume(percent);
  }

  private playTestSound() {
    // Play a short test tone
    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(this.audioContext.destination);

    oscillator.frequency.setValueAtTime(440, this.audioContext.currentTime);
    gainNode.gain.setValueAtTime(0.1, this.audioContext.currentTime);

    oscillator.start();
    oscillator.stop(this.audioContext.currentTime + 0.1);
  }
}
```

### Multi-Slider Audio Equalizer

```typescript
class AudioEqualizer {
  private sliders: UISlider[] = [];
  private frequencyBands = [60, 170, 310, 600, 1000, 3000, 6000, 12000];

  constructor() {
    this.frequencyBands.forEach((freq, index) => {
      const slider = new UISlider({
        name: `eq_${freq}hz`,
        width: 20,
        height: 100,
        pos: vec(50 + index * 30, 50),
        orientation: "vertical",
        min: -20,
        max: 20,
        value: 0,
        step: 0.5,
        colors: {
          track: Color.DarkGray,
          fill: Color.Cyan,
          knob: Color.White,
        },
      });

      slider.emitter.on("UISliderChanged", event => {
        this.updateEqualizer(freq, event.value);
      });

      this.sliders.push(slider);
    });
  }

  private updateEqualizer(frequency: number, gain: number) {
    // Apply equalizer settings
    console.log(`Setting ${frequency}Hz to ${gain}dB`);
    // audioEngine.setEQBand(frequency, gain);
  }

  getSettings(): number[] {
    return this.sliders.map(slider => slider.value);
  }

  reset() {
    this.sliders.forEach(slider => (slider.value = 0));
  }
}
```

### Slider with Value Display

```typescript
class SliderWithDisplay {
  private slider: UISlider;
  private valueLabel: UILabel;

  constructor() {
    this.slider = new UISlider({
      width: 200,
      height: 24,
      pos: vec(100, 100),
      min: 0,
      max: 100,
      value: 50,
    });

    this.valueLabel = new UILabel({
      text: "50",
      pos: vec(320, 100),
      textOptions: { color: Color.White },
    });

    this.slider.emitter.on("UISliderChanged", event => {
      this.valueLabel.text = event.value.toString();
    });
  }

  show() {
    engine.add(this.slider);
    engine.add(this.valueLabel);
  }

  hide() {
    engine.remove(this.slider);
    engine.remove(this.valueLabel);
  }
}
```

### Animated Slider Value Changes

```typescript
class AnimatedSlider {
  private slider: UISlider;
  private targetValue = 0;
  private currentValue = 0;
  private animating = false;

  constructor() {
    this.slider = new UISlider({
      width: 200,
      height: 24,
      pos: vec(100, 100),
      min: 0,
      max: 100,
      value: 0,
    });
  }

  // Smoothly animate to a target value
  animateTo(target: number) {
    this.targetValue = Math.max(this.slider.getMin(), Math.min(target, this.slider.getMax()));

    if (!this.animating) {
      this.animate();
    }
  }

  private animate() {
    this.animating = true;

    const animate = () => {
      const diff = this.targetValue - this.currentValue;
      const step = diff * 0.1; // Smooth interpolation

      if (Math.abs(step) < 0.1) {
        this.slider.value = this.targetValue;
        this.currentValue = this.targetValue;
        this.animating = false;
        return;
      }

      this.currentValue += step;
      this.slider.value = Math.round(this.currentValue);

      requestAnimationFrame(animate);
    };

    requestAnimationFrame(animate);
  }

  // Example usage
  setHealth(health: number) {
    this.animateTo(health);
  }
}
```

### Slider Group with Master Control

```typescript
class SliderGroup {
  private masterSlider: UISlider;
  private childSliders: UISlider[] = [];
  private linked = true;

  constructor() {
    // Master volume slider
    this.masterSlider = new UISlider({
      name: "masterVolume",
      width: 200,
      height: 24,
      pos: vec(50, 50),
      min: 0,
      max: 100,
      value: 80,
    });

    // Individual channel sliders
    const channels = ["Left", "Center", "Right"];
    channels.forEach((channel, index) => {
      const slider = new UISlider({
        name: `${channel.toLowerCase()}Volume`,
        width: 150,
        height: 20,
        pos: vec(100, 100 + index * 30),
        min: 0,
        max: 100,
        value: 80,
      });

      this.childSliders.push(slider);
    });

    // Link master to children
    this.masterSlider.emitter.on("UISliderChanged", event => {
      if (this.linked) {
        const ratio = event.percent;
        this.childSliders.forEach(slider => {
          slider.value = slider.getMax() * ratio;
        });
      }
    });
  }

  toggleLink() {
    this.linked = !this.linked;
  }

  getMasterVolume(): number {
    return this.masterSlider.percent;
  }

  getChannelVolumes(): number[] {
    return this.childSliders.map(slider => slider.percent);
  }
}
```

## Configuration Reference

### Common Properties

- `width`, `height`: Slider dimensions
- `pos`: Position vector
- `min`, `max`: Value range (default: 0-100)
- `value`: Initial value
- `step`: Increment size (default: 1)
- `orientation`: "horizontal" or "vertical"
- `tabStopIndex`: Keyboard navigation order

### UISlider Specific

- `trackRadius`: Corner radius for track
- `knobRadius`: Radius of draggable knob
- `colors`: Color configuration object
- `focusIndicator`: Position of focus dot

### UISpriteSlider Specific

- `sprites`: Sprite configuration object with track/fill/knob/border

## Visual Customization

### Color Themes

```typescript
// Modern dark theme
const darkTheme = {
  track: Color.fromHex("#2c3e50"),
  fill: Color.fromHex("#3498db"),
  knob: Color.fromHex("#ecf0f1"),
};

// Retro theme
const retroTheme = {
  track: Color.fromHex("#333333"),
  fill: Color.fromHex("#ff6b35"),
  knob: Color.fromHex("#f7f3e9"),
};

// Nature theme
const natureTheme = {
  track: Color.fromHex("#8b7355"),
  fill: Color.fromHex("#4a7c59"),
  knob: Color.fromHex("#f4e4bc"),
};
```

### Sprite Configuration

```typescript
const customSprites = {
  track: new Sprite({ image: trackImage, destSize: { width: 200, height: 20 } }),
  fill: new Sprite({ image: fillImage, destSize: { width: 200, height: 20 } }),
  knob: new Sprite({ image: knobImage, destSize: { width: 24, height: 24 } }),
  border: new Sprite({ image: borderImage, destSize: { width: 200, height: 20 } }),
};
```

## API Reference

### Properties

- `value: number` - Current slider value
- `percent: number` - Value as decimal (0.0-1.0)
- `isFocused: boolean` - Focus state
- `eventEmitter: EventEmitter` - Event system access

### Methods

- `setMin(min: number)` - Set minimum value
- `setMax(max: number)` - Set maximum value
- `setRange(min: number, max: number)` - Set value range
- `setStep(step: number)` - Set step increment
- `getMin(): number` - Get minimum value
- `getMax(): number` - Get maximum value
- `getStep(): number` - Get step increment
- `focus()` - Give keyboard focus
- `loseFocus()` - Remove keyboard focus

### Events

- `UISliderChanged` - Value changed
- `UISliderFocused` - Gained focus
- `UISliderUnfocused` - Lost focus
- `UISliderEnabled` - Component enabled
- `UISliderDisabled` - Component disabled
- `UISliderDown` - Pointer pressed
- `UISliderUp` - Pointer released
