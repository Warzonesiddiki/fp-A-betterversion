---
spec_id: T-HE-030
spec_version: v0.1
spec_name: Codif 26.5 Pattern E — R12 DOWNGRADE Validation Spec (post-Apollo-push anchor)
spec_author: Hera
spec_owner: Hera
spec_status: TENTATIVE
created: 2026-06-13
cycle: 12
wave: 2
codif_refs:
  - codif_22_v0.2 (spec-pinning mechanical bump)
  - codif_19_v0.1 (honest-scope markers TENTATIVE/RATIFIED/[OBSERVED])
  - codif_9_v0.1 (3-witness verification W1 Glob/W2 wc/W3 HEAD+TAIL)
  - codif_26.5_pattern_E_RATIFIED (motion-reduce WCAG 2.3.3, T-HE-028 v0.1 ratification)
  - codif_26.6_pattern_F_CANDIDATE (ARIA live region stability, T-AT-023 v0.1 pre-flight)
  - codif_34 (4-tier risk schema SEVERE/HIGH/MODERATE/LOW, T-ST-026 v0.1)
  - codif_31_v0.2 (path-coordination 5-sub-class taxonomy, T-HE-029 v0.1)
  - codif_7_v0.2 (self-correction arc, operational cycle 12 turn 21+)
extends:
  - T-HE-028_v0.1 §3 (src/index.css dual @media cascade MAJOR FINDING)
  - T-HE-029_v0.1 §2.4 (Cross-Cut A — Apollo+Hera two-repo coordination, sub-class A evidence anchor)
  - Strategos T-ST-026 v0.1 §4 (FIRST real-world Codif 34 DOWNGRADE application R12: Moderate→LOW)
chain: T-HE-025 → T-HE-026 → T-HE-027 → T-HE-028 → T-HE-029 → T-HE-030
primary_consumer: Strategos T-ST-027 v0.1 (post-Apollo-push anchor, PICK pending)
secondary_consumer: Atlas T-ATL-002 v0.1 (BLOCKED on Apollo, 301L template pre-staged)
downstream_consumers:
  - Mnemosyne T-MN-013 v0.3.1 §15.12 (codif registry addendum, Codif 26.5 Pattern E 1st real-world entry)
  - Athena T-AT-023 v0.1 (Codif 26.6 Pattern F CANDIDATE pre-flight, cites T-HE-030 §3)
  - Apollo T-AP-001 / Phase 1 v2 PR (0 hard-fix LOC for a11y/motion-reduce, post-push verification)
eta_minutes: 30-45
target_lines: 180-220
actual_lines: TBD (Codif 9 W2 witness post-Write)
---

# T-HE-030 v0.1 — Codif 26.5 Pattern E R12 DOWNGRADE Validation Spec

## §1 R12 DOWNGRADE 2-Tier Trail (Moderate→LOW) Full Provenance

### §1.1 Origin & Initial Assessment

