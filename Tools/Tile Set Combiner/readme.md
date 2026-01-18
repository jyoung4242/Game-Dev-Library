# Tileset Consolidator Tool

A web-based utility for combining multiple tileset images into a single consolidated tileset. Perfect for game developers who need to organize scattered tile graphics into a unified spritesheet.

## Features

- **Multi-Tileset Import**: Load multiple tileset images at once
- **Interactive Selection**: Zoom and drag-select tile regions from source tilesets
- **Visual Preview**: See selected tile groups before consolidation
- **Flexible Layout**: Configure output columns to organize your final tileset
- **Reorderable Groups**: Rearrange selected tile groups in any order
- **PNG Export**: Download your consolidated tileset as a PNG file
- **Auto Tile Detection**: Automatically detects tile sizes (8, 16, 24, 32, 48, 64 pixels)

## How to Use

1. **Open the Tool**: Open `index.html` in a web browser
2. **Load Tilesets**: Click "Add" to select one or more tileset PNG files
3. **Select Tiles**: 
   - Zoom in/out using the zoom slider or Ctrl+scroll
   - Click and drag to select rectangular regions of tiles
   - Selected regions are highlighted in blue
4. **Preview Consolidation**: See all selected tile groups on the right side
5. **Arrange Groups**: Use arrow buttons (← →) to reorder tile groups
6. **Configure Output**: Adjust the "Columns" value to control the width of your final tileset
7. **Export**: Click "Export PNG" to download your consolidated tileset

## Controls

### Zoom Controls
- **Slider**: Use the zoom slider to adjust magnification (0.25× to 6×)
- **Ctrl+Scroll**: Hold Ctrl and scroll with mouse wheel to zoom

### Tile Selection
- **Click & Drag**: Select a rectangular region of tiles
- **Yellow Outline**: Shows the current selection before committing
- **Blue Highlight**: Shows committed selections

### Group Management
- **← Button**: Move group left in the consolidation
- **→ Button**: Move group right in the consolidation
- **✕ Button**: Remove group from consolidation

## Specifications

- **Supported Formats**: PNG, JPEG, and other standard image formats
- **Tile Size Detection**: Auto-detects from 8px to 64px square tiles
- **Output Format**: PNG with pixel-perfect rendering
- **Default Tile Size**: 32×32 pixels (configurable per tileset)

## Technical Details

Built with:
- **React 18** for UI state management
- **Tailwind CSS** for styling
- **HTML5 Canvas** for image manipulation and rendering
- **Babel** for JSX transformation in the browser

## Tips

- Ensure all your source tilesets use the same tile size for best results
- You can load tilesets incrementally (add more files after consolidation starts)
- Arrange your groups in the order you want them in the final tileset
- The tool automatically handles tile alignment and placement
