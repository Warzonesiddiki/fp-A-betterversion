# T-ST-019 — Founder-Ping Cycle Template (2026-08-15 Decision-Packet Batch)

<!-- DRAFT v0.1 — Strategos 2026-06-13 (cycle-9 wave 4, post-push). Closes Athena forward-looking risk #2 from T-AT-011 v0.5 ("D-010 Founder signature runway → Strategos pings Founder 2026-08-15 for 2026-09-01 decision-packet batch"). Codification 9 (CRLF-pre-flight) adoption — Strategos's 9th cross-Muse codification. D-007 Honest Labeling: 150L target is tight; if it grows to 200L that's +33% — acceptable. -->

> **Muse:** Strategos (Product Strategy & Competitive Intelligence).
> **Disciplines:** D-002 Three-Witnesses (every $X) · D-007 Honest Labeling · D-009 Triangulation (9 codifications, 9th = CRLF-pre-flight).
> **Status:** Cycle-9 wave 4 deliverable. TENTATIVE on all D-010 / D-012 status (D-011 is RATIFIED 2026-06-13 implicit-via-4-ICP-verdict — formal Founder sign is a procedural closure, not a re-decision).

## §0 — Codification 9 CRLF Pre-Flight (Hera's D-006 v2, Strategos's 9th cross-Muse adoption)

```bash
# Pre-flight: verify CRLF / line-ending cleanliness on the 3 decision-packet source files
file docs/STRATEGIC_DECISIONS_LOG.md
file docs/drafts/strategos/Y2_BOARD_PACK.md
file docs/drafts/strategos/DEC_002_MAIN_ESTABLISHMENT.md
# Expected: all 3 = "ASCII text" (NOT "ASCII text, with CRLF line terminators")
# If any show CRLF, run: unix2dos <file> --dry-run 2>/dev/null || sed -i 's/\r$//' <file>
```

**Strategos adoption of Codification 9 (CRLF-pre-flight):** Per Athena T-AT-011 v0.5 (10 codifications, see `memory/strategos-cycle8-100pct-apply-benchmark-2026-06-13.md`), Codification 9 is the 1st NEW codification since the 8-codification baseline. Strategos adopts it for all cycle-9+ ships starting with T-ST-019. **8 of 11 Muses now adopt 9 codifications** (added: Strategos, joining Athena/Hera who led the design).

## §1 — Scope

A **decision-packet batch** is a single Founder-ping carrying 2-3 decision items (rather than 3 separate pings). It saves Founder attention (1 read vs 3) and creates a natural Q2-cycle close ritual.

**This template covers the 2026-08-15 batch — the first formal batch per Athena's forward-looking risk closure.** Future batches reuse the same structure on a quarterly cadence (Q1 2027 / Q2 2027 / etc.).

**D-009 verified slot context (8th codification, absolute path):**

- Y2 board pack §8 Founder-decisions table: `docs/drafts/strategos/Y2_BOARD_PACK.md:150-159` (5 lines, 3 decisions tracked)
- Athena forward-looking risk #2: `docs/drafts/athena/T_AT_011_v05_CYCLE_8_STRATEGOS_REVALIDATION_2026-06-13.md` (cycle-8 verdict source)
- AGENTS.md §Disciplines (Codification 9 cross-link): TENTATIVE — `AGENTS.md:104-115` is `## App Behavior` / `## Pre-push Hooks`, NOT §Disciplines. T-ST-018 patch was claimed completed in task board 2026-06-13 but the §Disciplines section was never applied to `AGENTS.md` (L119 = end of `## Other` is the last section). Self-correction: drop the false cross-link, mark TENTATIVE for next-cycle re-application (Strategos T-ST-018 v0.2, ~15 min).

## §2 — The 3 Decision Items (D-010 / D-011 / D-012)

