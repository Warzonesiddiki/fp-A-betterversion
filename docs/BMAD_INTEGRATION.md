# BMAD-METHOD Integration for FinPlan Pro

## What We Learned

BMAD-METHOD (Breakthrough Method for Agile AI Driven Development) provides structured, agent-assisted software delivery patterns. Key concepts integrated:

### 1. Adversarial Review Pattern

**From:** `bmad-review-adversarial-general`
**Application:** Every feature gets a cynical review before merge
**Implementation:** Use `ce-security-reviewer`, `ce-performance-reviewer`, `ce-testing-reviewer` agents

### 2. Scale-Domain-Adaptive Intelligence

**From:** BMAD core philosophy
**Application:** Adjust planning depth based on task scope
**Implementation:**

- Bug fix → lightweight treatment (1 agent, direct work)
- Feature → standard planning (2 agents, plan first)
- Enterprise → comprehensive planning (5 agents, full lifecycle)

### 3. Specialized Agent Personas

**From:** BMAD 12+ domain-expert agents
**Application:** Use specialized agents for domain-specific work
**Implementation:**

- `a1-consolidation` — multi-entity, IC elimination
- `a2-reports` — reporting, keyboard, sectors, a11y
- `a3-persistence` — persistence, import, Tauri
- `a4-onboarding` — onboarding, FX, compliance, docs
- `a5-content` — enterprise depth across 10 domains

### 4. Skills Architecture

**From:** BMAD modular skill system
**Application:** Use skills on demand
**Implementation:**

- `bmad-brainstorming` — structured ideation
- `bmad-review-adversarial-general` — cynical review
- `bmad-distillator` — extract key insights
- `bmad-party-mode` — multi-agent collaboration

### 5. Complete Lifecycle Coverage

**From:** BMAD workflow architecture
**Application:** Cover entire development lifecycle
**Implementation:**

- Brainstorm → Analyze → Plan → Architecture → Implement → Deploy
- Each phase has specific agents and skills
- Artifacts flow between phases

## BMAD Skills Available

| Skill                           | Purpose                   | When to Use        |
| ------------------------------- | ------------------------- | ------------------ |
| bmad-brainstorming              | Structured ideation       | New feature design |
| bmad-review-adversarial-general | Cynical review            | Before merge       |
| bmad-review-edge-case-hunter    | Edge case analysis        | Testing phase      |
| bmad-distillator                | Extract insights          | Document review    |
| bmad-party-mode                 | Multi-agent collaboration | Complex decisions  |
| bmad-advanced-elicitation       | Deep requirements         | Requirements phase |

## Integration with FinPlan Pro Workflow

### Before Building Feature

1. Use `bmad-brainstorming` to generate ideas
2. Use `bmad-advanced-elicitation` for requirements
3. Create plan with `gsd-plan-phase`

### During Implementation

1. Use specialized agents (a1-a5) for domain work
2. Use `ce-*` reviewers for code quality
3. Run tests after each change

### After Implementation

1. Use `bmad-review-adversarial-general` for cynical review
2. Use `bmad-review-edge-case-hunter` for edge cases
3. Use `bmad-distillator` to extract learnings

## Key BMAD Principles Applied

1. **Scale-Domain-Adaptive** — adjust effort to task size
2. **Specialized Agents** — domain experts for domain work
3. **Adversarial Review** — assume problems exist, find them
4. **Structured Creativity** — brainstorm before building
5. **Complete Lifecycle** — cover entire development process
