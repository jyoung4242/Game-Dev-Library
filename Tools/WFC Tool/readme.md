# Wave Function Collapse (WFC) Rule Authoring Tool

A comprehensive web-based tool for creating, testing, and visualizing Wave Function Collapse (WFC) rules for procedural map generation.
This tool allows game developers to define tile adjacency constraints and generate infinite variations of maps that respect those
rules.

## Features

### Core WFC Algorithm

- **Wave Function Collapse Engine**: Full implementation of the WFC algorithm for procedural generation
- **Constraint Propagation**: Automatic constraint propagation based on adjacency rules
- **Entropy-Based Collapse**: Selects cells with minimum entropy for deterministic generation
- **Collision Handling**: Multiple strategies for handling unsolvable states (stop or backtrack)

### Rule Authoring

- **Interactive Rule Editor**: Visually define which tiles can be adjacent to each other
- **4-Direction Adjacency**: Define rules for up, right, down, and left neighbors
- **Per-Tile Configuration**: Each tile can have unique adjacency rules
- **Visual Rule Matrix**: Click-based toggle interface for setting adjacency constraints

### Simulation & Visualization

- **Real-Time Visualization**: Watch tiles collapse in real-time as generation progresses
- **Step-Through Mode**: Control generation one cell at a time for detailed analysis
- **Entropy Display**: See remaining possibilities for each uncollapsed cell
- **Seeded Generation**: Reproduce exact results with the same random seed
- **Undo/Redo System**: Step backward and forward through generation history

### Interaction Modes

- **Paint Seeds**: Manually place tiles to constrain generation
- **Erase Seeds**: Remove manually placed tiles
- **Full Simulation**: Generate entire map in one go
- **Step-Through**: Advance generation one collapse at a time

### Edge Rules System

- **Boundary Control**: Define how tiles behave at map edges
- **Three States**: Forbidden (cannot touch edge), Allowed (can touch edge), Required (must be on edge)
- **Per-Tile Configuration**: Each tile can have unique edge behavior
- **Automatic Filtering**: Cells are pre-filtered based on edge rules during initialization

### Backtracking Strategies

- **Stop on Collision**: Generation halts when an unsolvable state is reached
- **Backtrack N Steps**: Automatically revert N steps and retry when collision occurs

### Import/Export

- **Tileset Import**: Load PNG/JPEG tilesets with configurable tile dimensions
- **Rules Import**: Load previously saved adjacency and edge rules from JSON
- **Rules Export**: Save adjacency rules and edge rules as JSON for use in other projects
- **Output Export**: Export generated maps as JSON with metadata
- **Reproducible Results**: Export configurations to recreate specific generations
- **Format Validation**: Automatic validation of imported JSON files

## How to Use

### 1. Load Your Tileset

1. Click "Upload Tileset Image" and select a PNG/JPEG image
2. Set "Tile Width" and "Tile Height" to match your tile dimensions
3. Your tileset will appear in the center panel

### 2. Configure Output Map

1. Set "Map Width (tiles)" - how many tiles wide to generate
2. Set "Map Height (tiles)" - how many tiles tall to generate

### 3. Configure Edge Rules (Optional)

1. Select a tile from the tileset
2. Scroll to "Edge Rules for Tile [ID]" in the right panel
3. Set behavior for each edge:
   - **Forbidden**: Tile cannot appear on this edge
   - **Allowed**: Tile can appear on this edge (default)
   - **Required**: Tile must appear on this edge (useful for border tiles)
4. Edge rules are automatically applied during grid initialization

### 4. Author Adjacency Rules

1. Click on a tile in the "Tileset" panel to select it
2. The "Adjacency Rules" panel will show adjacency rules for that tile
3. For each direction (Up, Right, Down, Left):
   - Click a tile number to toggle whether that tile can be adjacent in that direction
   - Green tiles indicate allowed adjacencies
   - Orange/disabled tiles indicate not allowed

### 5. Paint Seeds (Optional)

1. Set "Interaction Mode" to "Paint Seeds"
2. Click on cells in the output grid to place specific tiles
3. Generation will respect these seeded tiles

### 6. Run Simulation

1. Choose run mode:
   - **Full Simulation**: Generate entire map at once
   - **Step-Through**: Collapse one cell at a time
2. Click "Run Full Simulation" or "Step Forward"
3. Watch the entropy display to see generation progress
4. Seeded cells appear with a purple border in the output grid

### 7. Fine-Tune Collision Handling

- Select **"Stop on Collision"** to halt when unsolvable states occur
- Select **"Backtrack N Steps"** to automatically retry from previous states
- Set "Backtrack Depth" to control how many steps to revert

### 8. Export Your Work

- **Export Rules JSON**: Save your adjacency and edge rules
- **Export Output JSON**: Save the generated map configuration with metadata

### 9. Import Rules (Optional)

1. Click "Import Rules JSON (optional)"
2. Select a previously exported rules file
3. Rules will be loaded and applied to the current tileset (tile count must match)

