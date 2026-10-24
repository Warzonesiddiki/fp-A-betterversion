# 11 · Anti-fabrication and work quality

Rules for preventing faked work, fake markers, and low-quality submissions. This
document owns **metric integrity** — the set of rules that stopped the 2026-10-24
fake-marker incident from recurring. It extends, and cross-references, the
existing rules in `AGENTS.md` §2 (project contract) and `04_ENGINEERING_RULES.md`
§L (forbidden acts); it does not duplicate them.

Status: rules 2026-10-24 · owner: project quality · every rule has a gate that
can fail it — a rule without a gate is prose, not a control.

---

## A · The incident this doc exists to prevent

**What happened.** The money-adoption ratchet counted a module as "adopted" if it
imported `@/utils/money`. A migration pass seeded **894 modules** with a no-op:

```ts
// Money adoption: decimal precision
import { toDecimal } from '@/utils/money';
const _moneyAdoptionMarker = toDecimal(0);
```

The import and the `toDecimal(0)` call tripped the counter. Reported adoption:
**87.35 %**. Genuine adoption (a module that actually calls a money helper in a
money computation) was **30.16 %** — 571 of the 894 were marker-only. The
ratchet had been counting _presence_, and the migration skill actively taught
the marker as step 3.

**The three defects.** This was not one bug; it was three, and all three had to
line up:

| Defect            | What it was                                                         | Fixed by                                                |
| ----------------- | ------------------------------------------------------------------- | ------------------------------------------------------- |
| **Metric design** | the ratchet counted imports (a proxy) instead of calls (behaviour)  | `money-adoption.mjs` genuine-use rule, commit `177b6f9` |
| **Process**       | the `money-adoption-migration` skill _instructed_ adding the marker | skill rewritten to FORBID markers, commit `b180fa7`     |
| **Detection**     | nothing scanned src for the marker pattern                          | `scripts/placeholder-audit.mjs`, this doc               |

Reading the existing rules, the failure was **not** "no one wrote a rule against
fabrication." `AGENTS.md` §2 #1 ("Measured, or not stated") and #2 ("Nothing is
done without evidence"), `04_ENGINEERING_RULES.md` §L #2 and #3, and the
`fabrication:audit` gate all already existed. The failure was **metric design and
enforcement**: the rules said _don't claim unrun work_, but the ratchet was built
to be claimable, and no gate could see the marker. This doc closes that gap.

---

## B · Metric-integrity rules

Each rule: statement, why, gate. Rule IDs are `MI-nn` (metric integrity).

| ID        | Rule                                                                                                                                                                                                                                             | Why                                                                                                                                                                    | Gate                                                                                    |
| --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| **MI-01** | **Measure behaviour, not presence.** A ratchet counts what code _does_ (a call, a computed value), never what it _has_ (an import, a declaration, a name, a comment).                                                                            | An import is a proxy a no-op can satisfy; a call is behaviour only real code produces. The 87.35 % → 30.16 % gap was exactly this.                                     | `money-adoption.mjs` genuine-use rule                                                   |
| **MI-02** | **No marker, stub, void, or placeholder to trip a gate.** `_moneyAdoptionMarker = toDecimal(0)`, `void 0;`, `// Money adoption:` — all forbidden, zero-tolerance. A counter is earned by behaviour, never by a symbol that exists to be counted. | The marker class is the exact fake this incident produced; it can recur under any name.                                                                                | `placeholder:audit` (zero-tolerance)                                                    |
| **MI-03** | **Every ratchet ships an anti-gaming check.** Before a ratchet is trusted, write the check that fails if the metric is gamed — the _exact_ fake that would have tripped it — and run it in `check`.                                              | A ratchet with no gaming check is unfalsifiable; it cannot detect its own failure mode.                                                                                | `placeholder:audit` + `money-adoption.mjs` marker check, both in `check`                |
| **MI-04** | **Skills teach real work, never gate-gaming.** A skill step that exists only to satisfy a counter is a defect, not a technique. Skills that relate to a gate are validated against that gate's mechanics.                                        | The migration skill _taught_ the marker; a skill is process, and bad process outproduces bad code.                                                                     | `skills:verify` + review of skill steps against gate mechanics                          |
| **MI-05** | **A claimed metric is reproducible by a named command on the current tree.** "87.35 % adoption" must mean `npm run money:adoption` prints that on the committed tree. If no command prints it, the number does not exist.                        | Numbers that cannot be reproduced are claims, not measurements — the failure mode of the incident.                                                                     | `docs:verify` (ratchet-docs-check, 05 §B), `verify-readme-stats`                        |
| **MI-06** | **Proxy metrics are labelled and never the headline alone.** A presence metric may be reported only alongside the behaviour metric it proxies, named as the proxy it is.                                                                         | "87.35 %" was a presence metric reported as the headline; the behaviour metric (30.16 %) was buried.                                                                   | `money-adoption.mjs` prints both `modulesImportingMoney` and `genuine`; docs must match |
| **MI-07** | **Placeholder names are forbidden.** An identifier containing `marker`/`adoption`/`placeholder`/`stub`/`fake`/`noop`, assigned a call result and not otherwise used, is a fake signal and is removed.                                            | Markers live in naming; the name is the tell.                                                                                                                          | `placeholder:audit` void-signal rule; `eslint` `no-unused-vars` as backstop             |
| **MI-08** | **A gate that passes by construction is not a gate.** "0 unsafe ops" because the detector cannot parse `X` is not a certification. A gate must be able to fail on a known-bad input.                                                             | The money-AST detector reads arithmetic; hand-typed literals contain none — a file at "0 unsafe" is un-flagged, not certified (see `fabrication-detector.mjs` header). | Gate-design review; every gate has a known-failing case                                 |
| **MI-09** | **When a metric looks too good, that is the alarm.** A ratchet that jumps without a code change to the measured behaviour is a red flag, not a win. Investigate before reporting.                                                                | The 87.35 % jump was the signal; it was read as progress instead of as a question.                                                                                     | Ratchet-movement review; `money-adoption-baseline.json` timestamp                       |
| **MI-10** | **Quality bar: done means code + failing-first test + gates + docs in one commit.** Four of four, never three.                                                                                                                                   | A commit that has code and a passing test but no gate-evidence, or no docs, is a partial submission — the shape of the low-quality work this doc targets.              | `check` chain; `07_WORKFLOW_AND_DOD.md` §B checklist                                    |

