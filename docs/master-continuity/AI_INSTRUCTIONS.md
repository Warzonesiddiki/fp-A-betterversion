# AI Continuity & Handover Instructions

## 🚨 MANDATORY INSTRUCTION FOR NEW AI AGENTS (OPENCODE / GEMINI)

You are taking over a project aimed at **Institutional Perfection**. You MUST follow these protocols to ensure continuity and superhuman accuracy.

---

### 1. Absolute Global Rules (Mandatory)

These rules apply to all development activity across this project and everywhere moving forward:

- **Caching Strategies:** ALWAYS implement caching to store frequently accessed data or results. This is critical to reduce response times, avoid redundant computations, and improve efficiency in production environments.
- **Batch Processing:** Whenever executing multiple commands or logic steps, batch them together. This reduces the overhead of multiple calls and minimizes time spent on context switching.

### 2. Environment Setup: Everything Claude Code (ECC)

The project uses the ECC toolsuite to enforce quality gates. If you are starting fresh, you MUST set up your environment to match this pattern:

#### For OpenCode/Gemini CLI:

1. **Add Marketplace:** `/plugin marketplace add https://github.com/affaan-m/everything-claude-code`
2. **Install ECC:** `/plugin install ecc`
3. **Activation:** Call `activate_skill(name="auto-activator")` and `activate_skill(name="using-superpowers")`.
4. **Target 100% Coverage:** Edit your rules (`.gemini/rules` or `.claude/rules`) to ensure `testing-requirements.md` and `code-review.md` reflect **100% test coverage** targets.

---

### 3. Operational Directives

- **Zero Hallucination Policy:** All financial logic MUST reside in the TypeScript engines (`src/engines/`) or the Rust backend. NEVER use AI to perform raw math.
- **TDD First:** Do NOT write implementation code without a failing test case first. Use the `tdd-workflow` skill.
- **Surgical Edits:** Use the `replace` tool for precision. Do not overwrite files unless necessary.
- **Verification Loop:** Before claiming a task is done, run:
  - `npm run build`
  - `npm run test`
  - `npx tsc --noEmit`
- **Contextual Precedence:** Read `docs/master-continuity/VISION.md` before starting any major architectural change.

---

### 3. Handover Protocol

Before you stop work, you MUST update the `docs/master-continuity/EXECUTION_LOG.md` with:

1. **What was completed** (file paths and specific logic).
2. **What is pending** (next immediate steps).
3. **Current Blockers** (e.g., missing tools, environment issues).
4. **Next Agent Instructions** (Specific advice for your successor).

---

### 4. Technical Constraints

- **Offline First:** No cloud backends (except for the Gemini Narrative API).
- **SQLite Local:** All data must persist to `src-tauri/finplan.db`.
- **Anonymization:** Any data sent to the AI for narrative translation MUST be anonymized in the Rust layer first.

---

**Status:** ACTIVE
**Last Updated:** 2026-05-15
