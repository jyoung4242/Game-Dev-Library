# BT Builder (ExcaliburJS Behavior Tree Editor)

This is a single-file web-based editor for creating, editing, and exporting Behaviour Trees (BT) using an ExcaliburJS-style builder
API.

The app is located [here](https://bt-builder.vercel.app/)

## Main UI (quick reference)

- Header buttons (top-right): `New Tree`, `Import JSON`, `Export JSON`, `Export TypeScript`
- Left panel: `Tree Structure` — visual hierarchical editor of nodes
- Node controls (appear when hovering a node): `Move up` (↑), `Move down` (↓), `Add child` (+), `Duplicate` (⧉), `Delete` (×)
- Middle/Right: Node editor (properties) and Generated TypeScript Code panel with `Copy Code` button
- Resizable left panel: drag the thin vertical handle between panels to resize

## How to use (step-by-step)

1. Create a new tree: click `New Tree` (warns before discarding current tree).
2. Add child nodes: hover a node and click the `+` icon (or select a node and use the editor to change type and children).
3. Change node type: select a node to open the Node Editor. Choose from `Selector`, `Sequence`, `Inverter`, `Repeater`, `Action`,
   `Condition`.
   - Root node can only be `Selector` or `Sequence`.
4. Edit node properties:
   - `Name`: set a readable name.
   - `Action Code` (for `Action` nodes): enter an Excalibur Action or a factory function (e.g. `new YourAction(this)`).
   - `Condition Code` (for `Condition` nodes): enter a function that returns a boolean (e.g. `() => this.health > 0`).
   - `Times` (for `Repeater`): optional integer (leave empty for infinite repeat).
5. Reorder nodes: use the `↑` / `↓` buttons shown on the node to move it among siblings.
6. Duplicate / Delete: use `⧉` to duplicate (deep clones children with new IDs) or `×` to delete (root cannot be deleted).
7. Export JSON: click `Export JSON` to download `behavior-tree.json` with the full tree data.
8. Import JSON: click `Import JSON` and select a previously exported `.json` file. The tree will load and the root will be selected.
9. Export TypeScript: click `Export TypeScript` to download a generated `behavior-tree.ts` file built from the current tree.
10. Copy generated code: use the `Copy Code` button in the Generated TypeScript Code panel to copy the shown code to clipboard.

## Constraints & notes

- The root node must be a composite (`Selector` or `Sequence`). The editor prevents setting the root to non-composite types.
- Decorator nodes (`Inverter`, `Repeater`) accept a single `child`; attempt to add multiple children will show an alert.
- Duplicating decorator children is disallowed where it would create multiple children.
- You cannot delete the root node.

## Generated code

The Code panel builds an ExcaliburJS-style chained builder API starting with `createBehaviorTree(this, "Selector"|"Sequence")` and
chaining `.selector()`, `.sequence()`, `.action()`, `.condition()`, `.inverter()`, `.repeater()`, `.end()` and finally `.build()`.

Use `Export TypeScript` to download `behavior-tree.ts` or `Copy Code` to paste the code into your project.
