---
name: typography-best-practices
description: Implement professional typography systems with proper hierarchy, readability, and visual harmony.
origin: MCP Market
---

# Typography Best Practices

## Overview
Implement professional typography systems with proper hierarchy, readability, and visual harmony.

## Trigger
- /typography - Start typography implementation

## Capabilities

### Type System Design
- Define type scale (modular scale)
- Establish font families and weights
- Set line heights and letter spacing
- Create type styles hierarchy (h1-h6, body, caption)

### Readability Optimization
- Optimal line length (45-75 characters)
- Appropriate line height (1.4-1.6 for body)
- Adequate paragraph spacing
- Font size accessibility (16px minimum for body)

### Responsive Typography
- Fluid type scaling
- Viewport-based typography
- Container-responsive text
- Print typography adjustments

### Web Font Optimization
- Font loading strategies (FOUT, FOIT, FOFT)
- Subsetting for performance
- Variable fonts usage
- Font display swap optimization

### MCP Tools for Typography
- pickapicon - Access Iconify icon library
- svg-to-fonts - Convert SVG icons to font format

## Type Scale Systems

### Major Third (1.25)
`
xs: 0.64rem (10.24px)
sm: 0.8rem (12.8px)
base: 1rem (16px)
lg: 1.25rem (20px)
xl: 1.563rem (25px)
2xl: 1.953rem (31.25px)
3xl: 2.441rem (39px)
4xl: 3.052rem (48.83px)
`

### Perfect Fourth (1.333)
`
xs: 0.563rem (9px)
sm: 0.75rem (12px)
base: 1rem (16px)
lg: 1.333rem (21.33px)
xl: 1.777rem (28.43px)
2xl: 2.369rem (37.9px)
3xl: 3.157rem (50.52px)
4xl: 4.209rem (67.34px)
`

## Typography Best Practices

### Hierarchy
- Use size, weight, and color for hierarchy
- Limit to 3-4 distinct sizes
- Consistent heading ratios
- Visual balance between elements

### Pairing Fonts
- Limit to 2-3 font families
- Contrast serif with sans-serif
- Match x-heights for harmony
- Consider historical context

### Spacing
- Base spacing on type scale
- Margins should be multiples of base unit
- Tighter spacing for related items
- Generous spacing between sections

### Line Length
- 45-75 characters optimal
- Use max-width for text containers
- Adjust for different screen sizes

## Implementation Guidelines

`css
/* Root type settings */
:root {
  --font-sans: 'Inter', system-ui, sans-serif;
  --font-serif: 'Merriweather', Georgia, serif;
  --font-mono: 'Fira Code', monospace;
  
  --type-scale: 1.25;
  --base-size: 1rem;
  --line-height: 1.6;
}

/* Responsive typography */
html {
  font-size: clamp(100%, 90% + 0.5vw, 125%);
}
`

## Usage Examples
- /typography audit - Analyze typography consistency
- /typography pair [fonts] - Get font pairing recommendations
- /typography scale [ratio] - Generate type scale

## Requirements
- Understanding of type anatomy and terminology
- Knowledge of web font formats and loading
- Design software for type testing

## Related Skills
- design-token-system
- design-system-development
- responsive-design-patterns

