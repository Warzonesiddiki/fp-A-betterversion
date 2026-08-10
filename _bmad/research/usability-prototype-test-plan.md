# Usability Prototype Test Plan — FinPlan Pro

> **Status:** READY FOR PRIMARY RESEARCH · **Purpose:** Test the research hypotheses before broad UI migration.

## Test objective

Determine whether the proposed controlled close-to-decision-to-board-pack experience improves understanding, confidence, and action compared with the participant’s current workflow or a generic KPI dashboard.

## Prototype scenarios

| Scenario | Persona | Success behavior | Hypotheses tested |
|---|---|---|---|
| Find the material issue | CFO / VP Finance | identifies the most material variance, baseline, freshness, and why it ranks first | R-04, A-03 |
| Verify before acting | CFO / Controller | opens evidence and explains source, policy, lineage, owner, and next action | R-03, A-03 |
| Triage a close blocker | Controller | identifies blocker, missing evidence, exception path, and certification impact | R-03, A-03 |
| Change a forecast safely | FP&A analyst | edits a driver/formula, sees impact, resolves validation, submits correct version | R-01, A-03 |
| Recover from conflict/offline | FP&A analyst / IT | understands queued/not-official state and resolves a revision conflict | A-02, A-04 |
| Review a board-pack number | CFO / board-prep | distinguishes snapshot from live data and retrieves permitted evidence | R-03 |

## Test method

1. Start with the participant’s last real workflow; do not show FinPlan first.
2. Show a realistic but sanitized prototype with named period, entity, currency, version, freshness, and lifecycle states.
3. Ask the participant to think aloud. Do not teach the interface or explain policy logic unless they request help.
4. Capture completion, time, hesitation, errors, exact language, confidence, and workaround preference.
5. Ask a counterfactual: “What would you do instead in your current tools?”
6. Record disconfirming evidence first in the Evidence Log.

## Metrics

| Metric | Target hypothesis | Failure signal |
|---|---|---|
| Task completion | ≥80% unassisted for each core task in early prototype | participant cannot identify next action or evidence path |
| Materiality comprehension | participant explains ranking/baseline without prompting | treats severity as unexplained red/green visual |
| Trust / evidence retrieval | participant retrieves and interprets source/lineage | exports or asks for an analyst to verify |
| Model safety | participant understands draft/queued/conflict/locked state | assumes local change is official or overwrites conflict |
| Perceived value | participant names a real current workaround this would replace | calls it another dashboard/tool duplicate |

## Prototype fidelity requirements

Use decision-realistic data, not visual-only placeholder metrics. Clearly label every simulated integration, AI narrative, policy, or data state. A prototype may not imply that unsupported controls are currently shipped.

## Synthesis decision rules

- If CFOs do not understand materiality ranking, redesign the Decision Workspace before implementation.
- If controllers reject the close control model, revisit the product wedge and close contract.
- If analysts reject the grid workflow, preserve/extend Excel interoperability before building custom interaction breadth.
- If IT rejects hybrid/local-first, update A-02 and revise architecture/deployment direction.
- If no persona identifies a compelling workflow replacement, stop and reconsider ICP/value proposition.
