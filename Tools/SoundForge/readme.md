# SFXR ✦ ExcaliburJS Sound Forge

A modern web-based sound effects generator built with React and ExcaliburJS. Create retro-style sound effects and export them for use
in games and applications.

## Overview

Sound Forge is a single-page application (SPA) that provides an intuitive interface for generating and manipulating sound effects. It
leverages ExcaliburJS audio capabilities and React for a responsive, interactive user experience.

## Project Structure

```
GDL sound forge/
├── index.html          # Main SPA file (HTML + inline React + CSS)
├── README.md          # This file
└── .git/              # Git version control
```

## Technology Stack

- **Frontend Framework**: React 18.2.0
- **Rendering**: ReactDOM 18.2.0
- **JSX Compilation**: Babel Standalone 7.23.2
- **Game Framework**: ExcaliburJS
- **Styling**: CSS Grid, CSS Variables (custom design system)
- **Typography**:
  - Space Mono (monospace) - 400, 700 weights
  - Syne (sans-serif) - 400, 700, 800 weights
- **External Dependencies**: Via CDN (React, ReactDOM, Babel)

## Design System

The application uses a sophisticated dark theme with the following color variables:

| Variable     | Purpose                    | Value     |
| ------------ | -------------------------- | --------- |
| `--bg`       | Main background            | `#0a0c10` |
| `--surface`  | Surface elements           | `#111318` |
| `--surface2` | Secondary surface          | `#181b22` |
| `--accent`   | Primary accent (cyan)      | `#00e5ff` |
| `--accent2`  | Secondary accent (pink)    | `#ff3d6b` |
| `--accent3`  | Tertiary accent (yellow)   | `#ffe066` |
| `--accent4`  | Quaternary accent (purple) | `#7c5cfc` |
| `--text`     | Primary text               | `#e8eaf0` |
| `--text2`    | Secondary text             | `#7a8099` |
| `--text3`    | Tertiary text              | `#454d66` |

## Layout Architecture

The application uses a CSS Grid layout:

```
┌─────────────────────────────────────┐
│         Header (52px)               │
├──────────────┬──────────────────────┤
│  Sidebar     │                      │
│  (220px)     │   Main Content       │
│              │   (1fr)              │
├──────────────┴──────────────────────┤
│      Footer (60px)                  │
└─────────────────────────────────────┘
```

## Getting Started

### Prerequisites

- A modern web browser with ES6+ support
- No build tools or installation required (CDN-based)

### Running Locally

1. Clone the repository:

   ```bash
   git clone <repository-url>
   cd "GDL sound forge"
   ```

2. Open `index.html` directly in your browser:

   ```bash
   # On Windows
   start index.html

   # On macOS
   open index.html

   # On Linux
   xdg-open index.html
   ```

   Or use a local development server:

   ```bash
   # Using Python 3
   python -m http.server 8000

   # Using Node.js http-server
   npx http-server
   ```

3. Navigate to `http://localhost:8000` in your browser

## Development Guide

### File Structure

The entire application is contained in a single `index.html` file that includes:

- HTML markup
- Inline CSS (within `<style>` tags)
- JavaScript/React code (within `<script>` tags)

### Modifying the Application

1. **Styling**: Edit the CSS variables or add new styles within the `<style>` block
2. **Functionality**: Modify the React components in the inline JavaScript
3. **HTML Structure**: Update the DOM elements as needed

### Color Customization

To adjust the theme, modify the CSS variables in the `:root` selector:

```css
:root {
  --bg: #0a0c10;
  --accent: #00e5ff;
  /* ... other variables ... */
}
```

### Adding Features

When adding new features:

1. Follow the existing React component patterns
2. Utilize the defined CSS variables for consistency
3. Maintain the responsive grid layout
4. Test on multiple browsers and screen sizes

## Key Features

- **Modern UI**: Dark-themed interface with neon accents
- **Responsive Design**: CSS Grid layout adapts to different screen sizes
- **Sound Generation**: ExcaliburJS-powered sound effect creation
- **Real-time Feedback**: Immediate audio preview
- **Export Capabilities**: Download generated sounds in standard formats

## Browser Support

- Chrome/Chromium 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Performance Considerations

- Uses CDN-hosted libraries to minimize bundle size
- Scanline overlay effect uses GPU acceleration with `pointer-events: none`
- CSS Grid for efficient layout rendering
- Debounce audio generation for smooth user experience

## Building & Deployment

### Local Testing

Simply serve the `index.html` file through a web server. No build step required.

### Production Deployment

1. Test thoroughly in all target browsers
2. Upload `index.html` (and any supporting assets) to your hosting platform
3. Ensure CDN resources are accessible in your deployment environment

### Optimizations

For production deployment, consider:

- Caching `index.html` with appropriate headers
- Using a CDN for CDN-hosted assets
- Minifying inline CSS and JavaScript
- Adding service worker for offline support

## Troubleshooting

### Styles Not Loading

- Check browser console for CSS errors
- Verify Google Fonts CDN is accessible
- Clear browser cache (Ctrl+Shift+Del)

### Sound Not Playing

- Check browser audio permissions
- Verify ExcaliburJS is loaded from CDN
- Check browser console for JavaScript errors

### React Not Rendering

- Verify React and ReactDOM CDN links are accessible
- Check that Babel is compiling JSX correctly
- Look for errors in browser console

## Contributing

When contributing to this project:

1. **Code Style**: Maintain consistent formatting with the existing code
2. **Naming Conventions**: Use camelCase for variables and functions
3. **Comments**: Document complex logic and non-obvious implementations
4. **Testing**: Test changes across multiple browsers before submitting

## Future Enhancements

Potential areas for improvement:

- Modularize code into separate files
- Add unit tests
- Implement PWA capabilities
- Support multiple export formats
- Add preset management system
- Community sound library integration

## License

[Add your license information here]

## Contact & Support

For questions or suggestions, please open an issue or contact the development team.

---

**Last Updated**: April 2026  
**Project**: GDL SoundForge with ExcaliburJS  
**Status**: Active Development
