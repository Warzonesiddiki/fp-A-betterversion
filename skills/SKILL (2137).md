---
name: design-token-system
description: Create and manage design tokens as the single source of truth for visual design decisions across platforms and technologies.
origin: MCP Market
---
# Design Token System

## Overview
Create and manage design tokens as the single source of truth for visual design decisions across platforms and technologies.

## Trigger
- /tokens - Start design token management

## Capabilities

### Token Categories

#### Primitive Tokens
- Raw values (colors, spacing, font sizes)
- Platform-agnostic foundation
- Not directly used in components
- Examples: #FF5733, 16px, 1rem

#### Semantic Tokens
- Meaning-based abstractions
- Abstract from primitive values
- Examples: color-primary, spacing-md, font-body

#### Component Tokens
- Component-specific tokens
- Maps to semantic tokens
- Examples: button-background, input-border

### Token Types

#### Colors
- Brand colors (primary, secondary, accent)
- Neutral colors (grays, blacks, whites)
- Semantic colors (success, warning, error, info)
- Surface colors (background, surface, overlay)
- Text colors (primary, secondary, disabled)

#### Typography
- Font families
- Font sizes
- Font weights
- Line heights
- Letter spacing

#### Spacing
- Base unit (4px, 8px, etc.)
- Scale multipliers (xs, sm, md, lg, xl)
- Component-specific spacing

#### Borders
- Border widths
- Border radii
- Border colors

#### Shadows
- Elevation levels
- Color/opacity variations

#### Motion
- Duration values
- Easing curves
- Transition patterns

### Token Formats
- CSS custom properties
- SCSS variables
- JSON (platform-agnostic)
- JavaScript/TypeScript objects
- Swift/Kotlin for native

### MCP Tools for Design Tokens
- decantr - Design verification and governance

## Workflow Steps

1. Define: Identify all visual properties
2. Categorize: Organize into token hierarchy
3. Transform: Generate format-specific outputs
4. Integrate: Sync with design tools (Figma) and code
5. Document: Create usage guidelines
6. Govern: Enforce token usage across projects

## Integration Patterns

### Design Tool Sync
- Figma plugins for token management
- Token Studio for Figma
- Sync design and code tokens

### Code Integration
- Style-dictionary for transformation
- CSS custom properties for runtime
- Build-time token injection

### Version Control
- Semantic versioning for token updates
- Changelog for changes
- Migration guides for breaking changes

## Usage Examples
- /tokens export [format] - Export tokens in specific format
- /tokens sync - Sync tokens between design and code
- /tokens migrate - Migrate to new token structure

## Requirements
- Design system architecture knowledge
- Build tool familiarity (npm, webpack)
- Design tool integration (Figma)

## Related Skills
- design-system-development
- typography-best-practices
- figma-to-code-workflow
