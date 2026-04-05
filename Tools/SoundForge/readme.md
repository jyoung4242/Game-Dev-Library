# SFXR ✦ ExcaliburJS Sound Forge

A modern web-based sound effects generator for creating retro-style game audio. Export your sounds directly for use with ExcaliburJS
games using the JSFXR plugin.

## Getting Started

### Running the App

1. **Open the app**: Simply open `index.html` in any modern web browser
2. **No installation required**: The app runs entirely in your browser with no dependencies
3. **Start creating**: The app comes pre-loaded with example sounds to get you started

## Creating and Managing Sounds

### Adding New Sounds

- **Click the "+" button** in the sidebar header to create a blank sound
- **Use Quick Presets** at the bottom of the sidebar for instant sound types:
  - `pickup` - Coin/item collection sounds
  - `laser` - Shooting/projectile effects
  - `explosion` - Destruction/impact sounds
  - `powerup` - Power-up/item activation
  - `jump` - Character movement
  - `hit` - Damage/hurt sounds

### Editing Sounds

1. **Select a sound** from the sidebar by clicking on it
2. **Name your sound** using the text input at the top of the editor
3. **Adjust parameters** using the sliders in different categories:
   - **Envelope**: Controls attack, sustain, punch, and decay
   - **Frequency**: Base frequency, limits, and ramps
   - **Vibrato**: Adds modulation effects
   - **Arpeggio**: Creates pitch sequences
   - **Duty**: Square wave pulse width modulation
   - **Repeat/Phaser**: Looping and phase effects
   - **Low-Pass Filter**: Frequency cutoff and resonance
   - **High-Pass Filter**: High frequency removal
   - **Volume**: Overall sound level

4. **Choose waveform type**:
   - ▫ Square - Classic chiptune sound
   - ◢ Sawtooth - Harsh, cutting tones
   - ∿ Sine - Smooth, pure tones
   - # Noise - Random/static effects

### Sound Controls

- **▶ Play**: Preview your sound in real-time
- **⟳ Randomize**: Generate completely random parameters
- **⊕ Duplicate**: Copy the current sound with a new name
- **↺ Reset**: Restore default parameters

### Managing Sound Library

- **Delete sounds**: Hover over a sound in the sidebar and click the ✕ button
- **Switch between sounds**: Click any sound name in the sidebar
- **Sound counter**: The header shows your total number of sounds

## Exporting Sounds

### Export Options

The app provides three export methods in the footer:

#### 1. JSON Export (⬇ JSON)

- Downloads a `sounds.json` file
- Contains all your sounds as raw parameter objects
- Useful for backup or manual processing

#### 2. TypeScript Export (⬇ sounds.ts)

- Downloads a `sounds.ts` file ready for ExcaliburJS
- Includes proper TypeScript types and imports
- Automatically formatted for immediate use

#### 3. Copy TypeScript (⧉ Copy TS)

- Copies the TypeScript code directly to your clipboard
- Same format as the download option
- Convenient for quick integration

### Exported File Structure

The exported `sounds.ts` file looks like this:

```typescript
import { SoundConfig } from "@excaliburjs/plugin-jsfxr";

export const sounds: { [key: string]: SoundConfig } = {};

sounds["pickup"] = {
  oldParams: true,
  wave_type: 1,
  p_env_attack: 0,
  p_env_sustain: 0.10232555866241455,
  p_env_punch: 0.228,
  p_env_decay: 0.19658660888671875,
  p_base_freq: 0.783,
  p_freq_limit: 0,
  p_freq_ramp: 0,
  p_freq_dramp: 0,
  p_vib_strength: 0,
  p_vib_speed: 0,
  p_arp_mod: 0,
  p_arp_speed: 0,
  p_duty: 0,
  p_duty_ramp: 0,
  p_repeat_speed: 0,
  p_pha_offset: 0,
  p_pha_ramp: 0,
  p_lpf_freq: 1,
  p_lpf_ramp: 0,
  p_lpf_resonance: 0,
  p_hpf_freq: 0,
  p_hpf_ramp: 0,
  sound_vol: 0.25,
  sample_rate: 44100,
  sample_size: 8,
};

// Additional sounds...
```

## Using Sounds in ExcaliburJS

### Installation

First, install the JSFXR plugin for ExcaliburJS:

```bash
npm install @excaliburjs/plugin-jsfxr
```

### Basic Setup

1. **Import the plugin and your sounds**:

```typescript
import { Engine } from "excalibur";
import { JSFXRPlugin } from "@excaliburjs/plugin-jsfxr";
import { sounds } from "./sounds"; // Your exported sounds.ts file
```

2. **Initialize the plugin**:

```typescript
const game = new Engine({
  // your game config
});

// Add the JSFXR plugin
const sfxPlugin = new JSFXRPlugin();
game.addPlugin(sfxPlugin);
```

