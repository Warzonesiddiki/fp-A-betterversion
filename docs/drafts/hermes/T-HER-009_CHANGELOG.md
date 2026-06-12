<!-- DRAFT v0.1 — awaiting review — Hermes 2026-06-13 -->

# T-HER-009_CHANGELOG.md — ICP-Numbering Reconciliation v0.1 → v0.2

**Mission:** Reconcile `PRICING.md` + `ICP.md` + `BATTLECARD_ANAPLAN.md` with canonical ICP-numbering (Carla=ICP-1, Vera=ICP-2, Chris=ICP-3) per Strategos T-ST-006 v0.2 + Leader ICP-numbering ratification broadcast.

**Canonical source-of-truth:** `iris/PERSONAS.md` (Iris is the customer-research Muse; her ICP-numbering is canonical across all 11 Muses per T-ST-006 v0.2 ACK).

**DRAFT header bumps:** 3 files bumped from v0.1 → v0.2.

---

## §1 — 7 specified edits (Leader-explicit, in-place)

| # | File | Line | Before | After | Notes |
|---|---|---|---|---|---|
| 1 | `PRICING.md` | L8 | "ICP-1 (CFO) and ICP-2 (Controller)" (cross-ref) | "ICP-1 (Carla, CFO) and ICP-2 (Vera, Controller)" | Cross-reference to `ICP.md` |
| 2 | `PRICING.md` | L20 | "ICP-2 (Scrappy SaaS Controller)" (Open Source row) | "ICP-2 (Vera, Scrappy SaaS Controller)" | Open Source tier — Vera anchor |
| 3 | `PRICING.md` | L21 | "ICP-2 (Carlos) growing into ICP-1 lite" (Pro row) | "Vera (ICP-2) growing into Carla (ICP-1) lite" | Pro tier — also maps ICP-1 lite → Carla |
| 4 | `PRICING.md` | L32 | "Carlos (ICP-2), the 10–50-emp SaaS controller" (Buyer a) | "Vera (ICP-2), the 10–50-emp SaaS controller" | Buyer persona anchor |
| 5 | `PRICING.md` | L77 | "ICP-2 funnel doesn't exist" | "Vera (ICP-2) funnel doesn't exist" | Funnel reference |
| 6 | `ICP.md` | L70-72 | "## 2. ICP-2: 'The Scrappy SaaS Controller'" (header only) | Header + new sub-bullet "> **Persona anchor:** Vera (see `iris/PERSONAS.md` — canonical per T-ST-006 v0.2 ICP-numbering ratification). The role descriptor 'Scrappy SaaS Controller' is preserved; the persona name follows Iris's research." | Sub-bullet per Leader spec |
| 7 | `ICP.md` | L121 (table) | "ICP-2: Scrappy SaaS Controller" | "ICP-2: Scrappy SaaS Controller (persona: Vera)" | Comparison table column header |
| 8 | `BATTLECARD_ANAPLAN.md` | §6 anchor | (no Vera=ICP-2 anchor) | Added blockquote at top of §6: "> **ICP-2 (Vera) anchor:** When sales hears 'we replaced Anaplan for the Controller' or 'our Controller is evaluating this', the deal is **ICP-2 / Vera** (per `docs/drafts/hermes/ICP.md` §2 — canonical `iris/PERSONAS.md` mapping, T-ST-006 v0.2 ratification). The objections below are written for **ICP-1 (Carla)** the founder-led AE-assisted motion. For ICP-2 (Vera) PLG/land-and-expand, swap 'CFO takes to CEO' → 'Controller evangelizes in Slack communities' and route to OSS tier funnel, not Pro." | Per Leader "§6 deal types" spec |

**Note:** Leader spec referenced 7 line-edits; actual implementation expanded to 8 line-edits + 3 header bumps (see §2) because the L20 spec content mapped to two adjacent tier rows (Open Source + Pro) and the L140 spec content mapped to L121 (table column, 1-indexed vs 0-indexed).

---

## §2 — Implied consistency edits (7 line-edits, scope-adjacent to the 7 specified)

For the canonical mapping to be internally consistent within each file, these 7 additional edits were required:

| # | File | Line | Change | Rationale |
|---|---|---|---|---|
| 1 | `PRICING.md` | L1 | DRAFT v0.1 → v0.2 with reconciliation note | Header bump per Leader spec |
| 2 | `ICP.md` | L1 | DRAFT v0.1 → v0.2 with reconciliation note | Header bump per Leader spec |
| 3 | `BATTLECARD_ANAPLAN.md` | L1 | DRAFT v0.1 → v0.2 with reconciliation note | Header bump per Leader spec |
| 4 | `BATTLECARD_ANAPLAN.md` | L8 (cross-ref) | "ICP-1 (Sandra, the Growing Mid-market CFO)" → "ICP-1 (Carla, the Growing Mid-market CFO) and ICP-2 (Vera, the Scrappy SaaS Controller)" | Cross-ref + Sandra→Carla per canonical |
| 5 | `BATTLECARD_ANAPLAN.md` | L30 | "Sandra (ICP-1) takes to her CEO" → "Carla (ICP-1) takes to her CEO" | Sandra→Carla per canonical |
| 6 | `ICP.md` | L74 | "**Persona:** 'Carlos'" → "**Persona:** 'Vera'" | The L74 persona line (logical companion to the L70 sub-bullet) |
| 7 | `ICP.md` | L78, L85 | "Carlos doesn't write a $50K check" / "Carlos is **not** evaluating Anaplan" → "Vera doesn't write..." / "Vera is **not** evaluating Anaplan" | The "Why this persona" paragraph and the three-witnesses table both reference Carlos in the same L70-85 section — updated for internal consistency |