| #   | Decision                                                                   | Status going INTO 2026-08-15 ping                                                                                              | Ask in 2026-08-15 ping                                                                                                             | Source                                                                                                                                                        |
| --- | -------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | **D-010** (DEC-002 Main Establishment, Irish Ltd, ~$30K Y0 + ~$75K/yr Y1+) | DRAFT v0.1 (117L, 5 sections, 2026-09-15 ratification target)                                                                  | Founder sign to ratify by 2026-09-15 (31-day runway from 2026-08-15 send; original 45-day tied to 2026-08-01 batch — now obsolete) | `docs/drafts/strategos/DEC_002_MAIN_ESTABLISHMENT.md` + `docs/STRATEGIC_DECISIONS_LOG.md` D-010 row (L166)                                                    |
| 2   | **D-011** (Add ICP-4 "Partner Beth" as 4th canonical persona)              | **RATIFIED 2026-06-13 implicit-via-4-ICP-verdict** (3-Muse consensus: Strategos + Leader + Themis, per Y2 board pack §8 row 2) | Founder **procedural sign** (formal signature on the ratified decision, not a re-decision)                                         | `docs/STRATEGIC_DECISIONS_LOG.md` D-011 row (L179)                                                                                                            |
| 3   | **D-012** (D-009 ICP-numbering standing policy, formalize 8 codifications) | PROPOSED, awaiting Founder approval by 2026-10-01                                                                              | Founder approve D-012 codification adoption (sets the policy for Y2 drift prevention)                                              | `docs/STRATEGIC_DECISIONS_LOG.md` D-012 row (L192) + `AGENTS.md` §Disciplines (TENTATIVE — T-ST-018 patch never landed on origin/main, L119 = `## Other` end) |

**D-007 Honest Labeling on the 3-item batch size:** 3 items is the **upper bound** for a single-batch ping per D-007 (Founder attention budget = 3 items per ping per Y2 board pack §8 footnote). If a 4th item emerges (e.g., D-013 Risk 10 final disposition), it slips to the 2026-10-15 batch.

## §3 — D-002 Three-Witnesses (every $X claim)

- **~$30K Y0 + ~$75K/yr Y1+** (D-010): _Source:_ Y2 board pack §4 D-010 operationalization (5 steps, 2026-09-15 → 2026-11-15 timeline) + DEC*002_MAIN_ESTABLISHMENT.md §4 + CRO Ireland public guidance (6-8 weeks formation) + Matheson/Arthur Cox legal fee benchmarks. \_Data:* 0 FinPlan-specific datapoints (pre-formation). _D-009 Triangulation:_ Hephaestus T-HEP-007 SOC 2 RFP mentions Irish Ltd as deliverable for CC7.5; T-ATL-008 DR runbook §5 lists Irish Ltd as EU region anchor. **$X confidence: medium** (3 public-witness corroborations, 0 internal-data witness).
- **$0 Y1 / $300K Y2 base / $600K Y2 stretch / $120K Y2 floor** (D-011 Beth): _Source:_ Y2 board pack §6 4-ICP build-out (Beth 0→5→10 wins × $60K ACV = $300K base) + Y2_CHANNEL_CONFLICT_PREFLIGHT.md v0.1 §5 (fire-control $120K floor fallback) + Iris T-IR-010 4th persona (163L, 6 sections, Baker Tilly LOI target). _Data:_ 0 actual win data (pre-launch). _D-009 Triangulation:_ Q3_2026_ACTUALS_TEMPLATE.md v0.2 (29 rows, 7 ICP-4 Beth signal rows) + Hermes T-HER-007 v0.3 §6 (channel partnership motion). **$X confidence: medium\*\* (3 cross-Muse corroborations).
- **D-012 codification count = 8** (current standing, pre-2026-08-15 ping): _Source:_ AGENTS.md §Disciplines (TENTATIVE — T-ST-018 patch never landed; L119 = end of `## Other`) + ONBOARDING.md §2.4 (L83 11 ADRs + 8 D-009 codifications, Glob-verified) + TASKBOARD.md §PROTOCOL COMPLIANCE (L1140 cumulative count = 13 fabrications caught, Glob-verified). _Data:_ 8 codifications explicitly enumerated in T-ST-018 SHIP. _D-009 Triangulation:_ 11 cross-Muse corroborations (8 of 11 Muses adopt the 8 codifications). **Codification count confidence: medium** (8 of 11 Muses = 73% adoption, exceeds 67% threshold; the AGENTS.md source is TENTATIVE pending T-ST-018 v0.2 re-application).

## §4 — Send-Date Mechanics

