// =============================================================================
//  LIBRARY DATA
//  To add a new item: append an object to ITEMS with the matching section id.
//  To add a new section: add an entry to SECTIONS, then use that id in ITEMS.
//
//  Card fields:
//    section {string}   - must match a SECTIONS id
//    emoji   {string}   - icon shown top-left of card
//    title   {string}   - card heading
//    desc    {string}   - one or two sentence description
//    isNew   {boolean}  - shows a "New" badge (optional, default false)
//    links   {array}    - list of link objects:
//                           label   {string}  - link text
//                           href    {string}  - URL
//                           launch  {boolean} - true = orange launch style
//                                              false/omit = subtle docs style
// =============================================================================

export const GITHUB = "https://github.com/jyoung4242/Game-Dev-Library/blob/main";

export const SECTIONS = [
  { id: "tools", label: "Tools", icon: "🛠", iconClass: "icon-tools" },
  { id: "ui", label: "UI Components", icon: "🖥", iconClass: "icon-ui" },
  { id: "modules", label: "Game Modules", icon: "⚙️", iconClass: "icon-modules" },
  { id: "ecs", label: "ECS Components & Systems", icon: "🧱", iconClass: "icon-ecs" },
  { id: "shaders", label: "Shaders & Post Processors", icon: "✨", iconClass: "icon-shaders" },
  { id: "procgen", label: "Procedural Generation", icon: "🧬", iconClass: "icon-procgen" },
  { id: "tutorials", label: "Tutorials", icon: "📚", iconClass: "icon-tutorials" },
];

