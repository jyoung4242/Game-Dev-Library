# UITabbedPanel

![ss](./ss.png)

A comprehensive tabbed panel component for the Excalibur UI Framework that provides a complete tabbed interface system with
customizable layouts, styling, and content management.

## Overview

The `UITabbedPanel` is a sophisticated container component that extends `UIPanel` to provide a full tabbed interface. It supports
multiple tab positions, customizable styling, closeable tabs, icons, and comprehensive event handling for building complex user
interfaces.

## Features

- **Multiple Tab Positions**: Top, bottom, left, or right placement
- **Flexible Content Management**: Each tab can contain any UI elements
- **Customizable Styling**: Colors, spacing, sizing, and visual themes
- **Closeable Tabs**: Optional close buttons for dynamic tab management
- **Icon Support**: Add sprites/icons to tabs
- **Event System**: Comprehensive events for tab changes, additions, and removals
- **Keyboard Navigation**: Tab-based navigation support
- **Responsive Layout**: Automatic tab positioning and content area calculation
- **Extensible Architecture**: Easy to extend and customize

## Quick Start

```typescript
import { UITabbedPanel, Color } from "excalibur-ui";

// Create a tabbed panel
const tabbedPanel = new UITabbedPanel({
  width: 500,
  height: 400,
  pos: vec(50, 50),
  tabPosition: "top",
  colors: {
    backgroundStarting: Color.fromHex("#f5f5f5"),
    borderColor: Color.fromHex("#cccccc"),
  },
  tabColors: {
    activeBackground: Color.White,
    inactiveBackground: Color.fromHex("#e0e0e0"),
    activeText: Color.fromHex("#333333"),
    inactiveText: Color.fromHex("#666666"),
  },
});

// Add tabs with content
const inventoryTab = tabbedPanel.addTab({
  id: "inventory",
  label: "Inventory",
  icon: inventoryIconSprite,
});

// Add content to the inventory tab
const inventoryContent = tabbedPanel.getTabContent("inventory");
const inventoryLabel = new UILabel({
  text: "Your inventory is empty",
  pos: vec(20, 20),
});
inventoryContent.addChild(inventoryLabel);

// Add more tabs
tabbedPanel.addTab({
  id: "skills",
  label: "Skills",
});

tabbedPanel.addTab({
  id: "settings",
  label: "Settings",
  closeable: true, // This tab can be closed
});

// Listen for tab changes
tabbedPanel.tabbedEmitter.on("TabChanged", event => {
  console.log(`Switched to tab: ${event.tabId}`);
});

engine.add(tabbedPanel);
```

## Architecture

### Component Hierarchy

```
UITabbedPanel (extends UIPanel)
├── tabContainer (ScreenElement)
│   └── UITab[] (individual tab buttons)
└── contentContainer (ScreenElement)
    └── UITabContent[] (content areas for each tab)
```

### Key Classes

- **UITabbedPanel**: Main container managing tabs and layout
- **UITab**: Individual tab button with label, icon, and close button
- **UITabContent**: Content container for each tab's UI elements
- **UITabGraphic**: Custom rendering for tab appearance
- **CloseButtonGraphic**: Close button rendering

## Basic Usage

### Creating a Tabbed Panel

```typescript
const panel = new UITabbedPanel({
  name: "mainPanel",
  width: 600,
  height: 450,
  pos: vec(100, 100),
  tabPosition: "top", // "top", "bottom", "left", "right"
  tabHeight: 40, // Height of tabs
  tabMinWidth: 100, // Minimum tab width
  tabMaxWidth: 200, // Maximum tab width
  tabSpacing: 4, // Space between tabs
  contentPadding: vec(15, 15), // Padding inside content area
  // Panel styling (inherited from UIPanel)
  colors: {
    backgroundStarting: Color.fromHex("#f8f9fa"),
    borderColor: Color.fromHex("#dee2e6"),
  },
  borderWidth: 2,
  panelRadius: 8,
  // Tab-specific styling
  tabColors: {
    activeBackground: Color.White,
    inactiveBackground: Color.fromHex("#e9ecef"),
    hoverBackground: Color.fromHex("#f8f9fa"),
    activeText: Color.fromHex("#495057"),
    inactiveText: Color.fromHex("#6c757d"),
    hoveredText: Color.fromHex("#343a40"),
    borderColor: Color.fromHex("#dee2e6"),
  },
});
```

