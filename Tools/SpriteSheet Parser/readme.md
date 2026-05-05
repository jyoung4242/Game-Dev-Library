# SpriteSheetParser

A small browser-based sprite sheet parsing tool that generates ExcaliburJS-compatible TypeScript code.

## Overview

`SpriteSheetParser` is a single-page HTML app that helps you parse sprite sheets, preview individual sprite frames, and generate
ExcaliburJS `SpriteSheet.fromImageSource` code.

## Features

- Drag-and-drop or browse for a sprite sheet image
- Preview parsed sprite tiles with optional grid overlay and index labels
- Configure rows, columns, sprite width/height, origin offset, and margin spacing
- Auto-calculate sprite dimensions or grid size from the loaded image
- Validate grid configuration against the image size
- Copy generated TypeScript code to clipboard
- Download the generated `.ts` file

## Usage

1. Open `index.html` in your browser.
2. Drop a sprite sheet image onto the app or click the drop zone to select a file.
3. Adjust the following values as needed:
   - `Rows`
   - `Columns`
   - `Sprite W`
   - `Sprite H`
   - `Offset X` / `Offset Y`
   - `Margin X` / `Margin Y`
4. Use the preview tools to toggle the grid overlay and index labels.
5. Copy the generated code or download it as `spritesheet.ts`.

## Generated ExcaliburJS Code

The app generates TypeScript code using the ExcaliburJS sprite sheet API:

```ts
const mySpriteSheet = SpriteSheet.fromImageSource({
  image: myImage,
  grid: {
    rows: <rows>,
    columns: <cols>,
    spriteWidth: <sw>,
    spriteHeight: <sh>,
  },
  spacing: {
    margin: { x: <mx>, y: <my> },
    originOffset: { x: <ox>, y: <oy> },
  },
});
```

Spacing is included only when origin offset or margin values are non-zero.

## Notes

- The app supports common image formats such as PNG, GIF, and WEBP.
- If the configured grid extends beyond the image boundaries, the app shows validation errors.
- This is a standalone static HTML tool; no build step or server is required.

## License

Use freely as needed.