**Total: 8 specified + 7 implied = 15 line-edits + 3 header bumps = 18 file modifications**

---

## §3 — What did NOT change (preservation discipline)

- **Math (PRICING.md):** $499/user/mo, $99/user/mo, $0 OSS tier — all pricing math UNCHANGED
- **Three-witness structure (ICP.md §1.5/§2.5):** Witness (a)/(b)/(c) structure preserved
- **Section structure (all 3 files):** Section headers, ordering, depth all preserved
- **Cross-references (BATTLECARD_ANAPLAN.md):** All `BATTLECARD_ANAPLAN.md` cross-refs to `PRICING.md` §2.3, `iris/PERSONAS.md`, etc. preserved
- **`iris/PERSONAS.md` itself:** Iris is the source-of-truth; no edits to PERSONAS.md

---

## §4 — Broader drift flagged for T-HER-010 (out of T-HER-009 scope)

The following Carlos/Sandra references in the 3 files are NOT updated in T-HER-009 (per strict 7-edit scope) but should be addressed in a follow-up T-HER-010 sweep:

| File | Lines with remaining Carlos/Sandra references | Out-of-scope because |
|---|---|---|
| `PRICING.md` | L43 (Carlos at 30+ FTE), L49 (Carlos is paranoid), L54 (Sandra ICP-1 CFO at 50–500 FTE), L78 (Carlos's 'Google Sheets' voice), L98-100 (OSS/Pro/Business tier messaging) | These are mid-paragraph references; the 7 specific edits were about cross-references and tier tables only |
| `ICP.md` | L96 (Budget range: $500-$5K/yr, Carlos's finance-tools line item), L97 (Decision maker: Carlos is the only decision maker), L103 (Carlos's 'I'll try anything once'), L104 (Carlos evangelizes), L105 (Carlos is paranoid), L106 (Carlos sees 'MRR waterfall by cohort'), L112 (Carlos has hired a real FP&A person), L114 (Carlos's friend is our funnel), L115 (Carlos is too small to need SOC 2), L150 (alienates Carlos) | These are detailed body-text references; the 7 specific edits were about the L70 sub-bullet + L121 table only |
| `BATTLECARD_ANAPLAN.md` | None (all Sandra→Carla updated; no remaining drift in this file) | — |

**Estimated T-HER-010 effort:** 30 min for 23+ remaining Carlos/Sandra references across 2 files (PRICING.md + ICP.md). Recommend when Leader batches the broader ICP reconciliation.

**Also flagged:** `docs/drafts/hermes/PARTNERSHIP_MOTION.md` (T-HER-007 v0.2) and `docs/drafts/hermes/CHANNEL_MOTIONS_v0.md` (T-HER-008 NEW slice) use the non-canonical mapping of **Chris=ICP-2, Vera=ICP-3**. Per Leader's broadcast, these should also be reconciled in a follow-up. **Estimated T-HER-010/011 effort: 60 min for the 2 channel docs.**

---

## §5 — Cross-Muse coordination

- **→ Iris T-IR-001:** `iris/PERSONAS.md` is the source-of-truth for Carla=ICP-1, Vera=ICP-2, Chris=ICP-3. No edits needed in PERSONAS.md.
- **→ Athena T-AT-011 v0.2 (in progress):** Re-validate Strategos's T-ST-006 board deck v0.2 with the canonical ICP-numbering. This T-HER-009 changelog can be cited as evidence that the GTM stack is being reconciled.
- **→ Strategos T-ST-007 (Q3 review, standby):** Will pull the v0.2 ICP-numbering into the strategic corpus.
- **→ Mnemosyne T-MN-002/003:** `docs/GLOSSARY.md` (pending) and `docs/ONBOARDING.md` (pending) may need ICP-numbering reconciliation per Leader's broadcast ("ARCHITECTURE.md §5 state management section may reference ICP-numbering — verify").
- **→ Hephaestus:** SOC 2 docs may reference ICP-numbering in customer-segment — verify (per Leader's broadcast).

---

## §6 — D-009 verification

- ✅ All 3 file headers bumped to v0.2 (DRAFT v0.2 — ICP-numbering reconciled...)
- ✅ All 8 specified edits applied (per Leader spec)
- ✅ All 7 implied consistency edits applied (for internal consistency within each file)
- ✅ Math preserved (PRICING.md tier pricing UNCHANGED)
- ✅ Section structure preserved (3 files, no new sections)
- ✅ Cross-references preserved (all `BATTLECARD_ANAPLAN.md` cross-refs still valid)
- ✅ Three-witness structure preserved (ICP.md §1.5/§2.5)
- ✅ `iris/PERSONAS.md` untouched (Iris is the source-of-truth)
- ⚠️ 23+ remaining Carlos/Sandra references in 2 files (PRICING.md + ICP.md) flagged for T-HER-010
- ⚠️ 2 channel docs (PARTNERSHIP_MOTION.md + CHANNEL_MOTIONS_v0.md) use non-canonical mapping (Chris=ICP-2, Vera=ICP-3) — flagged for T-HER-010/011

**T-HER-009 LOC: 18 modifications (15 line-edits + 3 header bumps) across 3 files. ~30 min execution per spec.**

Hermes OUT. 🏛️
