```markdown
# fp-A-betterversion Development Patterns

> Auto-generated skill from repository analysis

## Overview
This skill teaches the core development patterns and conventions used in the `fp-A-betterversion` TypeScript project, which is built with the Vite framework. You'll learn how to structure files, write and import code, follow commit conventions, and run tests using vitest. This guide ensures consistency and efficiency for contributors.

## Coding Conventions

### File Naming
- Use **camelCase** for file names.
  - Example: `userProfile.ts`, `dataFetcher.ts`

### Import Style
- Prefer **alias-based imports** for internal modules.
  - Example:
    ```typescript
    import { fetchData } from '@/utils/dataFetcher'
    ```

### Export Style
- Use a **mixed** export style (both named and default exports are present).
  - Named export example:
    ```typescript
    export function calculateSum(a: number, b: number): number {
      return a + b
    }
    ```
  - Default export example:
    ```typescript
    export default MyComponent
    ```

### Commit Messages
- Follow **conventional commit** format.
- Use the `chore` prefix for maintenance or tooling changes.
- Keep commit messages concise (average ~45 characters).
  - Example: `chore: update dependencies to latest version`

## Workflows

### Commit Changes
**Trigger:** When making any code, config, or dependency update  
**Command:** `/commit-changes`

1. Stage your changes:
   ```bash
   git add .
   ```
2. Write a conventional commit message, using `chore` as needed:
   ```bash
   git commit -m "chore: update README with new instructions"
   ```
3. Push your changes:
   ```bash
   git push
   ```

### Run Tests
**Trigger:** Before pushing or merging code  
**Command:** `/run-tests`

1. Run all tests using vitest:
   ```bash
   npx vitest run
   ```
2. Review output and fix any failing tests.

### Add a New Module
**Trigger:** When creating a new feature or utility  
**Command:** `/add-module`

1. Name your file in camelCase, e.g., `newFeature.ts`.
2. Place the file in the appropriate directory.
3. Use alias imports for dependencies.
4. Export your functions or components (named or default as appropriate).
5. Write corresponding tests in a file named `newFeature.test.ts`.

## Testing Patterns

- Use **vitest** for all tests.
- Test files should follow the pattern: `*.test.ts`.
  - Example: `userProfile.test.ts`
- Place test files alongside the modules they test or in a dedicated `__tests__` directory.
- Example test:
  ```typescript
  import { calculateSum } from '@/utils/calculateSum'

  test('adds two numbers', () => {
    expect(calculateSum(2, 3)).toBe(5)
  })
  ```

## Commands
| Command         | Purpose                                      |
|-----------------|----------------------------------------------|
| /commit-changes | Guide to committing code with conventions    |
| /run-tests      | Run all vitest tests                         |
| /add-module     | Steps to add a new module with conventions   |
```