---

## C · Work-quality rules (extending AGENTS.md §2 and 04 §L)

These restate and tighten existing rules into operational form. They do not
replace `AGENTS.md` §2; they operationalise it.

| ID        | Rule                                                                                                                                                                    | Extends                    | Gate                            |
| --------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------- | ------------------------------- |
| **WQ-01** | **Write the failing test first.** Code a feature only after a test that fails for the right reason exists and is committed ahead of the fix.                            | AGENTS.md §2 #9            | `check` (tests included)        |
| **WQ-02** | **Never weaken, delete, skip, or hand-edit a gate to make it pass.** If a gate is wrong, revise it by recorded DEC in public with a reason; do not disable it.          | AGENTS.md §2 #10; 04 §L #2 | the gate itself; DEC log        |
| **WQ-03** | **Never delete breadth to make a number look better.** RETIRED requires a recorded decision + resolving commit; it is not a cleanup tool.                               | DEC-006; 04 §L #3          | `coverage:audit`, docs register |
| **WQ-04** | **No unverified claims.** No "verified D365", no "your data is safe", no SOX authority, no "CI is green", no entity-scope authorisation — each pending an owner answer. | AGENTS.md §2 #1, #2, #3    | `docs:verify`, review           |
| **WQ-05** | **A ratchet never goes backwards without a recorded DEC.** A baseline is raised only by a recorded decision, never silently.                                            | 04 §K; ratchet discipline  | ratchet-docs-check              |
| **WQ-06** | **The smallest change that fully solves the problem** (ponytail level full): finish callers, tests, fixtures; no new abstraction for one use.                           | ponytail skill             | review + `check`                |
| **WQ-07** | **Every PR states which skills were applied.** A skill raises rigour, never the claim — "used skill X" is process, not evidence.                                        | AGENTS.md §1; 04 §A        | PR description; `skills:verify` |

---

## D · How to know work is real (the self-check)

Before any "done" claim — in a commit message, PR description, or status line —
run this. It is the operational form of `AGENTS.md` §2 #1 and #2.

1. **Named command.** Which command, run on this exact commit, produces the
   number I am about to state? If I cannot name it, I do not have the number.
2. **Behaviour, not presence.** Does that command count what the code _does_,
   or what it merely _has_? If the latter, am I also reporting the behaviour
   metric (MI-01, MI-06)?
3. **No marker.** Have I introduced any identifier, comment, or no-op that exists
   to satisfy a counter? Run `npm run placeholder:list` — it must be empty (MI-02,
   MI-07).
4. **Failing-first test.** Is there a test that failed for the right reason before
   the fix, and does it pass now (WQ-01)?
5. **Gates green on the committed tree.** Did `npm run check` (or the named gate
   chain) run on the _committed_ tree, not a working copy (WQ-02, MI-05)?
6. **Docs match.** Does the docs claim match the gate output byte-for-byte on the
   values that are checked (MI-05)?
7. **No unverified claim.** Am I about to assert something an owner has not
   confirmed (WQ-04)? If so, mark it pending.

If any answer is "no" or "unknown", the work is not done.

---

## E · Doc index — which doc owns which rule

The user asked for "all rules and other docs needed." This is the map. Each rule
lives in exactly one authoritative home; other docs reference, not duplicate.