### Tab Positions

```typescript
// Top tabs (default)
const topTabs = new UITabbedPanel({
  tabPosition: "top",
  // Tabs appear at the top, content below
});

// Bottom tabs
const bottomTabs = new UITabbedPanel({
  tabPosition: "bottom",
  // Tabs appear at the bottom, content above
});

// Left tabs (vertical)
const leftTabs = new UITabbedPanel({
  tabPosition: "left",
  // Tabs appear on the left, content on the right
});

// Right tabs (vertical)
const rightTabs = new UITabbedPanel({
  tabPosition: "right",
  // Tabs appear on the right, content on the left
});
```

## Tab Management

### Adding Tabs

```typescript
// Basic tab
const tab1 = tabbedPanel.addTab({
  id: "tab1",
  label: "First Tab",
});

// Tab with icon
const tab2 = tabbedPanel.addTab({
  id: "tab2",
  label: "Second Tab",
  icon: myIconSprite,
});

// Closeable tab
const tab3 = tabbedPanel.addTab({
  id: "tab3",
  label: "Closable Tab",
  closeable: true,
});

// Tab with custom data
const tab4 = tabbedPanel.addTab({
  id: "tab4",
  label: "Data Tab",
  data: { type: "special", priority: 1 },
});

// Make tab active immediately
const activeTab = tabbedPanel.addTab(
  {
    id: "active",
    label: "Active Tab",
  },
  true,
); // true = make active
```

### Managing Tab Content

```typescript
// Get content container for a tab
const content = tabbedPanel.getTabContent("inventory");

// Add UI elements to the content
const titleLabel = new UILabel({
  text: "Inventory",
  pos: vec(10, 10),
  font: new Font({ size: 18, bold: true }),
});

const itemList = new UIList({
  pos: vec(10, 40),
  width: 200,
  height: 300,
});

content.addChild(titleLabel);
content.addChild(itemList);

// Alternative: Add elements directly to content
const button = new UIButton({
  text: "Use Item",
  pos: vec(220, 40),
});
content.addChild(button);
```

### Tab Navigation

```typescript
// Switch to a specific tab
tabbedPanel.setActiveTab("settings");

// Get currently active tab
const activeTabId = tabbedPanel.getActiveTabId();

// Get tab object
const tab = tabbedPanel.getTab("inventory");

// Get all tabs
const allTabs = tabbedPanel.getAllTabs();

// Get tab count
const count = tabbedPanel.getTabCount();
```

### Removing Tabs

```typescript
// Remove a specific tab
const removed = tabbedPanel.removeTab("temporaryTab");

// The panel automatically switches to another tab if the active one is removed
```

## Event Handling

### Tab Change Events

```typescript
tabbedPanel.tabbedEmitter.on("TabChanged", event => {
  console.log(`Switched to tab: ${event.tabId}`);
  console.log(`Tab object:`, event.tab);

  // Update UI based on active tab
  updateInterfaceForTab(event.tabId);
});
```

### Tab Management Events

```typescript
// Tab added
tabbedPanel.tabbedEmitter.on("TabAdded", event => {
  console.log(`Tab added: ${event.tabId}`);
  initializeTabContent(event.tabId);
});

// Tab removed
tabbedPanel.tabbedEmitter.on("TabRemoved", event => {
  console.log(`Tab removed: ${event.tabId}`);
  cleanupTabData(event.tabId);
});
```

### Individual Tab Events

```typescript
// Get a specific tab and listen to its events
const tab = tabbedPanel.getTab("settings");
tab.on("close", () => {
  console.log("Settings tab is being closed");
  saveSettings();
});
```

## Advanced Examples

### Character Sheet with Multiple Tabs