export const ITEMS = [
  // ── TOOLS ────────────────────────────────────────────────────────────────
  {
    section: "tools",
    emoji: "🎶",
    title: "JSFXR Sound Forge",
    desc: "Create retro sound effects with a web-based SFXR-inspired tool. Perfect for prototyping and adding quick audio to your games.",
    links: [
      { label: "Launch ↗", href: "https://gdl-sound-forge.vercel.app/", launch: true },
      { label: "Docs", href: `${GITHUB}/Tools/SoundForge/readme.md` },
    ],
    isNew: true,
  },
  {
    section: "tools",
    emoji: "Ⓐ",
    title: "Sprite Font Forge",
    desc: "Draw your own custom bitmap fonts and export as Excalibur sprite sheets. Perfect for pixel art titles, UI, or unique in-game text.",
    links: [
      { label: "Launch ↗", href: "https://sprite-font-forge.vercel.app/", launch: true },
      { label: "Docs", href: `${GITHUB}/Tools/SpriteFont%20Forge/readme.md` },
    ],
    isNew: true,
  },
  {
    section: "tools",
    emoji: "🧩",
    title: "Tileset Combiner",
    desc: "Merge multiple tilesets into a single consolidated sheet. Reduces draw calls and simplifies atlas management.",
    links: [
      { label: "Launch ↗", href: "https://tilesetconsolidator.vercel.app/", launch: true },
      { label: "Docs", href: `${GITHUB}/Tools/Tile%20Set%20Combiner/readme.md` },
    ],
  },
  {
    section: "tools",
    emoji: "🌊",
    title: "WFC Authoring Tool",
    desc: "Visually define adjacency rules for Wave Function Collapse tile generation — no hand-written config needed.",
    links: [
      { label: "Launch ↗", href: "https://wfc-auth-tool.vercel.app/", launch: true },
      { label: "Docs", href: `${GITHUB}/Tools/WFC%20Tool/readme.md` },
    ],
  },
  {
    section: "tools",
    emoji: "🎬",
    title: "Animation Builder",
    desc: "Build and preview sprite animations interactively. Exports configs ready to drop straight into ExcaliburJS.",
    links: [
      { label: "Launch ↗", href: "https://anim-genv2.vercel.app/", launch: true },
      { label: "Docs", href: `${GITHUB}/Tools/Animation%20Builder/Readme.md` },
    ],
  },
  {
    section: "tools",
    emoji: "🌳",
    title: "Behavior Tree Builder",
    desc: "Visually construct behavior trees and export to code. Pairs directly with the BT ECS component below.",
    links: [
      { label: "Launch ↗", href: "https://bt-builder.vercel.app/", launch: true },
      { label: "Docs", href: `${GITHUB}/Tools/BT%20Builder/readme.md` },
    ],
  },

  // ── UI COMPONENTS ─────────────────────────────────────────────────────────
  {
    section: "ui",
    emoji: "🪟",
    title: "UI Framework",
    desc: "A full component framework for in-game UI. Provides layout, events, and rendering pipeline for complex HUDs and menus.",
    links: [
      { label: "Repo ↗", href: "https://github.com/jyoung4242/UIFramework/tree/main", launch: true },
      { label: "Guidelines", href: `${GITHUB}/UIcomponents/UIFramework/readme.md` },
    ],
  },
  {
    section: "ui",
    emoji: "⌨️",
    title: "Typewriter Graphic",
    desc: "Animated typewriter text effect as a graphic component. Drop-in for dialogue boxes, intros, and narrative sequences.",
    links: [
      { label: "Source ↗", href: `${GITHUB}/UIcomponents/Typewriter%20Graphic/typewriter.ts`, launch: true },
      { label: "Docs", href: `${GITHUB}/UIcomponents/Typewriter%20Graphic/readme.md` },
    ],
  },
  {
    section: "ui",
    emoji: "🖼",
    title: "SVG Graphic",
    desc: "Render inline SVGs as Excalibur graphics. Lets you use vector art directly inside your game scene.",
    links: [
      { label: "Source ↗", href: `${GITHUB}/UIcomponents/SVG%20Graphic/SVGGraphic.ts`, launch: true },
      { label: "Docs", href: `${GITHUB}/UIcomponents/SVG%20Graphic/readme.md` },
    ],
  },
  {
    section: "ui",
    emoji: "🗺️",
    title: "Mini-map",
    desc: "Display a mini-map of the game world. Useful for visualizing game state and navigation.",
    isNew: true,
    links: [
      { label: "Source ↗", href: `${GITHUB}/UIcomponents/MiniMap/minimap.ts`, launch: true },
      { label: "Docs", href: `${GITHUB}/UIcomponents/MiniMap/readme.md` },
    ],
  },

  // ── GAME MODULES ──────────────────────────────────────────────────────────
  {
    section: "modules",
    emoji: "🗂",
    title: "Game State Manager",
    desc: "Top-level state machine for managing game screens and flow. Handles transitions between menus, gameplay, and cutscenes.",
    links: [
      { label: "Source ↗", href: `${GITHUB}/Game%20Systems/Game%20State%20Manager/state%20management.ts`, launch: true },
      { label: "Docs", href: `${GITHUB}/Game%20Systems/Game%20State%20Manager/readme.md` },
    ],
  },
  {
    section: "modules",
    emoji: "🔄",
    title: "Finite State Machine",
    desc: "Lightweight, typed FSM for actors and game objects. Define states and transitions with clear enter/exit hooks.",
    links: [
      { label: "Source ↗", href: `${GITHUB}/Game%20Systems/Finite%20State%20Machine/ExFSM.ts`, launch: true },
      { label: "Docs", href: `${GITHUB}/Game%20Systems/Finite%20State%20Machine/readme.md` },
    ],
  },
  {
    section: "modules",
    emoji: "📡",
    title: "Pub/Sub Signals",
    desc: "Decoupled event system for game-wide communication. Publish and subscribe to named signals without tight coupling.",
    links: [
      { label: "Source ↗", href: `${GITHUB}/Game%20Systems/Pub%20Sub%20Signals/Signals.ts`, launch: true },
      { label: "Docs", href: `${GITHUB}/Game%20Systems/Pub%20Sub%20Signals/readme.md` },
    ],
  },
  {
    section: "modules",
    emoji: "🎮",
    title: "Input Mapping",
    desc: "Rebindable input abstraction over keyboard, mouse, and gamepad. Map logical actions to physical keys at runtime.",
    links: [
      { label: "Source ↗", href: `${GITHUB}/Game%20Systems/Input%20Mapping/InputMapper.ts`, launch: true },
      { label: "Docs", href: `${GITHUB}/Game%20Systems/Input%20Mapping/readme.md` },
    ],
  },
  {
    section: "modules",
    emoji: "🆔",
    title: "UUID",
    desc: "Tiny UUID generator. Generate unique identifiers for entities, save states, or network messages.",
    links: [
      { label: "Source ↗", href: `${GITHUB}/Game%20Systems/UUID/UUID.ts`, launch: true },
      { label: "Docs", href: `${GITHUB}/Game%20Systems/UUID/readme.md` },
    ],
  },
  {
    section: "modules",
    emoji: "🃏",
    title: "Poker Hand Evaluation",
    desc: "Evaluate and rank poker hands from a card array. Useful for card games, mini-games, or any poker-style mechanic.",
    links: [
      { label: "Source ↗", href: `${GITHUB}/Game%20Systems/Poker%20Hand%20Evaluation/Poker%20Hand%20Eval.ts`, launch: true },
      { label: "Docs", href: `${GITHUB}/Game%20Systems/Poker%20Hand%20Evaluation/readme.md` },
    ],
  },
  {
    section: "modules",
    emoji: "🗺",
    title: "ASCII Level Editor",
    desc: "Design levels using ASCII art and convert to tile data. A quick way to author maps in plain text.",
    links: [
      { label: "Source ↗", href: `${GITHUB}/Game%20Systems/Ascii%20Level%20Editor/LevelEditor.ts`, launch: true },
      { label: "Docs", href: `${GITHUB}/Game%20Systems/Ascii%20Level%20Editor/readme.md` },
    ],
  },
  {
    section: "ui",
    emoji: "✏️",
    title: "Editable UI Elements",
    desc: "In-game text fields and editable UI controls. Handles focus, cursor, and input for runtime-editable elements.",
    links: [
      { label: "Source ↗", href: `${GITHUB}/Game%20Systems/Editable%20UI%20Element/EditableUI.ts`, launch: true },
      { label: "Docs", href: `${GITHUB}/Game%20Systems/Editable%20UI%20Element/readme.md` },
    ],
  },
  {
    section: "modules",
    emoji: "📐",
    title: "Flex Layout Components",
    desc: "Flexbox-style positioning for on-screen UI elements. Arrange HUD components responsively without manual coordinate math.",
    links: [{ label: "Docs", href: `${GITHUB}/Game%20Systems/Flex%20Layout%20Components/readme.md` }],
  },
  {
    section: "modules",
    emoji: "🗃",
    title: "Tilemap Chunking",
    desc: "Stream and manage large tilemaps using a chunked approach. Only loads/renders tiles near the camera for performance.",
    links: [
      { label: "Source ↗", href: `${GITHUB}/Game%20Systems/Chunked%202d%20Tilemap/Chunked2dTilemap.ts`, launch: true },
      { label: "Docs", href: `${GITHUB}/Game%20Systems/Chunked%202d%20Tilemap/readme.md` },
    ],
  },
  {
    section: "modules",
    emoji: "📷",
    title: "Platformer Camera Strategy",
    desc: "A camera controller tuned for 2D platformers. Includes look-ahead, dead zones, and smooth tracking.",
    links: [
      { label: "Source ↗", href: `${GITHUB}/Game%20Systems/Platformer%20Custom%20Camera/CustomCameraStrategy.ts`, launch: true },
      { label: "Docs", href: `${GITHUB}/Game%20Systems/Platformer%20Custom%20Camera/readme.md` },
    ],
  },
  {
    section: "modules",
    emoji: "🦾",
    title: "Inverse & Forward Kinematics",
    desc: "IK and FK chains for procedural limb animation. Attach to actors to drive bone-style animations at runtime.",
    isNew: true,
    links: [
      { label: "Repo ↗", href: `${GITHUB}/Game%20Systems/FKIK/kinematics`, launch: true },
      { label: "Docs", href: `${GITHUB}/Game%20Systems/FKIK/readme.md` },
    ],
  },
  {
    section: "modules",
    emoji: "🌐",
    title: "Peer-to-Peer Networking",
    desc: "WebRTC-based P2P networking layer for multiplayer games. Sync game state between peers without a dedicated server.",
    isNew: true,
    links: [
      { label: "Source ↗", href: `${GITHUB}/Game%20Systems/P2P/PeerNetworManager.ts`, launch: true },
      { label: "Docs", href: `${GITHUB}/Game%20Systems/P2P/readme.md` },
    ],
  },
  {
    section: "modules",
    emoji: "🕹",
    title: "Virtual Joysticks",
    desc: "On-screen virtual joystick for mobile and touch input. Configurable dead zone, radius, and output mapping.",
    isNew: true,
    links: [
      { label: "Source ↗", href: `${GITHUB}/Game%20Systems/VirtualJoystick/VirtualJoystick.ts`, launch: true },
      { label: "Docs", href: `${GITHUB}/Game%20Systems/VirtualJoystick/readme.md` },
    ],
  },

  // ── ECS ───────────────────────────────────────────────────────────────────
  {
    section: "ecs",
    emoji: "📄",
    title: "Component Template",
    desc: "Boilerplate for building your own ECS components. A clean starting point with lifecycle hooks and typed data.",
    links: [
      {
        label: "Source ↗",
        href: `${GITHUB}/Systems%26Components/General%20Purpose%20Component%20Template/GP%20Component.ts`,
        launch: true,
      },
    ],
  },
  {
    section: "ecs",
    emoji: "🌳",
    title: "Behavior Trees",
    desc: "ECS component wrapping a full behavior tree system. Works alongside the Behavior Tree Builder tool above.",
    links: [
      { label: "Source ↗", href: `${GITHUB}/Systems%26Components/Behavior%20Tree/BehaviorTree.ts`, launch: true },
      { label: "Docs", href: `${GITHUB}/Systems%26Components/Behavior%20Tree/readme.md` },
    ],
  },
  {
    section: "ecs",
    emoji: "⌨️",
    title: "Keyboard Control",
    desc: "Component for driving actor movement from keyboard input. Simple WASD/arrow-key control with configurable speed and axes.",
    links: [
      { label: "Source ↗", href: `${GITHUB}/Systems%26Components/KeyboardControl/KeyboardControl.ts`, launch: true },
      { label: "Docs", href: `${GITHUB}/Systems%26Components/KeyboardControl/readme.md` },
    ],
  },
  {
    section: "ecs",
    emoji: "🃏",
    title: "Card Game Components",
    desc: "A set of ECS components modeling cards, hands, and decks. Foundation for building any card-based game mechanic.",
    links: [
      { label: "Source ↗", href: `${GITHUB}/Systems%26Components/Card%20Game%20Components/CardSystem.ts`, launch: true },
      { label: "Docs", href: `${GITHUB}/Systems%26Components/Card%20Game%20Components/readme.md` },
    ],
  },
  {
    section: "ecs",
    emoji: "🎞",
    title: "Animation Component",
    desc: "Data-driven animation state machine as an ECS component. Define animation states and transition rules in config.",
    links: [
      { label: "Source ↗", href: `${GITHUB}/Systems%26Components/Animation%20Component/AnimationComponent.ts`, launch: true },
      { label: "Docs", href: `${GITHUB}/Systems%26Components/Animation%20Component/readme.md` },
    ],
  },
  {
    section: "ecs",
    emoji: "👆",
    title: "Touching Component",
    desc: "Collision contact tracking for actors. Exposes which surfaces are touching each frame for platformer-style logic.",
    links: [
      { label: "Source ↗", href: `${GITHUB}/Systems%26Components/Touching%20Component/TouchingComponent.ts`, launch: true },
      { label: "Docs", href: `${GITHUB}/Systems%26Components/Touching%20Component/readme.md` },
    ],
  },
  {
    section: "ecs",
    emoji: "🎥",
    title: "Cutscene / UI Event Engine",
    desc: "Sequence-based engine for scripting cutscenes and UI events. Chain camera moves, dialogue, and transitions in order.",
    links: [
      { label: "Source ↗", href: `${GITHUB}/Systems%26Components/CutScene_UIEvents/cutsceneEvents.ts`, launch: true },
      { label: "Docs", href: `${GITHUB}/Systems%26Components/CutScene_UIEvents/readme.md` },
    ],
  },
  {
    section: "ecs",
    emoji: "💥",
    title: "Destructive Actor Component",
    desc: "Component for causing actors to explode and fragment into smaller procedureally generated pieces.",
    links: [
      {
        label: "Source ↗",
        href: `${GITHUB}/Systems%26Components/Destructive%20Actor%20Component/DestructiveActorComponent.ts`,
        launch: true,
      },
      { label: "Docs", href: `${GITHUB}/Systems&Components/Destructive%20Actor%20Component/readme.md` },
    ],
    isNew: true,
  },

  // ── SHADERS ───────────────────────────────────────────────────────────────
  {
    section: "shaders",
    emoji: "💥",
    title: "Shockwave",
    desc: "Radial distortion shockwave effect. Great for explosions, impacts, or screen-shake alternatives.",
    links: [
      {
        label: "Source ↗",
        href: `${GITHUB}/Game%20Systems/Shaders%20and%20Post%20Processors/ShockWave/shockwave.ts`,
        launch: true,
      },
      { label: "Docs", href: `${GITHUB}/Game%20Systems/Shaders%20and%20Post%20Processors/ShockWave/readme.md` },
    ],
  },
  {
    section: "shaders",
    emoji: "📺",
    title: "CRT",
    desc: "Scanline and screen-curvature CRT filter. Adds authentic retro monitor feel to any game.",
    links: [
      {
        label: "Source ↗",
        href: `${GITHUB}/Game%20Systems/Shaders%20and%20Post%20Processors/CRT/CRT.ts`,
        launch: true,
      },
      { label: "Docs", href: `${GITHUB}/Game%20Systems/Shaders%20and%20Post%20Processors/CRT/readme.md` },
    ],
  },
  {
    section: "shaders",
    emoji: "✨",
    title: "Gleam Material",
    desc: "Specular gleam and shine effect for sprites and surfaces. Adds a dynamic highlight that follows your light source.",
    links: [
      {
        label: "Source ↗",
        href: `${GITHUB}/Game%20Systems/Shaders%20and%20Post%20Processors/Gleam%20Material/gleamMaterial.ts`,
        launch: true,
      },
      { label: "Docs", href: `${GITHUB}/Game%20Systems/Shaders%20and%20Post%20Processors/Gleam%20Material/readme.md` },
    ],
  },
  {
    section: "shaders",
    emoji: "🎞",
    title: "Wipe Fade Material",
    desc: "Directional wipe transition shader. Clean scene transitions with configurable direction and timing.",
    links: [
      {
        label: "Source ↗",
        href: `${GITHUB}/Game%20Systems/Shaders%20and%20Post%20Processors/Wipe%20Shader/Wipe.ts`,
        launch: true,
      },
      { label: "Docs", href: `${GITHUB}/Game%20Systems/Shaders%20and%20Post%20Processors/Wipe%20Shader/readme.md` },
    ],
  },
  {
    section: "shaders",
    emoji: "🌫",
    title: "Blur Shader",
    desc: "Gaussian blur post processor. Use for depth-of-field effects, focus pulls, or background blurring.",
    links: [
      {
        label: "Source ↗",
        href: `${GITHUB}/Game%20Systems/Shaders%20and%20Post%20Processors/Blur%20Shader/blur.ts`,
        launch: true,
      },
      { label: "Docs", href: `${GITHUB}/Game%20Systems/Shaders%20and%20Post%20Processors/Blur%20Shader/readme.md` },
    ],
  },
  {
    section: "shaders",
    emoji: "🪨",
    title: "Marble Shader",
    desc: "Procedural marble texture shader. Creates a dynamic, swirling marble surface material on any actor.",
    links: [
      {
        label: "Source ↗",
        href: `${GITHUB}/Game%20Systems/Shaders%20and%20Post%20Processors/Marble%20Shader/marble.ts`,
        launch: true,
      },
      { label: "Docs", href: `${GITHUB}/Game%20Systems/Shaders%20and%20Post%20Processors/Marble%20Shader/readme.md` },
    ],
  },
  {
    section: "shaders",
    emoji: "🌅",
    title: "Sunset Synthwave Shader",
    desc: "Procedural sunset and sky shader. Creates a dynamic synthwave pattern for the moving ground",
    links: [
      {
        label: "Source ↗",
        href: `${GITHUB}/Game%20Systems/Shaders%20and%20Post%20Processors/Sunset%20Synthwave/sunsetShader.ts`,
        launch: true,
      },
      { label: "Docs", href: `${GITHUB}/Game%20Systems/Shaders%20and%20Post%20Processors/Sunset%20Synthwave/readme.md` },
    ],
    isNew: true,
  },

  // ── PROCGEN ───────────────────────────────────────────────────────────────
  {
    section: "procgen",
    emoji: "🦠",
    title: "Cellular Automata",
    desc: "Cave and organic map generation using cellular automata rules. Configurable birth/death thresholds for different terrain styles.",
    links: [
      {
        label: "Source ↗",
        href: `${GITHUB}/Game%20Systems/Procedural%20Generation/Cellular%20Automata/cellularAutomata.ts`,
        launch: true,
      },
      { label: "Docs", href: `${GITHUB}/Game%20Systems/Procedural%20Generation/Cellular%20Automata/readme.md` },
    ],
  },
  {
    section: "procgen",
    emoji: "🌊",
    title: "Wave Function Collapse",
    desc: "Tile-based WFC procedural generation implementation. Pair with the WFC Authoring Tool above for a complete pipeline.",
    links: [
      {
        label: "Source ↗",
        href: `${GITHUB}/Game%20Systems/Procedural%20Generation/Wave%20Function%20Collapse/WFC.ts`,
        launch: true,
      },
      { label: "Docs", href: `${GITHUB}/Game%20Systems/Procedural%20Generation/Wave%20Function%20Collapse/readme.md` },
    ],
  },
  {
    section: "procgen",
    emoji: "🕸️",
    title: "Poisson Disc Sampling",
    desc: "This is extremely useful in gamedev (trees, enemies, loot, etc.) because it avoids clumping while still looking natural",
    isNew: true,
    links: [
      {
        label: "Source ↗",
        href: `${GITHUB}/Game%20Systems/Procedural%20Generation/Poisson%20Disk/Poisson.ts`,
        launch: true,
      },
      { label: "Docs", href: `${GITHUB}/Game%20Systems/Procedural%20Generation/Poisson%20Disc/readme.md` },
    ],
  },

  // ── TUTORIALS ─────────────────────────────────────────────────────────────
  {
    section: "tutorials",
    emoji: "🚀",
    title: "Deploy to Itch via GitHub Actions",
    desc: "Automate deployment of your game builds to Itch.io. Step-by-step guide for setting up a CI/CD pipeline.",
    links: [{ label: "Docs", href: `${GITHUB}/Tutorials/using%20GH%20actions%20for%20Itch/readme.md` }],
  },
  {
    section: "tutorials",
    emoji: "✅",
    title: "Preparing Your Itch Site",
    desc: "Everything you need before launching your game page. Covers thumbnails, descriptions, tags, pricing, and accessibility.",
    links: [{ label: "Docs", href: `${GITHUB}/Tutorials/preparing%20your%20itch%20site/readme.md` }],
  },
];