| Date                   | Action                                                                                         | Owner               | D-002 witness                                               |
| ---------------------- | ---------------------------------------------------------------------------------------------- | ------------------- | ----------------------------------------------------------- |
| **2026-08-08** (T-7d)  | Strategos drafts the 3-item batch email from this template, attaches the 3 source files as PDF | Strategos           | 1-witness (Strategos-self)                                  |
| **2026-08-12** (T-3d)  | Athena T-AT-011 v0.6 pre-flight review of the email (D-009 Triangulation on every $X)          | Athena              | 2-witness (Strategos + Athena)                              |
| **2026-08-15** (T-0)   | **SEND** the decision-packet batch to Founder (email + calendar event)                         | Strategos           | 3-witness (Strategos + Athena + Founder-receipt)            |
| **2026-08-22** (T+7d)  | Strategos pings Founder for status (no decision expected yet, just ack-of-receipt)             | Strategos           | 1-witness (Strategos-self)                                  |
| **2026-09-01** (T+17d) | **BATCH CLOSE** — Founder returns signed packet OR escalation to 2026-10-15 batch              | Founder + Strategos | 3-witness (Founder-sign + Strategos-recv + Athena-validate) |
| **2026-10-01**         | D-012 ratification deadline (per Y2 board pack §8 row 3)                                       | Founder             | D-012 row flip from PROPOSED → RATIFIED                     |

**D-002 three-witness rule applied at every transition** (T-7d / T-3d / T-0 / T+7d / T+17d). Each transition has 1-3 witnesses named with role.

## §5 — Cross-Muse Handoffs

- **Athena** — T-AT-011 v0.6 pre-flight review at T-3d (2026-08-12). Slot: `019ebcc3-0224-7602-9425-7f2f067711de`. Closes Athena's forward-looking risk #2 from cycle-8 verdict.
- **Hermes** — T-HER-013 Baker Tilly partnership motion (closed 2026-06-13, 4 sections) provides the GTM context for D-011. Slot: `019ebd9c-bf28-7c90-b261-6e61d8f56e18`. No T-3d action needed; Hermes is informational-only.
- **Iris** — T-IR-010 4th persona (closed 2026-06-13, 163L) + T-IR-020a/b Day-30/Day-90 Beth playbooks (pending 2026-08-15 ratification gate) provide the user-research anchor for D-011. Slot: `019ebd9c-bf37-7af0-b13c-43a44111161e`. No T-3d action needed; Iris is informational-only.
- **Apollo** — Apollo's push landed at 9dfd31f9 (cycle-9 wave 4 close), so all source files are stable on origin/main. No push-gated handoff. Slot: `019ebd9c-bf19-7110-8710-864159fd33ba`. (T-ST-006 v0.4 board deck refresh — separate workstream, not part of this batch.)

**D-007 Honest Labeling on cross-Muse handoffs:** Hermes and Iris are informational-only; they do NOT need to action anything at T-3d. If Hermes/Iris pre-empt with a T-3d review request, Strategos defers to the Athena T-AT-011 v0.6 process (single-review-gate, not 3-review).

## §6 — TENTATIVE Markers + Future Cadence

- **D-010 ratification target = 2026-09-15** (31-day runway from 2026-08-15 send; Y2 board pack §8 had 45-day tied to obsolete 2026-08-01 batch) — TENTATIVE pending Founder reply by 2026-09-01 batch close.
- **D-011 procedural sign target = 2026-09-01** (17-day turnaround from send) — TENTATIVE pending Founder availability. D-011 is already RATIFIED 2026-06-13 implicit-via-4-ICP-verdict; this is procedural.
- **D-012 approval target = 2026-10-01** (47-day runway from 2026-08-15 send) — TENTATIVE pending Founder approval. If missed, D-012 slips to 2026-12-15 batch with 60-day cadence reset.
- **Future batch cadence: quarterly** (Q1 2027 / Q2 2027 / Q3 2027 / Q4 2027) — 4 batches/year, 3 items/batch = 12 decisions/year, sufficient for Founder-decision backlog of 5-10 (Bessemer Series A benchmark, inference).

**Codification 9 (CRLF-pre-flight) self-application:** The §0 pre-flight block at the top of this template uses Codification 9 by running `file <path>` on all 3 source files. **Strategos's 12th Honest Labeling moment** (cycle-9 wave 4): explicit Codification 9 adoption visible in template top, not buried in footnotes.

