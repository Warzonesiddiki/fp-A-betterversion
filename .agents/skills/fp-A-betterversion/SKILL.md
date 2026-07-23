```markdown
# fp-A-betterversion Development Patterns

> Auto-generated skill from repository analysis

## Overview
This skill teaches you the core development patterns and conventions used in the `fp-A-betterversion` TypeScript repository. You'll learn how to structure files, write and organize code, follow commit message standards, and implement and run tests according to the project's style. This guide is ideal for contributors seeking to maintain consistency and quality in this codebase.

## Coding Conventions

### File Naming
- Use **camelCase** for file names.
  - Example: `myUtilityFunction.ts`, `userProfile.test.ts`

### Import Style
- Use **alias imports** to reference modules.
  - Example:
    ```typescript
    import { myFunction } from '@/utils/myUtilityFunction';
    ```

### Export Style
- Use **named exports** for all modules.
  - Example:
    ```typescript
    // utils/myUtilityFunction.ts
    export function myFunction() { ... }
    ```

### Commit Messages
- Follow the **Conventional Commits** standard.
- Use the `feat` prefix for new features.
- Keep commit messages concise (average: 76 characters).
  - Example:
    ```
    feat: add user authentication middleware
    ```

## Workflows

### Feature Development
**Trigger:** When adding a new feature  
**Command:** `/feature-development`

1. Create a new TypeScript file using camelCase naming.
2. Implement your feature using named exports.
3. Import dependencies using alias imports.
4. Write corresponding test files named as `featureName.test.ts`.
5. Commit your changes with a `feat:` prefix and a concise description.

### Testing
**Trigger:** When verifying code correctness  
**Command:** `/run-tests`

1. Ensure your test files follow the `*.test.*` naming pattern.
2. Use the project's (unknown) test runner to execute all tests.
   - Example (if using a common runner):
     ```
     npm test
     ```
3. Review test results and fix any failing cases.

## Testing Patterns

- Test files are named using the pattern: `*.test.*` (e.g., `userProfile.test.ts`).
- The specific testing framework is not detected, but tests should be colocated with or near the code they verify.
- Example test file structure:
  ```typescript
  // userProfile.test.ts
  import { getUserProfile } from '@/services/userProfile';

  describe('getUserProfile', () => {
    it('returns correct user data', () => {
      // test implementation
    });
  });
  ```

## Commands
| Command              | Purpose                                 |
|----------------------|-----------------------------------------|
| /feature-development | Start a new feature with conventions    |
| /run-tests           | Run all tests in the codebase           |
```
