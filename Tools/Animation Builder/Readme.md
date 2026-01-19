# Excalibur Animation Builder (v2)

A web-based tool for creating and managing spritesheets and animations for [ExcaliburJS](https://excaliburjs.com/). This tool provides
an intuitive interface to parse spritesheets, define animations, and generate production-ready TypeScript code for your Excalibur
games.

## Features

- **Grid-Based Parsing**: Automatically parse regular spritesheets using grid configuration
- **Manual Frame Definition**: Build out SourceViews manually for irregular or custom frame layouts
- **Per-Frame Flipping**: Apply horizontal/vertical flips to individual frames
- **Per-Animation Flipping**: Set default flip behavior for entire animations
- **Animation Creation**: Define animations with multiple frames, custom durations, and loop strategies
- **Live Preview**: Preview animations in real-time with proper scaling and rendering
- **Multiple Loop Strategies**: Support for `Freeze`, `End`, `Loop`, and `PingPong` animation modes
- **TypeScript Code Generation**: Automatically generates Excalibur-ready TypeScript code
- **Code Preview**: Live code preview with copy/paste functionality
- **Canvas Zoom**: Zoom in/out on spritesheets for precise frame definition (0.25x - 8x)
- **Default Frame Duration**: Set a default frame duration that applies to new frames
- **ExcaliburJS Ready**: Export production-ready code with proper Excalibur types and imports

## Usage Guide

### 1. Load Your Spritesheet

Click the **Load Spritesheet** button and select your spritesheet image. The image will be displayed on the canvas with dimensions
shown.

### 2. Parse Frames

Choose one of two parsing modes:

#### Grid Mode

For spritesheets with uniform, regularly-spaced frames:

1. Click **Grid-Based** button
2. Configure the grid settings:
   - **Sprite Width/Height**: Size of individual sprite frames (e.g., 32x32)
   - **Rows/Columns**: Grid dimensions (e.g., 4 rows × 4 columns)
   - **Origin Offset**: Starting position of the first frame (x, y offset from top-left)
   - **Margin**: Space between frames if present (x and y margin values)

The grid mode automatically creates frame definitions based on your configuration. Frames are displayed on the canvas as green
rectangles with index numbers.

#### Irregular (Manual) Mode

For spritesheets with non-uniform or custom frame layouts:

1. Click **Irregular (Manual)** button
2. Under **Source Views** section, click the **+** button to add frames
3. For each frame, manually configure:
   - **X/Y**: Position of the frame in the spritesheet
   - **W/H**: Width and height of the frame
4. Click on a source view to select it for editing (highlighted in blue)
5. Delete frames using the trash icon

Manual frames are numbered sequentially (0, 1, 2...) and displayed on the canvas in green. Use the zoom controls to precisely define
frame boundaries.

### 3. Canvas Controls

- **Zoom Controls**: Use the zoom buttons to scale the canvas (0.25x to 8x)
  - **−** button: Zoom out by 25%
  - **+** button: Zoom in by 25%
  - **Reset** button: Return to 100% zoom
- **Frame Selection**: Click on any frame to add it to the selected animation (when an animation is selected)

### 4. Create Animations

1. In the right panel under **Animations**, set your **Group Name** (used for the exported export object)
2. Set the **Default Duration** in milliseconds (applied to new frames automatically)
3. Click **New Animation** to create an animation
4. A new animation card appears with:
   - **Name field**: Edit the animation name (e.g., "walk", "idle", "jump")
   - **Loop Strategy dropdown**: Choose how the animation behaves:
     - **Loop**: Animation repeats indefinitely
     - **PingPong**: Animation plays forward then backward
     - **Freeze**: Animation stops and holds on the last frame
     - **End**: Animation plays once and stops
   - **Flip H/V checkboxes**: Apply flipping to the entire animation at runtime

### 5. Add Frames to Animations

1. Select an animation by clicking on it
2. The spritesheet canvas will show helpful text: "Click a frame to add it to the selected animation"
3. Click on frames in the spritesheet to add them to the animation in sequence
4. Frames appear in the "Frames" section with:
   - **Frame Index**: Which sprite frame this refers to
   - **Flip H/V**: Per-frame flipping toggles
   - **Duration field**: Frame duration in milliseconds (e.g., 100ms for 10 FPS)
   - **Trash icon**: Remove frame from animation

### 6. Preview Your Animation

- Select an animation from the list
- The preview panel appears below the spritesheet
- Click **Play** to start the animation
- Click **Pause** to pause playback
- Click **Restart** to reset to the first frame
- The preview renders at 4x scale for visibility

### 7. Generate and Export Code

1. Configure the **Image Path** field (e.g., `/sprites/character.png` for Vite public folder)
2. Click **Download TypeScript** to save the generated code as a `.ts` file
3. View the **Generated Code Preview** to see the TypeScript code before downloading

The exported code includes:

- Proper Excalibur imports (`ImageSource`, `SpriteSheet`, `Animation`, `AnimationStrategy`)
- Spritesheet loading and initialization
- All animation definitions with proper frame graphics and durations
- Per-frame flip handling for individual frames
- Per-animation flip handling for runtime flipping
- Export object with all animations for easy importing into your game code

## TypeScript Code Generation

The tool generates clean, production-ready TypeScript code structured as follows:

```typescript
import { ImageSource, SpriteSheet, Animation, AnimationStrategy } from "excalibur";

// 1. Load image
const imageSource = new ImageSource("/sprites/character.png");
await imageSource.load();

// 2. Create spritesheet (grid or sourceviews)
const spriteSheet = SpriteSheet.fromImageSource({
  image: imageSource,
  grid: { rows: 4, columns: 4, spriteWidth: 32, spriteHeight: 32 },
});

// 3. Define frame graphics with optional flipping
const Walk_Frame0Graphic = spriteSheet.sprites[0];
// ... more frame definitions

// 4. Define animations
const Walk = new Animation({
  frames: [
    { graphic: Walk_Frame0Graphic, duration: 100 },
    { graphic: Walk_Frame1Graphic, duration: 100 },
    // ... more frames
  ],
  strategy: AnimationStrategy.Loop,
});

// 5. Export for use in your game
export const PlayerAnimations = {
  Walk,
  // ... more animations
};
```

## Tips for Best Results

- **Frame Uniformity**: For grid mode, ensure all frames are the same size with consistent spacing
- **Origin Offset**: The origin offset is crucial for aligning the first frame correctly in grid mode
- **Margin Spacing**: Only set margin values if there's actual space between frames in your spritesheet
- **Frame Numbering**: Frames are numbered left-to-right, top-to-bottom in grid mode
- **Default Duration**: Set this before adding frames to avoid setting each frame individually
- **Per-Frame Flipping**: Use per-frame flips for asymmetrical animations or one-directional assets
- **Per-Animation Flipping**: Use animation-level flips for symmetrical assets to reduce sprite duplication
- **Image Path**: Use relative paths for Vite (e.g., `/assets/sprites.png`) or your bundler's public folder
- **Backup Exports**: Save generated code to version control regularly

## Keyboard & Mouse Tips

- **Canvas Clicking**: Click frames to add them to the selected animation (source view mode with animation selected)
- **Source View Selection**: Click on a source view in the panel to select it for editing
- **Drag & Edit**: Zoom in on the canvas before defining irregular frames for better precision

## Troubleshooting

**Frames not appearing on canvas**

- Ensure your image has fully loaded (you should see image dimensions)
- For grid mode, check that grid dimensions don't exceed your spritesheet size
- Ensure rows × columns results in the correct number of frames for your layout

**Animation preview is black**

- Make sure the animation has at least one frame
- Check that all frame indices reference valid parsed frames
- Ensure frame durations are set (should not be 0)

**Generated code has incorrect image path**

- Update the "Image Path" field before downloading
- For Vite, use paths relative to the `/public` folder
- For other bundlers, adjust based on your asset folder structure

**Flip not working as expected**

- Per-frame flips are applied before per-animation flips
- Test in your Excalibur game to ensure the flipping aligns with your needs

## Technologies

- **React 19** - UI framework
- **TypeScript** - Type-safe development
- **Vite** - Build tool and dev server
- **Lucide React** - UI icons

## License

MIT

1. Enter an **Animation Group Name** (e.g., 'PlayerAnimations', 'NPCanimations', 'EnemyAnimations')

- adjust default duration if desired (in milliseconds)

2. Click **New Animation**
3. Select the animation from the list
4. Click **Add Frame** to add frames in sequence
5. For each frame:
   - Select the **Frame Index** from your parsed frames
   - Set the **Frame Duration** in milliseconds (e.g., 100ms for 10 FPS)
6. Set the **Loop Strategy**:
   - **Loop**: Animation repeats indefinitely
   - **PingPong**: Animation plays forward then backward
   - **Freeze**: Animation stops on the last frame
   - **End**: Animation plays once and stops

### 4. Preview Your Animation

- Select an animation from the list
- Click **Play** to preview
- Use **Pause** and **Reset** controls
- Adjust playback speed with the speed slider (0.25x to 2x)

### 5. Export Configuration

Click **Download Configuration** to export a JSON file containing:

- All frame definitions
- Animation configurations
- Animation group name (customizable at the top)

## Integration with ExcaliburJS

Once you've exported your configuration, you can use it in your Excalibur game:

```typescript
import animationConfig from "./animations.json";

// Create a spritesheet in Excalibur
const spritesheet = new ex.SpriteSheet({
  image: spriteImage,
  spriteDimensions: {
    width: 32,
    height: 32,
  },
  rows: animationConfig.rows,
  columns: animationConfig.columns,
});

// Define animations from your configuration
const animations: Record<string, ex.Animation> = {};

for (const anim of animationConfig.animations) {
  animations[anim.name] = spritesheet.getAnimation({
    frameOffset: anim.frames[0].frameIndex,
    frameCount: anim.frames.length,
    frameDuration: anim.frames[0].duration,
    loopStrategy: ex[anim.loopStrategy],
  });
}
```

## Tips for Best Results

- **Frame Uniformity**: For grid mode, ensure all frames are the same size with consistent spacing
- **Frame Ordering**: Number frames left-to-right, top-to-bottom in your spritesheet
- **Duration Testing**: Start with 100ms (10 FPS) and adjust based on your desired animation speed
- **Animation Names**: Use clear, descriptive names for animations (e.g., "idle_left", "walk_right")
- **Backup Exports**: Save your configuration files regularly for backup and version control

## File Management

- **Save Configuration**: Use the download button to save your animation config as JSON
- **Load Configuration**: Use the upload button to load a previously saved configuration
- **Load Spritesheet**: Upload a new spritesheet at any time; your animation definitions will remain

## Troubleshooting

**Frames not appearing on canvas**

- Ensure your image has loaded completely
- Check that grid dimensions don't exceed your spritesheet size

**Animation plays incorrectly**

- Verify frame indices are within the range of parsed frames
- Check that frame durations are in milliseconds
- Confirm the loop strategy matches your intended behavior

**Export file is empty**

- Ensure you've created at least one animation
- Add frames to your animations before exporting

## Technologies

- **React 19** - UI framework
- **TypeScript** - Type-safe development
- **Vite** - Build tool
- **Lucide React** - Icons

## License

MIT

```

```