3. **Load your sound configurations**:

```typescript
// Load all sounds from your exported file
Object.entries(sounds).forEach(([name, config]) => {
  sfxPlugin.loadSound(name, config);
});
```

### Playing Sounds

Once loaded, play sounds anywhere in your game:

```typescript
// Play a sound by name
sfxPlugin.playSound("pickup");

// Play with volume control
sfxPlugin.playSound("laser", { volume: 0.8 });

// Play with pitch variation
sfxPlugin.playSound("jump", { pitch: 1.2 });
```

### Advanced Usage

#### Sound Variations

Create dynamic sound variations:

```typescript
// Random pitch variation for footsteps
const playFootstep = () => {
  const pitch = 0.8 + Math.random() * 0.4; // 0.8 to 1.2
  sfxPlugin.playSound("step", { pitch });
};
```

#### Sound Effects on Events

```typescript
class Player extends Actor {
  onCollisionStart(collision) {
    if (collision.other instanceof Enemy) {
      sfxPlugin.playSound("hit");
      this.takeDamage();
    } else if (collision.other instanceof Coin) {
      sfxPlugin.playSound("pickup");
      this.collectCoin();
    }
  }

  jump() {
    sfxPlugin.playSound("jump");
    // jump logic...
  }
}
```

#### UI Sound Effects

```typescript
class Menu extends Scene {
  onInitialize() {
    const playButton = new Button({
      // button config
      onClick: () => {
        sfxPlugin.playSound("click");
        // start game...
      },
    });
  }
}
```

### Sound Parameters

The JSFXR plugin supports runtime parameter modification:

```typescript
// Play with custom parameters
sfxPlugin.playSound("explosion", {
  volume: 1.0, // 0.0 to 1.0
  pitch: 1.0, // 0.5 to 2.0 (pitch multiplier)
  pan: 0.0, // -1.0 to 1.0 (left to right)
  loop: false, // true for looping sounds
});
```

## Tips and Best Practices

### Sound Design

- **Start with presets**: Use the built-in presets as a foundation, then tweak parameters
- **Use the waveform preview**: The visual waveform helps you understand your sound's shape
- **Experiment with combinations**: Try different filter settings with various waveforms
- **Save frequently**: Use the export functions to backup your work

### Performance

- **Keep sound count reasonable**: Too many sounds loaded simultaneously can impact performance
- **Use appropriate volumes**: Balance your sound levels in the app before export
- **Consider file size**: Exported TypeScript files are small and efficient

### Game Integration

- **Organize sounds logically**: Group related sounds (UI, gameplay, ambient)
- **Use consistent naming**: Follow a naming convention like `sfx_ui_click`, `sfx_game_jump`
- **Test on target devices**: Different devices may render sounds differently
- **Provide fallbacks**: Consider having audio alternatives for users without sound

## Troubleshooting

### Sounds Not Playing

- Check browser audio permissions
- Ensure the JSFXR plugin is properly initialized
- Verify sound names match exactly (case-sensitive)
- Check browser console for errors

### Export Issues

- Make sure you have download permissions in your browser
- For clipboard copy, ensure you have clipboard permissions
- Check that you have sounds created before exporting

### Audio Quality

- Sounds are generated at 44.1kHz 8-bit by default
- For higher quality, modify the `sample_rate` and `sample_size` parameters
- Different browsers may render the same parameters slightly differently

## Keyboard Shortcuts

- **Space**: Play selected sound
- **Enter**: When editing sound name, confirm changes
- **Escape**: Cancel sound name editing

## Browser Compatibility

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Examples

### Complete Game Audio Setup

```typescript
// sounds.ts (exported from Sound Forge)
import { SoundConfig } from "@excaliburjs/plugin-jsfxr";

export const sounds: { [key: string]: SoundConfig } = {};

sounds["jump"] = {
  /* jump sound config */
};
sounds["coin"] = {
  /* coin sound config */
};
sounds["hit"] = {
  /* hit sound config */
};

// game.ts
import { Engine, Scene, Actor } from "excalibur";
import { JSFXRPlugin } from "@excaliburjs/plugin-jsfxr";
import { sounds } from "./sounds";

const game = new Engine({
  /* config */
});
const sfx = new JSFXRPlugin();
game.addPlugin(sfx);

// Load all sounds
Object.entries(sounds).forEach(([name, config]) => {
  sfx.loadSound(name, config);
});

// Use in game logic
class Player extends Actor {
  jump() {
    sfx.playSound("jump");
    // physics...
  }

  collectCoin() {
    sfx.playSound("coin");
    // scoring...
  }
}
```

---

**Sound Forge** - Create retro game audio with modern web technology

**ExcaliburJS + JSFXR Plugin** - Seamless integration for game development</content> <parameter name="filePath">c:\programming\GDL Jsfr
plugin\GDL sound forge\README.md