```typescript
class CharacterSheet extends UITabbedPanel {
  constructor(character: Character) {
    super({
      width: 700,
      height: 500,
      pos: vec(150, 100),
      tabPosition: "top",
      tabHeight: 45,
      colors: {
        backgroundStarting: Color.fromHex("#2c3e50"),
        borderColor: Color.fromHex("#34495e"),
      },
      tabColors: {
        activeBackground: Color.fromHex("#3498db"),
        inactiveBackground: Color.fromHex("#2980b9"),
        activeText: Color.White,
        inactiveText: Color.fromHex("#bdc3c7"),
      },
    });

    this.initializeTabs(character);
  }

  private initializeTabs(character: Character) {
    // Stats tab
    this.addTab({ id: "stats", label: "Stats" });
    this.createStatsTab(character);

    // Inventory tab
    this.addTab({ id: "inventory", label: "Inventory" });
    this.createInventoryTab(character);

    // Skills tab
    this.addTab({ id: "skills", label: "Skills" });
    this.createSkillsTab(character);

    // Equipment tab
    this.addTab({ id: "equipment", label: "Equipment" });
    this.createEquipmentTab(character);
  }

  private createStatsTab(character: Character) {
    const content = this.getTabContent("stats");

    // Create stat displays
    const stats = ["Strength", "Dexterity", "Constitution", "Intelligence", "Wisdom", "Charisma"];
    stats.forEach((stat, index) => {
      const statLabel = new UILabel({
        text: `${stat}: ${character.getStat(stat)}`,
        pos: vec(20, 20 + index * 30),
      });
      content.addChild(statLabel);
    });
  }

  private createInventoryTab(character: Character) {
    const content = this.getTabContent("inventory");

    // Create inventory grid
    const inventoryGrid = new UIGrid({
      pos: vec(20, 20),
      columns: 5,
      rows: 4,
      cellWidth: 60,
      cellHeight: 60,
    });

    character.inventory.forEach((item, index) => {
      const itemSlot = new UIItemSlot(item, index);
      inventoryGrid.addChild(itemSlot);
    });

    content.addChild(inventoryGrid);
  }

  private createSkillsTab(character: Character) {
    const content = this.getTabContent("skills");
    // Implementation for skills...
  }

  private createEquipmentTab(character: Character) {
    const content = this.getTabContent("equipment");
    // Implementation for equipment...
  }
}
```

### Dynamic Content Loading

```typescript
class ContentLoader {
  private tabbedPanel: UITabbedPanel;
  private loadedTabs: Set<string> = new Set();

  constructor(panel: UITabbedPanel) {
    this.tabbedPanel = panel;

    // Load content when tab becomes active
    this.tabbedPanel.tabbedEmitter.on("TabChanged", event => {
      this.loadTabContent(event.tabId);
    });
  }

  private async loadTabContent(tabId: string) {
    if (this.loadedTabs.has(tabId)) return;

    const content = this.tabbedPanel.getTabContent(tabId);

    // Show loading indicator
    const loadingLabel = new UILabel({
      text: "Loading...",
      pos: vec(50, 50),
    });
    content.addChild(loadingLabel);

    try {
      // Simulate async content loading
      const tabData = await this.fetchTabData(tabId);

      // Remove loading indicator
      content.removeChild(loadingLabel);

      // Add actual content
      this.populateTabContent(tabId, tabData);

      this.loadedTabs.add(tabId);
    } catch (error) {
      loadingLabel.text = "Failed to load content";
      console.error(`Failed to load tab ${tabId}:`, error);
    }
  }

  private async fetchTabData(tabId: string): Promise<any> {
    // Simulate API call
    return new Promise(resolve => {
      setTimeout(() => {
        resolve({ items: ["Item 1", "Item 2", "Item 3"] });
      }, 1000);
    });
  }

  private populateTabContent(tabId: string, data: any) {
    const content = this.tabbedPanel.getTabContent(tabId);

    data.items.forEach((item: string, index: number) => {
      const itemLabel = new UILabel({
        text: item,
        pos: vec(20, 20 + index * 25),
      });
      content.addChild(itemLabel);
    });
  }
}
```

### Tabbed File Browser