## Controls Reference

### Simulation Controls

- **Run Full Simulation**: Execute WFC until completion or collision
- **Step Forward**: Collapse one cell in step-through mode
- **Undo Step**: Revert to the previous step
- **Reset Grid**: Clear all collapses and start over

### Configuration Options

- **Map Width/Height**: Output dimensions in tiles
- **Tile Width/Height**: Size of each tile in pixels
- **Random Seed**: Fixed seed for reproducible results
- **Backtrack Depth**: How many steps to revert on collision (1-100)

### Status Display

- **Current Step**: Number of cells collapsed so far
- **Uncollapsed Cells**: Remaining cells to collapse
- **Backtracks Used**: Total number of backtracking operations performed
- **Status**: Current simulation state (Ready, Running, Complete, Collision, etc.)

## Tips & Best Practices

### Rule Creation

- Start with simple tilesets (4-8 tiles) before moving to complex ones
- Set reasonable adjacency constraints to avoid unsolvable states
- Every tile should have at least one valid neighbor in each direction to ensure generation completes
- Use edge rules to designate specific tiles for borders
- Use seeds strategically to guide generation toward desired patterns

### Edge Rules

- Mark corner/border tiles as "Required" on appropriate edges for consistent boundaries
- Use "Forbidden" to prevent interior tiles from appearing on edges
- Combine edge rules with adjacency rules for more control

### Collision Avoidance

- Test your rules with "Stop on Collision" first to identify impossible configurations
- If collisions occur frequently, add more allowed adjacencies
- The backtrack strategy works well when collisions are rare
- Verify that edge rules don't create unsolvable combinations

### Performance

- Larger maps take longer to generate; start with 10×10 grids
- Complex rule sets with many tiles may slow generation
- The entropy display helps identify problem areas in generation

### Reproducibility

- Copy the random seed to recreate exact maps
- Export rules JSON to share configurations with other developers
- Combine with exported output JSON to document specific results

## Technical Details

### WFC Algorithm Implementation

- Uses entropy-weighted random selection for cell collapse
- Implements constraint propagation through adjacency rules
- Supports backtracking with history tracking
- Seeded RNG for deterministic output

### Data Format

**Rules JSON Structure:**

```json
{
  "metadata": {
    "exportDate": "2026-01-18T00:00:00.000Z",
    "tileCount": 4,
    "tileWidth": 16,
    "tileHeight": 16
  },
  "tiles": [{ "id": 0 }, { "id": 1 }, { "id": 2 }, { "id": 3 }],
  "adjacencyRules": {
    "0": {
      "up": [0, 1, 2],
      "right": [0, 1],
      "down": [1, 2, 3],
      "left": [0, 2]
    },
    "1": {
      "up": [0, 1],
      "right": [1, 2],
      "down": [0, 1],
      "left": [1, 3]
    }
  },
  "edgeRules": {
    "0": { "top": "allowed", "right": "allowed", "bottom": "allowed", "left": "allowed" },
    "1": { "top": "required", "right": "allowed", "bottom": "forbidden", "left": "allowed" },
    "2": { "top": "allowed", "right": "allowed", "bottom": "allowed", "left": "allowed" },
    "3": { "top": "forbidden", "right": "allowed", "bottom": "required", "left": "allowed" }
  }
}
```

**Output JSON Structure:**

```json
{
  "metadata": {
    "exportDate": "2026-01-18T00:00:00.000Z",
    "width": 10,
    "height": 10,
    "tileWidth": 16,
    "tileHeight": 16,
    "seed": 12345,
    "stepCount": 47
  },
  "grid": [
    [
      { "tileId": 0, "isSeeded": false, "collapsed": true },
      { "tileId": 1, "isSeeded": true, "collapsed": true },
      { "tileId": 2, "isSeeded": false, "collapsed": true }
    ]
  ],
  "flatGrid": [0, 1, 2, ...]
}
```

### Browser Compatibility

- Modern browsers with HTML5 Canvas support
- Chrome, Firefox, Safari, Edge all supported
- Works entirely in-browser; no server required

## Troubleshooting

### Generation Fails (Collision)

- Check that each tile has at least one allowed neighbor in each direction
- Try adding more adjacency rules
- Consider using backtracking strategy
- Check edge rules don't conflict with adjacency rules

### Tiles Not Generating as Expected

- Verify tile dimensions match your tileset
- Check that rules are correctly configured
- Try manually seeding a few tiles to guide generation
- Review edge rules if certain tiles never appear on borders

### "Invalid Rules JSON" Error When Importing

- Ensure the rules file was exported from this tool
- Verify tile count matches your current tileset
- Check that all required fields are present in the JSON

### Performance Issues

- Reduce map size
- Simplify rule set
- Use a less complex tileset
- Increase backtrack depth cautiously (higher values slow performance)

## Credits

Based on the Wave Function Collapse algorithm by Maxim Gumin.
