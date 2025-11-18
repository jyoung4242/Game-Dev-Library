# UUID Utility

A tiny, dependency-free UUID (v4-style) generator written in TypeScript.  
Perfect for games, tools, and any situation where you need quick unique identifiers without pulling in a full UUID library.

## Features

- 🎯 **Lightweight** — zero dependencies
- ⚡ **Fast** — uses simple bitwise ops and random generation
- 🧩 **Drop-in utility** — just import and call
- 📦 **Generates RFC4122-style UUIDs** (`xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx`)

## Installation

Simply copy the module into your project or import it as needed:

```ts
import { UUID } from "./UUID";
```

## Usage

Generate a UUID:

```ts
const id = UUID.generateUUID();
console.log(id);
// → "3fa85f64-5717-4562-b3fc-2c963f66afa6"
```

Use it anywhere you need unique identifiers:

- Entity IDs
- Component or system IDs
- Save-file keys
- Network message tracking
- Procedural generation seeds

## API

```ts
UUID.generateUUID(): string
```

Generates a pseudo-random UUID in the standard v4 pattern:

`xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx`

Where:

4 indicates a version 4 UUID

y indicates variant bits (8, 9, a, b)

## Implementation

```ts
export class UUID {
  static generateUUID(): string {
    let uuid = "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx";
    return uuid.replace(/[xy]/g, function (c) {
      const r = (Math.random() * 16) | 0;
      const v = c === "x" ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }
}
```

## Notes

⚠️ This implementation is sufficient for games and general utilities, but it is not cryptographically secure.

If you need crypto-grade randomness (e.g., security tokens), consider crypto.randomUUID() or a dedicated UUID package.

## License

MIT — free to use in commercial and personal projects.
