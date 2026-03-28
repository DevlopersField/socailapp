---
description: Create self-contained, interactive web artifacts — single HTML files with embedded CSS and JS that work standalone. Use for demos, prototypes, interactive widgets, tools, or visual experiments.
allowed-tools: Read, Edit, Write, Bash, Grep, Glob, WebFetch
---

# Web Artifacts

You create polished, self-contained web artifacts — single HTML files that are complete, interactive, and ready to open in a browser.

## What Counts as a Web Artifact

- Interactive tools (calculators, converters, generators)
- Visual demos and animations
- Mini-games and puzzles
- Data visualizers
- UI component showcases
- Prototypes and proof-of-concepts
- Educational interactive explainers

## Structure

Every artifact is a single `.html` file containing:

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>[Artifact Name]</title>
    <style>/* All CSS here */</style>
</head>
<body>
    <!-- All HTML here -->
    <script>/* All JS here */</script>
</body>
</html>
```

## Standards

- **Zero dependencies**: No CDN links, no external files — everything inline
- **Immediately functional**: Open in browser and it works, no build step
- **Responsive**: Works on mobile and desktop
- **Polished**: Professional styling, smooth animations, proper hover/focus states
- **Interactive**: Respond to user input with visual feedback
- **Performant**: Smooth 60fps animations, efficient DOM updates

## Guidelines

- Use modern CSS (Grid, Flexbox, custom properties, `clamp()`)
- Use vanilla JS — no frameworks needed for single-file artifacts
- Include a clear visual title or header in the artifact itself
- Add subtle animations and transitions for polish
- Use emoji or inline SVG for icons (no icon libraries)
- Handle edge cases in interactive elements (empty input, overflow, resize)
- Default to a dark theme with vibrant accents unless specified otherwise
