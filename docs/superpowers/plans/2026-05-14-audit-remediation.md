# Audit Remediation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Resolve all high-severity findings and quality issues identified in the Project Audit Cycle 1.

**Architecture:** Systematic remediation of security, licensing, testing, and code quality issues. We will start with low-hanging fruit (licensing), move to infrastructure (linting/testing), fix security vulnerabilities (library migration), and finish with mass code cleanup.

**Tech Stack:** React, Vite, Vitest, Playwright, ESLint, Prettier, ExcelJS.

---

### Task 1: Licensing & Metadata

**Files:**

- Create: `LICENSE`
- Modify: `package.json`

- [ ] **Step 1: Add MIT License file**
- [ ] **Step 2: Update package.json with license field**
- [ ] **Step 3: Commit**

### Task 2: Linting & Formatting Infrastructure

**Files:**

- Modify: `package.json`
- Create: `.eslintrc.json`, `.prettierrc`, `.eslintignore`, `.prettierignore`

- [ ] **Step 1: Install ESLint and Prettier dependencies**
- [ ] **Step 2: Create ESLint configuration**
- [ ] **Step 3: Create Prettier configuration**
- [ ] **Step 4: Add lint and format scripts to package.json**
- [ ] **Step 5: Run formatting on the codebase**
- [ ] **Step 6: Commit**

### Task 3: Testing Infrastructure Setup

**Files:**

- Modify: `package.json`, `vite.config.ts`
- Create: `vitest.config.ts` (if needed) or update `vite.config.ts`

- [ ] **Step 1: Install Vitest and React Testing Library dependencies**
- [ ] **Step 2: Configure Vitest in vite.config.ts**
- [ ] **Step 3: Install Playwright and setup browser binaries**
- [ ] **Step 4: Verify npm test runs (even if empty)**
- [ ] **Step 5: Commit**

### Task 4: Security - Replace `xlsx` with `exceljs`

**Files:**

- Modify: `package.json`, `src/utils/export.ts` (and any other files using `xlsx`)

- [ ] **Step 1: Identify all usages of `xlsx`**
- [ ] **Step 2: Install `exceljs` and uninstall `xlsx`**
- [ ] **Step 3: Refactor export logic to use `exceljs`**
- [ ] **Step 4: Verify build passes**
- [ ] **Step 5: Commit**

### Task 5: Dead Code & Dependency Cleanup

**Files:**

- Modify: `package.json`
- Delete: 120+ unused files identified by `knip`

- [ ] **Step 1: Run `knip` to refresh the list of unused artifacts**
- [ ] **Step 2: Systematic deletion of unused files**
- [ ] **Step 3: Uninstall unused dependencies**
- [ ] **Step 4: Remove unused exports and types**
- [ ] **Step 5: Verify build passes**
- [ ] **Step 6: Commit**

### Task 6: Final Verification

- [ ] **Step 1: Run `npm run build`**
- [ ] **Step 2: Run `npm run lint`**
- [ ] **Step 3: Run `npm test`**
- [ ] **Step 4: Commit and finalize report**