```typescript
class FileBrowser extends UITabbedPanel {
  private currentPath: string = "/";

  constructor() {
    super({
      width: 800,
      height: 600,
      tabPosition: "left",
      tabHeight: 120, // Wider for vertical tabs
      colors: {
        backgroundStarting: Color.fromHex("#1e1e1e"),
        borderColor: Color.fromHex("#3e3e3e"),
      },
    });

    this.initializeFileTabs();
  }

  private initializeFileTabs() {
    // Create tabs for different file categories
    const categories = [
      { id: "documents", label: "Documents", icon: documentIcon },
      { id: "images", label: "Images", icon: imageIcon },
      { id: "videos", label: "Videos", icon: videoIcon },
      { id: "music", label: "Music", icon: musicIcon },
    ];

    categories.forEach(category => {
      this.addTab({
        id: category.id,
        label: category.label,
        icon: category.icon,
        closeable: false,
      });

      this.createFileList(category.id);
    });
  }

  private createFileList(categoryId: string) {
    const content = this.getTabContent(categoryId);

    // Create file list container
    const fileList = new UIList({
      pos: vec(10, 10),
      width: this.contentArea.width - 20,
      height: this.contentArea.height - 20,
    });

    // Populate with files of this category
    const files = this.getFilesByCategory(categoryId);
    files.forEach(file => {
      const fileItem = new UIFileItem(file);
      fileList.addItem(fileItem);
    });

    content.addChild(fileList);
  }

  private getFilesByCategory(category: string): FileInfo[] {
    // Return files for the specified category
    return fileSystem.getFilesByCategory(category);
  }

  navigateTo(path: string) {
    this.currentPath = path;
    // Refresh all tab contents with new path
    this.refreshAllTabs();
  }

  private refreshAllTabs() {
    this.getAllTabs().forEach(tab => {
      const content = this.getTabContent(tab.tabId);
      content.removeAllChildren();
      this.createFileList(tab.tabId);
    });
  }
}
```

### Custom Tab Styling

```typescript
class CustomStyledTabs extends UITabbedPanel {
  constructor() {
    super({
      width: 500,
      height: 400,
      tabPosition: "top",
      tabColors: {
        activeBackground: Color.fromHex("#6200ea"),
        inactiveBackground: Color.fromHex("#3700b3"),
        hoverBackground: Color.fromHex("#7c4dff"),
        activeText: Color.White,
        inactiveText: Color.fromHex("#e8eaf6"),
        hoveredText: Color.fromHex("#fff176"),
        borderColor: Color.fromHex("#000000"),
      },
    });

    // Add tabs with custom styling
    this.addTab({
      id: "home",
      label: "🏠 Home",
    });

    this.addTab({
      id: "work",
      label: "💼 Work",
    });

    this.addTab({
      id: "play",
      label: "🎮 Play",
    });
  }
}
```

### Tabbed Dialog System

```typescript
class TabbedDialog extends UITabbedPanel {
  private resolveDialog: (result: any) => void;
  private rejectDialog: (reason: any) => void;

  constructor(title: string, tabs: DialogTab[]) {
    super({
      width: 600,
      height: 500,
      pos: vec(200, 150),
      tabPosition: "top",
      colors: {
        backgroundStarting: Color.fromHex("#ffffff"),
        borderColor: Color.fromHex("#cccccc"),
      },
    });

    // Add title bar
    this.createTitleBar(title);

    // Add dialog tabs
    tabs.forEach(tabConfig => {
      this.addTab(tabConfig.tab);
      this.createTabContent(tabConfig);
    });

    // Add dialog buttons
    this.createDialogButtons();
  }

  private createTitleBar(title: string) {
    const titleLabel = new UILabel({
      text: title,
      pos: vec(20, 10),
      font: new Font({ size: 18, bold: true }),
    });

    // Add title to the panel (not a tab)
    this.addChild(titleLabel);
  }

  private createTabContent(tabConfig: DialogTab) {
    const content = this.getTabContent(tabConfig.tab.id);

    // Add tab-specific content
    tabConfig.content.forEach(element => {
      content.addChild(element);
    });
  }

  private createDialogButtons() {
    const okButton = new UIButton({
      text: "OK",
      pos: vec(this.width - 180, this.height - 50),
      callback: () => this.resolve(this.getDialogResult()),
    });

    const cancelButton = new UIButton({
      text: "Cancel",
      pos: vec(this.width - 90, this.height - 50),
      callback: () => this.reject("cancelled"),
    });

    this.addChild(okButton);
    this.addChild(cancelButton);
  }

  private getDialogResult(): any {
    // Collect results from all tabs
    const result: any = {};
    this.getAllTabs().forEach(tab => {
      const content = this.getTabContent(tab.tabId);
      result[tab.tabId] = this.extractTabData(content);
    });
    return result;
  }

  private extractTabData(content: UITabContent): any {
    // Extract form data from content
    return {};
  }

  show(): Promise<any> {
    engine.add(this);
    return new Promise((resolve, reject) => {
      this.resolveDialog = resolve;
      this.rejectDialog = reject;
    });
  }

  private resolve(result: any) {
    engine.remove(this);
    this.resolveDialog(result);
  }

  private reject(reason: any) {
    engine.remove(this);
    this.rejectDialog(reason);
  }
}

interface DialogTab {
  tab: TabConfig;
  content: ScreenElement[];
}
```

