---
name: responsive-design-patterns
description: Implement responsive user interfaces that adapt gracefully across all device sizes and input methods.
origin: MCP Market
---

# Responsive Design Patterns

## Overview
Implement responsive user interfaces that adapt gracefully across all device sizes and input methods.

## Trigger
- /responsive - Start responsive design implementation

## Capabilities

### Breakpoint Strategies
- Mobile-first vs desktop-first approaches
- Fluid typography and spacing scaling
- Container queries for component-level responsiveness
- Viewport-based media queries

### Layout Patterns
- Grid systems (CSS Grid, Flexbox)
- Masonry and waterfall layouts
- Card-based designs with flexible rows
- Sticky headers and navigation
- Off-canvas menus for mobile

### Component Responsiveness
- Responsive images with srcset and picture elements
- Touch-friendly tap targets (44px minimum)
- Collapsible content and accordions
- Swipe gestures for mobile interactions
- Form field optimization for mobile keyboards

### Performance Optimization
- Lazy loading and code splitting
- Image optimization and next-gen formats
- Critical CSS extraction
- Responsive loading strategies

### MCP Tools for Responsive Design
- media-generator - Generate responsive image assets
- imgmcp - Unified AI image API for various formats

## Responsive Design Principles

1. **Content-First**: Prioritize content hierarchy over fixed layouts
2. **Progressive Enhancement**: Base experience works everywhere
3. **Fluid Proportions**: Use relative units (%, rem, vw/vh)
4. **Touch-Ready**: Design for fingers, not just cursors
5. **Performance-Conscious**: Optimize for slow connections

## Breakpoint Reference

### Common Breakpoints
- **Mobile**: 0-479px
- **Tablet Portrait**: 480-767px
- **Tablet Landscape**: 768-1023px
- **Desktop**: 1024-1439px
- **Large Desktop**: 1440px+

### Custom Breakpoints
- Define based on content, not devices
- Use container queries for component isolation
- Consider orientation changes

## Implementation Patterns

### Container Queries
`css
@container (min-width: 400px) {
  .card { flex-direction: row; }
}
`

### Fluid Typography
`css
font-size: clamp(1rem, 0.5rem + 2vw, 2rem);
`

### Aspect Ratio
`css
aspect-ratio: 16 / 9;
`

## Usage Examples
- /responsive check - Analyze current responsiveness
- /responsive pattern [name] - Get specific pattern implementation
- /responsive audit - Test across breakpoints

## Requirements
- CSS media queries and modern layout (Grid, Flexbox)
- Understanding of viewport units and container queries
- Mobile device testing capabilities

## Related Skills
- ui-component-architecture
- accessibility-wcag-compliance
- typography-best-practices