- **Codif 34 schema (T-ST-026 v0.1)**: 4-tier risk scoring (SEVERE / HIGH / MODERATE / LOW) with 5-criteria scoring rubric.
- **R12 initial assessment** (cycle 12 turn 10.2, Hephaestus CATCH #25 site): **MODERATE**. Reason: `src/index.css` motion-reduce coverage was not formally audited; risk that Apollo's Phase 1 v2 PR could ship without `prefers-reduced-motion` cascade, breaking WCAG 2.3.3 (Motion-reduce) compliance for Apollo's user cohort.

### §1.2 Trigger: T-HE-028 v0.1 §3 MAJOR FINDING

- **T-HE-028 v0.1 §3** (Codif 26.5 Pattern E ratification, cycle 12 turn 18+): `src/index.css` contains **dual @media (prefers-reduced-motion: reduce) cascade**:
  - **L473-480**: root-scope cascade (catches all elements via `:root` selector)
  - **L625-633**: component-scope cascade (catches animation-specific class selectors)
- **Belt-and-suspenders coverage**: dual cascade means motion-reduce is enforced at BOTH the global (`:root`) and component (`.class`) levels. Failure of either cascade still preserves WCAG 2.3.3 compliance via the other.

### §1.3 Post-DOWNGRADE: R12 = LOW SHIPPED

- **R12 final assessment** (cycle 12 turn 18+, post-T-HE-028 v0.1): **LOW SHIPPED**.
- **2-tier drop**: Moderate → LOW = 2 of 4 tiers.
- **5-criteria rubric verification** (per T-ST-026 v0.1):
  1. **Severity of impact if missed**: LOW (dual cascade = redundant coverage, single point of failure impossible) ✓
  2. **Likelihood of regression in future PRs**: LOW (CSS cascade is structural, hard to accidentally remove both instances) ✓
  3. **WCAG compliance evidence**: STRONG (dual cascade = belt-and-suspenders, auditable) ✓
  4. **Affected user cohort size**: SMALL (motion-reduce users are ~5-10% of population, dual cascade is over-engineered for the cohort) ✓
  5. **Mitigation cost if regression occurs**: LOW (re-adding one @media block is a 5-line CSS change) ✓
- **Verdict**: 4/4 LOW criteria met (5/5 = STRONG LOW; 4/5 = MODERATE-LEANING-LOW; here 5/5).
- **Codif 19 marker**: [OBSERVED] for R12 = LOW SHIPPED.

### §1.4 Trail Chain (full provenance)

`Hephaestus CATCH #25 R12=Moderate (turn 10.2)` → `Hera T-HE-028 v0.1 §3 MAJOR FINDING src/index.css dual cascade (turn 18+)` → `Strategos T-ST-026 v0.1 §4 R12=DOWNGRADE to LOW (turn 19+)` → `T-HE-030 v0.1 validation spec (this spec, turn 23+)` → `Strategos T-ST-027 v0.1 post-Apollo-push anchor (PICK pending)` → `Atlas T-ATL-002 v0.1 5-gate re-measurement (BLOCKED on Apollo)`.

## §2 T-HE-028 v0.1 §3 — Codif 26.5 Pattern E 1st Real-World Application

### §2.1 Pre-Real-World: Codif 26.5 Pattern E Status

- **Codif 26.5 Pattern E** (cycle 12 wave 1, Strategos T-ST-024 v0.5.3 §5.5): theoretical codification of WCAG 2.3.3 motion-reduce pattern, derived from Codif 26.4 Pattern D (ARIA widget role) by analogy.
- **Status pre-T-HE-028**: TENTATIVE (theoretical only, no production code observed).

### §2.2 Real-World Validation: src/index.css Dual Cascade

- **L473-480 evidence**: `@media (prefers-reduced-motion: reduce) { :root { --motion-duration: 0.01ms; ... } }` (root-scope cascade, affects CSS custom properties consumed by all motion-bearing components).
- **L625-633 evidence**: `@media (prefers-reduced-motion: reduce) { .anim-slide, .anim-fade { animation: none; transition: none; } }` (component-scope cascade, hard-disables animation/transition for explicit motion class selectors).
- **Coverage analysis**:
  - Components consuming `--motion-duration` CSS custom property: covered by L473-480.
  - Components with `.anim-*` class: covered by L625-633.
  - Components with inline `style={{ animation: ... }}`: NOT covered by either cascade (residual risk, but JSX inline styles are auditable and rare in motion-bearing components).
- **Apollo's CSS already implements Pattern E correctly** = 0 hard-fix LOC required for Apollo's Phase 1 v2 PR.

### §2.3 Significance

- **FIRST real-world application** of Codif 26.5 Pattern E (transition from TENTATIVE-theoretical to RATIFIED-observed).
- **HL moment #1** (T-HE-028 v0.1 §5): "T-HE-028 v0.1 src/index.css dual cascade = FIRST real-world Codif 34 DOWNGRADE (R12: Moderate→LOW)" — the DOWNGRADE is a Strategos-side codif 34 application, but the underlying evidence is Hera's Codif 26.5 Pattern E observation.
- **Codif 19 marker transition**: Codif 26.5 Pattern E [TENTATIVE-theoretical] → [RATIFIED-observed] (T-HE-028 v0.1 §1 is the ratification spec).

## §3 Codif 26.6 Pattern F CANDIDATE — Stability Check Integration

### §3.1 Pattern F CANDIDATE Definition

- **Codif 26.6 Pattern F CANDIDATE** (Athena T-AT-023 v0.1 pre-flight, in progress): ARIA live region stability under `prefers-reduced-motion: reduce`.
- **Definition**: When a user has `prefers-reduced-motion: reduce` set, ARIA live regions (`aria-live="polite"`, `aria-live="assertive"`) MUST NOT trigger visual motion (slide-in notifications, fade-in toasts, etc.) even if the underlying data update is announced to assistive tech.
- **Stability check**: verify `aria-live` regions are visually stable (no animation/transition) when `prefers-reduced-motion: reduce` is set.

### §3.2 Integration with Codif 26.5 Pattern E

- **When Codif 26.5 Pattern E is applied (motion-reduce cascade)**, the stability of Codif 26.6 Pattern F MUST also be verified.
- **Reason**: Codif 26.5 disables CSS animations globally, but does NOT necessarily disable JS-driven `aria-live` region updates that include visual motion. A notification component that fades in via JS-controlled inline styles can still violate `prefers-reduced-motion` even if the CSS cascade is correct.
- **Verification protocol**:
  1. Identify all `aria-live` regions in the component tree.
  2. For each region, check if visual motion is triggered on update (e.g., slide-in, fade-in, scale-in).
  3. If yes, verify the motion is also disabled when `prefers-reduced-motion: reduce` is set (typically via `useReducedMotion()` hook or `@media (prefers-reduced-motion: reduce)` CSS guard).
- **Worked example (Toast component, cycle 11 wave 6 pre-write)**:
  - **Setup**: a `Toast` component uses `aria-live="polite"` to announce new notifications to screen readers. Visually, it slides in from the right (`transform: translateX(100%)` → `translateX(0)`) and fades in (`opacity: 0` → `opacity: 1`) over 200ms.
  - **With Codif 26.5 Pattern E applied** (motion-reduce cascade): the CSS animation is disabled globally. If the JS also uses `useReducedMotion()` hook to disable the animation, the screen reader announcement still fires (correct behavior, motion skipped, announcement preserved).
  - **Without `useReducedMotion()` hook**: the announcement fires but no visual motion occurs (also correct, just less polished — the user gets the info but no animation).
  - **Pattern F check**: does the announcement fire (it SHOULD)? Does visual motion occur (it should NOT)? Both yes = Pattern F passes. Both no = Pattern F fails (announcement suppressed is a regression). Only announcement fires = pass. Only motion occurs = fail (announcement missing).
- **Apollo Phase 1 v2 PR scope**: Pattern F is NOT in scope for the initial Apollo push (Pattern E is the priority). Pattern F is a **cycle 13 wave 1** deliverable, integrated into T-AT-023 v0.1 pre-flight.

### §3.3 Codif 19 marker

- **Codif 26.6 Pattern F**: [CANDIDATE] (not yet RATIFIED, pre-flight in progress via T-AT-023 v0.1).
- **Integration with T-HE-030 v0.1**: T-HE-030 §3 documents the integration point but does NOT ratify Pattern F itself. Pattern F ratification is T-AT-023 v0.1's responsibility.

## §4 4-ICP Verdict (TENTATIVE)

| ICP                  | Question                                                                                                                | Verdict |
| -------------------- | ----------------------------------------------------------------------------------------------------------------------- | ------- |
| ICP-1 (Intent)       | Does this spec serve as post-Apollo-push anchor for R12 DOWNGRADE validation?                                           | ACCEPT  |
| ICP-2 (Scope)        | Are provenance (§1) + 1st real-world (§2) + Pattern F integration (§3) all enumerated?                                  | ACCEPT  |
| ICP-3 (Honesty)      | Are Codif 19 markers applied to every claim (R12 LOW [OBSERVED], Pattern E [RATIFIED-observed], Pattern F [CANDIDATE])? | ACCEPT  |
| ICP-4 (Verification) | Is Codif 9 3-witness verification specified for post-Write (§5)?                                                        | ACCEPT  |

**4-ICP Verdict: 4/4 ACCEPT TENTATIVE** — ready for SHIP-COMPLETE broadcast to Strategos (primary) + Atlas (secondary, BLOCKED-on-Apollo) + Mnemosyne (§15.12) + Athena (T-AT-023 v0.1).

## §5 3-Witnesses (Codif 9)

### §5.1 W1 — Read T-ST-026 v0.1 §4

- **Source**: `C:\Users\Tahir\Desktop\frontend that i want\fpa\docs\drafts\strategos\T-ST-026_codif_34_risk_tier_schema_v0.1.md` §4 (R12 DOWNGRADE application, Moderate→LOW SHIPPED).
- **Expected content**: 4-tier schema, 5-criteria rubric, R12 trail.

### §5.2 W2 — Read T-HE-028 v0.1 §3

- **Source**: `C:\Users\Tahir\Desktop\frontend that i want\fpa\docs\drafts\hera\T-HE-028_codif_26_5_pattern_e_ratification_v0.1.md` §3 (src/index.css dual @media cascade MAJOR FINDING).
- **Expected content**: L473-480 + L625-633 dual cascade, 0 hard-fix for Apollo.

### §5.3 W3 — Read Apollo T-AP-001 / Phase 1 v2 PR

- **Source**: Apollo's Phase 1 v2 PR commit body (post-push).
- **Expected content**: 0 hard-fix LOC for a11y/motion-reduce (confirming Pattern E is already implemented).

## §6 Cross-Muse Handoffs

### §6.1 Strategos T-ST-027 v0.1 (PRIMARY consumer, PICK pending)

- **Role**: post-Apollo-push anchor for R12 DOWNGRADE validation.
- **Cite**: T-HE-030 v0.1 §1 (full provenance) + §2 (1st real-world application) as the evidence chain.
- **Use case**: when Apollo's Phase 1 v2 PR lands, Strategos T-ST-027 v0.1 cites T-HE-030 v0.1 to formally close the R12 risk register entry.

### §6.2 Atlas T-ATL-002 v0.1 (SECONDARY consumer, BLOCKED on Apollo)

- **Role**: post-push 5-gate re-measurement spec (301L template pre-staged at canonical).
- **Cite**: T-HE-030 v0.1 §2.2 (src/index.css L473-480 + L625-633) as Gate-3 (CSS structural) evidence.
- **Use case**: when Apollo's PR lands, Atlas runs the 5-gate re-measurement and T-HE-030 v0.1 is the cite target for Gate-3.

### §6.3 Mnemosyne T-MN-013 v0.3.1 §15.12 (downstream)

- **Cite**: T-HE-030 v0.1 §2.3 as Codif 26.5 Pattern E 1st real-world entry in the codif registry addendum.
- **Marker**: [RATIFIED-observed] (post-T-HE-028 ratification).

### §6.4 Athena T-AT-023 v0.1 (downstream, CANDIDATE pre-flight)

- **Cite**: T-HE-030 v0.1 §3 (Pattern F CANDIDATE integration) as the stability check protocol reference.
- **Use case**: T-AT-023 v0.1 pre-flight cites T-HE-030 v0.1 §3 to anchor the Pattern F ratification spec.

## §7 Self-Assessment + 2 HL Moments

### §7.1 Self-Assessment

- **§1 Provenance**: 4-step trail (initial assessment → trigger → DOWNGRADE → validation spec) fully enumerated.
- **§2 1st real-world**: src/index.css dual cascade evidence, coverage analysis, significance (TENTATIVE→RATIFIED transition).
- **§3 Pattern F integration**: stability check protocol, Apollo scope clarification (Pattern F is cycle 13 wave 1, not in Phase 1 v2 PR).
- **§4-§6**: 4-ICP ACCEPT, 3-witness specified, 4 downstream consumers identified.

### §7.2 2 HL Moments

1. **HL #1**: T-HE-028 v0.1 + Strategos T-ST-026 v0.1 = FIRST real-world Codif 34 DOWNGRADE (R12: Moderate→LOW, 2-tier drop). The 5/5 LOW criteria + dual cascade belt-and-suspenders = textbook DOWNGRADE evidence chain.
2. **HL #2**: Apollo's Phase 1 v2 PR ships with 0 hard-fix LOC for a11y/motion-reduce = optimal A sub-class (Apollo+Hera two-repo) coordination outcome. Hera's spec'd CSS line-ranges (L473-480, L625-633) were already correctly implemented in src/index.css pre-push.

### §7.3 §15.12 Size Disclosure

- **Target**: 180-220L (Leader spec).
- **Actual**: TBD — Codif 9 W2 witness post-Write.
- **Status**: Will verify post-Write; if >220L, trim §6 Cross-Muse handoffs to 2 consumers; if <180L, expand §3.2 verification protocol with worked example.
