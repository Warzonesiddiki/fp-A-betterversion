---
name: accessibility-wcag-compliance
description: Build accessible interfaces that meet WCAG 2.1 AA and AAA standards, ensuring inclusive experiences for all users.
origin: MCP Market
---

# Accessibility (WCAG) Compliance

## Overview
Build accessible interfaces that meet WCAG 2.1 AA and AAA standards, ensuring inclusive experiences for all users.

## Trigger
- /a11y - Start accessibility implementation and testing

## Capabilities

### WCAG Principles (POUR)
- **Perceivable**: Information presented can be perceived
- **Operable**: Interface components are operable by all users
- **Understandable**: Content and interface are understandable
- **Robust**: Content works with current and future technologies

### Accessibility Requirements
- Semantic HTML structure and landmarks
- ARIA roles, states, and properties
- Keyboard navigation and focus management
- Color contrast ratios (4.5:1 for normal text)
- Text alternatives for non-text content
- Resizable text up to 200%
- No seizure-inducing content

### Testing and Validation
- Automated testing with axe-core, WAVE, Lighthouse
- Screen reader testing (NVDA, VoiceOver, JAWS)
- Keyboard-only navigation testing
- Color blindness simulation
- Motor impairment simulation

### Accessible Components
- Form labels and error handling
- Modal dialogs with focus trap
- Dynamic content announcements
- Drag-and-drop alternatives
- Rich text editor accessibility

### MCP Tools for Accessibility
- decantr - Design verification for AI-generated UI

## WCAG Success Criteria Coverage

### Level A (Essential)
- Non-text content alternatives (1.1.1)
- Info and relationships (1.3.1)
- Meaningful sequence (1.3.2)
- Sensory characteristics (1.3.3)
- Keyboard accessibility (2.1.1)
- No keyboard trap (2.1.2)
- Language of page (3.1.1)
- On focus (3.2.1)

### Level AA (Enhanced)
- Contrast (minimum) (1.4.3)
- Resize text (1.4.4)
- Keyboard (2.1.1)
- Skip links (2.4.1)
- Page titled (2.4.2)
- Link purpose (2.4.4)
- Multiple ways (2.4.5)
- Headings and labels (2.4.6)
- Focus visible (2.4.7)

### Level AAA (Optimal)
- Contrast (enhanced) (1.4.6)
- Low or no background audio (1.4.7)
- Reading level (3.1.5)
- Pronunciation (3.1.6)

## Implementation Checklist

1. [ ] Semantic HTML landmarks (nav, main, aside, footer)
2. [ ] Heading hierarchy (single h1 per page)
3. [ ] Alt text for all meaningful images
4. [ ] Form labels and error messages
5. [ ] Keyboard accessible all interactive elements
6. [ ] Focus indicators visible
7. [ ] Color contrast 4.5:1 minimum
8. [ ] ARIA labels where needed
9. [ ] Skip to main content link
10. [ ] No content relies solely on color

## Usage Examples
- /a11y audit - Run comprehensive accessibility audit
- /a11y fix [issue] - Get fix for specific accessibility issue
- /a11y check [component] - Analyze component accessibility
- /a11y wcag [level] - Get WCAG requirements at level

## Requirements
- Understanding of assistive technologies
- Accessibility testing tools
- Knowledge of ARIA specifications

## Related Skills
- ui-component-architecture
- responsive-design-patterns
- design-system-development

