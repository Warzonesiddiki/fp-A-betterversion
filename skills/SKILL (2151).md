---
name: ui-component-architecture
description: Design scalable, maintainable UI component architectures with proper separation of concerns and reusability patterns.
origin: MCP Market
---

# UI Component Architecture

## Overview
Design scalable, maintainable UI component architectures with proper separation of concerns and reusability patterns.

## Trigger
- /component-arch - Start component architecture planning

## Capabilities

### Architectural Patterns
- Atomic design methodology (atoms, molecules, organisms, templates, pages)
- Compound components with implicit state sharing
- Render props and hooks patterns
- Headless UI with accessible behavior primitives

### Component Types
- Presentational components (pure UI, no business logic)
- Container components (data fetching, state management)
- Higher-order components (cross-cutting concerns)
- Custom hooks (logic extraction and reuse)

### API Design
- Consistent prop naming conventions
- Type-safe interfaces with TypeScript
- Default values and validation
- Extension points (slots, render props, customization)

### State Management
- Local component state patterns
- Context for shared UI state
- Derived state optimization
- Immutability patterns for predictability

### MCP Tools for Component Development
- stitch-pro - Transform UI to production components
- design-copier - Extract CSS from web pages
- svg-to-fonts - Convert icons to web fonts
- avicon - Generate favicon assets

## Architecture Principles

1. **Single Responsibility**: Each component does one thing well
2. **Composability**: Build complex UIs from simple pieces
3. **Predictability**: Consistent behavior across components
4. **Accessibility**: Built-in a11y support
5. **Testability**: Easy to unit test in isolation

## Component Categories

### Atoms
- Buttons, inputs, labels, icons
- Basic building blocks
- No dependencies on other components

### Molecules
- Form fields, cards, navigation items
- Composed from atoms
- Self-contained functionality

### Organisms
- Headers, sidebars, data tables
- Complex compositions
- May have business logic

### Templates
- Page layouts, content structures
- Define arrangement, not content

### Pages
- Complete application views
- Connect to data and routing

## Usage Examples
- /component-arch analyze - Review current component structure
- /component-arch refactor [component] - Improve component architecture
- /component-arch create [type] - Scaffold new component

## Requirements
- Component framework knowledge (React, Vue, Svelte)
- TypeScript proficiency for type safety
- CSS/SCSS or CSS-in-JS understanding

## Related Skills
- design-system-development
- responsive-design-patterns
- accessibility-wcag-compliance
- figma-to-code-workflow

