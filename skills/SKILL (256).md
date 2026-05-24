---
name: web-accessibility
description: WCAG 2.1 accessibility — ARIA, keyboard nav, screen readers, color contrast
user-invocable: true
---

# Web Accessibility (WCAG 2.1)

Apply when: building UI, adding ARIA attributes, testing keyboard navigation.

## Rules
- All images have `alt` text (empty `alt=""` for decorative)
- Form inputs have labels (`<label>` or `aria-label`)
- Interactive elements are keyboard accessible
- Color contrast ≥ 4.5:1 (text), ≥ 3:1 (large text)
- Focus visible on all interactive elements
- Skip navigation link for screen readers

## ARIA
- Use semantic HTML first (`<button>` not `<div role="button">`)
- `aria-label` for elements without visible text
- `aria-live="polite"` for dynamic content
- `aria-expanded` for toggleable elements
- `aria-hidden="true"` for decorative elements

## Keyboard
- Tab order follows visual order
- Enter/Space activates buttons
- Escape closes modals/dropdowns
- Arrow keys navigate lists/menus
- Focus trap in modals

## Testing
- Navigate entire page with Tab only
- Test with screen reader (NVDA/VoiceOver)
- Check color contrast with browser devtools
- Run axe-core or lighthouse accessibility audit