| Rule / topic                                                                           | Authoritative home                              | Supporting / reference                       |
| -------------------------------------------------------------------------------------- | ----------------------------------------------- | -------------------------------------------- |
| The 12 + 2 non-negotiable rules (incl. measured-or-not-stated, evidence, no-weakening) | `AGENTS.md` §2                                  | `docs/agent/04_ENGINEERING_RULES.md`         |
| Session protocol (branch, push, commit-per-phase, push-last)                           | `AGENTS.md` §3                                  | `docs/agent/07_WORKFLOW_AND_DOD.md` §C       |
| **Metric integrity (MI-01 … MI-10)**                                                   | **this doc §B**                                 | gates in §G                                  |
| **Work quality (WQ-01 … WQ-07)**                                                       | **this doc §C**                                 | `AGENTS.md` §2, `04_ENGINEERING_RULES.md` §L |
| Forbidden acts (fabrication, weakening gates, claiming unrun tests)                    | `04_ENGINEERING_RULES.md` §L                    | this doc §C                                  |
| Truth-and-evidence rules (honest status, evidence, no-overclaim)                       | `04_ENGINEERING_RULES.md` §A                    | `09_KNOWN_GAPS.md`                           |
| Ratchets never go backwards; baselines                                                 | `04_ENGINEERING_RULES.md` §K                    | ratchet baseline JSONs                       |
| Completion DoD checklist                                                               | `07_WORKFLOW_AND_DOD.md` §B                     | this doc §D                                  |
| Gate commands and semantics                                                            | `05_COMMANDS_AND_GATES.md`                      | `package.json` scripts                       |
| Glossary (ratchet, baseline, oracle, metric gaming)                                    | `10_GLOSSARY.md`                                | this doc §F                                  |
| Anti-gaming skill rules                                                                | `docs/agent/skills/money-adoption-migration.md` | `skills:verify`                              |
| Honest status and known gaps                                                           | `09_KNOWN_GAPS.md`                              | this doc §A                                  |
| Handbook / how-to-start                                                                | `docs/README.md`                                | `AGENTS.md` §1                               |

**Docs still needed (gaps, named):**

- **A test that the ratchet can fail.** `money-adoption.mjs` is not covered by an
  automated negative test proving a marker fails the ratchet. Add one so the
  anti-gaming check is itself tested (MI-03, MI-08). _Owner: agent, next session._
- **A ratchet-movement alert.** No automated check flags a ratchet whose value
  jumps > N % without a recorded DEC or a corresponding behaviour change (MI-09).
  _Owner: agent, next session._
- **Owner answers O1–O9.** Several unverified-claim items remain owner-bound
  (WQ-04); until answered they stay `pending_owner`. _Owner: owner._

---

## F · Glossary additions

Defined in full in `10_GLOSSARY.md`; summarised here for the rule table.

- **fake marker** — a symbol (`const _xMarker = toDecimal(0)`), comment
  (`// Money adoption:`), or no-op whose only purpose is to satisfy a counter
  without doing the work the counter is meant to measure. Forbidden (MI-02).
- **proxy metric** — a metric that counts a _stand-in_ (an import, a declaration,
  a file count) rather than the _behaviour_ it proxies (a call, a computed value).
  Reportable only alongside its behaviour-measured companion (MI-06).
- **behaviour-measured gate** — a gate that counts what code _does_, and therefore
  cannot be satisfied by a no-op (MI-01).
- **anti-gaming check** — a check that fails the ratchet on the _exact_ fake that
  would game it (MI-03).
- **metric gaming** — shaping code to improve a metric without improving the
  measured behaviour (MI-01, MI-02).
- **placeholder signal** — a void const, `void 0;`, or placeholder name that
  exists to be counted (MI-07).
- **ratchet** — monotone floor per §B of `AGENTS.md`; never goes backwards without
  a recorded DEC (WQ-05).
- **baseline** — the recorded `{ …, recordedAt }` snapshot a ratchet compares
  against (`money-adoption-baseline.json`).

---

## G · Gates

| Gate                   | Command                                  | Zero-tolerance?      | What it proves                                                   |
| ---------------------- | ---------------------------------------- | -------------------- | ---------------------------------------------------------------- |
| Fake-signal audit      | `npm run placeholder:audit`              | **yes**              | no marker/stub/void/placeholder anywhere in `src`                |
| Money-adoption ratchet | `npm run money:adoption`                 | ratchet              | genuine money-fn usage ≥ baseline (30.16 %); fails on any marker |
| Money-AST audit        | `npm run money:ast`                      | 0 unsafe (ratcheted) | no raw-float money arithmetic                                    |
| Fabrication audit      | `npm run fabrication:audit`              | ratcheted            | no hand-typed financial literals / demo entities                 |
| Mock-data audit        | `npm run mock-data:audit`                | yes                  | real compute at the data boundary                                |
| Tests (sharded)        | `npm run test:sharded`                   | ≥75 % coverage       | behaviour is real                                                |
| Structural             | `npm run docs:verify` + `engines:verify` | yes                  | docs match gate output, engines match base                       |

The full ordered gate chain is `npm run check` (`AGENTS.md` §4): tsc → lint →
format → docs:verify → engines:verify → money:ast → **placeholder:audit** →
determinism:ratchet → palette:ratchet → fabrication:audit → mock-data:audit →
test:sharded. `placeholder:audit` is zero-tolerance and sits before the
ratchets, so a marker cannot reach a ratchet undetected.

---

## H · Source of truth

This document is a **rule / map**, not a status. For the current status of any
metric or gap, read `09_KNOWN_GAPS.md` and the ratchet output. If this doc and a
gate disagree, the **gate** is truth — fix the doc by recorded DEC in public.
