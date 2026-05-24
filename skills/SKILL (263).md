---
name: tailwind-css-patterns
description: Tailwind CSS utility patterns, responsive design, custom themes, component styling
user-invocable: true
---

# Tailwind CSS Patterns

Apply when: styling components, creating layouts, working with Tailwind utilities.

## Rules
- Utility-first — no CSS modules or inline styles
- Use `@apply` sparingly (only for repeated patterns)
- Mobile-first breakpoints: `sm:` `md:` `lg:` `xl:`
- Use design tokens via `tailwind.config.js`

## Common Patterns
- Flexbox: `flex items-center justify-between`
- Grid: `grid grid-cols-3 gap-4`
- Card: `rounded-lg shadow-md p-6 bg-white dark:bg-gray-800`
- Button: `px-4 py-2 rounded font-medium transition-colors`
- Input: `w-full px-3 py-2 border rounded-md focus:ring-2`

## Dark Mode
- Use `dark:` prefix: `bg-white dark:bg-gray-900`
- Test both modes

## Responsive
- Stack on mobile: `flex-col md:flex-row`
- Hide on mobile: `hidden md:block`
- Full width on mobile: `w-full md:w-auto`