## Configuration Reference

### UITabbedPanelConfig

- `tabHeight?: number` - Height of tabs (default: 36)
- `tabMinWidth?: number` - Minimum tab width (default: 80)
- `tabMaxWidth?: number` - Maximum tab width (default: 200)
- `tabPosition?: TabPosition` - Tab placement: "top", "bottom", "left", "right"
- `tabSpacing?: number` - Space between tabs (default: 2)
- `contentPadding?: Vector` - Padding inside content area (default: vec(10, 10))
- `tabColors?: object` - Tab color configuration

### TabConfig

- `id: string` - Unique identifier for the tab
- `label: string` - Display text for the tab
- `icon?: Sprite` - Optional icon sprite
- `closeable?: boolean` - Whether tab can be closed
- `data?: any` - Custom data associated with the tab

### Tab Colors

```typescript
tabColors: {
  activeBackground?: Color;    // Active tab background
  inactiveBackground?: Color;  // Inactive tab background
  hoverBackground?: Color;     // Hovered tab background
  activeText?: Color;          // Active tab text color
  inactiveText?: Color;        // Inactive tab text color
  hoveredText?: Color;         // Hovered tab text color
  borderColor?: Color;         // Tab border color
}
```

## Content Area Management

### Getting Content Bounds

```typescript
// Get available content area (accounts for tabs and padding)
const contentArea = tabbedPanel.contentArea;
console.log(`Available: ${contentArea.width} x ${contentArea.height}`);

// Position content relative to content area
const element = new UIButton({
  text: "Button",
  pos: vec(contentArea.x + 10, contentArea.y + 10),
});
```

### Managing Content Visibility

```typescript
// Content is automatically shown/hidden when tabs change
// But you can manually control visibility
const content = tabbedPanel.getTabContent("mytab");
content.show(); // Make visible
content.hide(); // Hide
```

## API Reference

### UITabbedPanel Methods

- `addTab(config: TabConfig, makeActive?: boolean): UITab` - Add a new tab
- `removeTab(tabId: string): boolean` - Remove a tab
- `setActiveTab(tabId: string): boolean` - Switch to a tab
- `getActiveTabId(): string | null` - Get active tab ID
- `getTab(tabId: string): UITab | undefined` - Get tab object
- `getTabContent(tabId: string): UITabContent | undefined` - Get content container
- `getAllTabs(): UITab[]` - Get all tabs
- `getTabCount(): number` - Get tab count
- `contentArea: {x, y, width, height}` - Available content area

### UITab Methods

- `setActive(active: boolean)` - Set tab active state
- `tabId: string` - Get tab identifier

### UITabContent Methods

- `show()` - Show content
- `hide()` - Hide content
- `isVisible: boolean` - Visibility state
- `tabId: string` - Associated tab ID

### Events

- `TabChanged` - Tab switched (target, tabId, tab)
- `TabAdded` - Tab added (target, tabId, tab)
- `TabRemoved` - Tab removed (target, tabId)