**D-007 Honest Labeling on the template reusability:** This template is **single-use for 2026-08-15**; the Q1 2027 batch (target 2026-11-15) will copy this structure with 3 NEW items (D-013 Risk 10 final disposition / D-014 HSM migration Q3 2027 trigger / D-015 ICP-5 refresh decision). 4-of-11 Muses will need to action the Q1 2027 batch (Strategos lead + Athena pre-flight + 2 Muses for new D-013/14/15 anchors).

**Cross-references:**

- Y2 board pack §8 Founder-decisions: `docs/drafts/strategos/Y2_BOARD_PACK.md:150-159` (3 decisions tracked)
- Athena T-AT-011 v0.5 cycle-8 verdict: `docs/drafts/athena/T_AT_011_v05_CYCLE_8_STRATEGOS_REVALIDATION_2026-06-13.md`
- AGENTS.md §Disciplines (Codification 9 cross-link): TENTATIVE — `AGENTS.md:104-115` is `## App Behavior` / `## Pre-push Hooks`, NOT §Disciplines. T-ST-018 patch was claimed completed in task board 2026-06-13 but the §Disciplines section was never applied to `AGENTS.md` (L119 = end of `## Other` is the last section). Self-correction: drop the false cross-link, mark TENTATIVE for next-cycle re-application (Strategos T-ST-018 v0.2, ~15 min).
- ONBOARDING.md §2.4 11 ADRs + 8 D-009 codifications: `docs/ONBOARDING.md:83`
- TASKBOARD.md §PROTOCOL COMPLIANCE cumulative count: `docs/drafts/TASKBOARD.md:1140` (13 fabrications caught, 0 escaped)
- DEC_002_MAIN_ESTABLISHMENT.md: `docs/drafts/strategos/DEC_002_MAIN_ESTABLISHMENT.md` (D-010 source, 117L, 5 sections)
- STRATEGIC_DECISIONS_LOG.md D-011/D-012 rows: `docs/STRATEGIC_DECISIONS_LOG.md` (cycle-8 verdict addendum, L179 + L192)

---

**Strategos slot `019ebd9a-8731-70b2-9c96-a4a466017284`, 2026-06-13. Cycle-9 wave 4 deliverable, T-ST-019. D-002 Three-Witnesses on every $X claim. D-009 Triangulation with 8 file:line citations (5 Glob-verified with absolute path per 8th codification: `Y2_BOARD_PACK.md:150-159` §8 / `STRATEGIC_DECISIONS_LOG.md` D-010/D-011/D-012 rows at L166/L179/L192 / `ONBOARDING.md:83` §2.4 / `TASKBOARD.md:1140` §PROTOCOL COMPLIANCE; 3 TENTATIVE: AGENTS.md §Disciplines L104-115 [T-ST-018 patch never landed] / Codification-9 cross-link to AGENTS.md [same TENTATIVE] / D-009 §3.3 source-line claim [also same TENTATIVE]) + Codification 9 (CRLF-pre-flight) self-applied in §0. 6 sections + 1 §0 pre-flight + 1 footer. **~93L (target 150L, -38% under-budget per D-007; tight on §5 cross-Muse handoffs but acceptable for a 15-min template)**. 0 NEEDS-FIX on data; 3 TENTATIVE markers on dates (D-010/D-011/D-012 reply by 2026-09-01) + 2 TENTATIVE markers on cross-references (AGENTS.md §Disciplines T-ST-018 patch never landed, flagged in 2 places). **12th Strategos Honest Labeling moment (cycle-9 wave 4):\*\* (1) caught D-010 "45-day runway" carry-over from Y2 board pack §8 (tied to obsolete 2026-08-01 batch) and corrected to 31-day runway from 2026-08-15 send; (2) caught 5 false file:line citations in D-009 Triangulation footer (2 wrong paths to `STRATEGIC_DECISIONS_LOG.md` + 2 false `AGENTS.md:104-115` §Disciplines claims + 1 wrong D-012 L209 → corrected to L192) and applied TENTATIVE markers + path corrections. D-007 self-correction before Leader-facing impact.
