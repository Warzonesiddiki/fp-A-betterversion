# Owner decision packet — FinPlan Pro

> **Purpose:** one page the owner can answer in a single reply. Every decision
> below is in the owner's authority, not the agent's. The recommended default is
> what the agent will use until the owner says otherwise. Most defaults are safe
> because they **remove claims** rather than add them; O2 is a reversible
> versioning default. All are reversible by a later decision.

**Prepared/reissued:** 2026-10-20; historical owner-input packet. **Status note 2026-11-04:** O1's *architecture* question was resolved by DEC-104 (universal import using the user's own template system for D365 and other accounting/finance sources). This packet's request for anonymized source samples and control totals remains an evidence request, not an open decision about whether universal import is in scope. O4 was resolved by DEC-102: the product is not a SOX compliance system and the local chain is not SOX authority; do not request a second answer unless the owner wants to reverse that decision. O8 remains unverifiable when GitHub Actions access returns HTTP 403; no answer or certification is inferred.
**Reply rule:** reply with corrections only. Silence means the recommended
default is adopted as a **provisional default**, recorded in
[`decision-log.md`](decision-log.md), and named as provisional in every report.

## 1. The nine decisions

| ID     | Question                                                                                                             | Recommended default                                                                                                     | Why it is safe                                                      | What stays blocked                                 |
| ------ | -------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------- | -------------------------------------------------- |
| **O1** | Can you provide one anonymized D365 export per used shape (F&O GL/journal entity, BC G/L, or another documented shape) plus independent source controls? | DEC-104 accepts the universal user-template path; without real samples and controls, each shape remains mapping-capable but unverified | Prevents a false “verified D365” label while preserving the accepted universal-import direction | Owner-validated shape label and any provider-specific live claim |
| **O2** | Rolling forecast: replace or blend? Which periods roll? How does an approved forecast interact?                      | **Versioned replace**: actuals replace closed periods; a new version is created; the prior approved version is retained | Reversible; preserves an audit trail; no silent overwrite           | Wiring `RollingForecastEngine` as supported        |
| **O3** | Encryption-key escrow/recovery: who can recover, and under what procedure?                                           | **No escrow claim**; user-held recovery key; no "your data is safe" wording until a restore test passes                 | Removes an unsupported security claim; keeps custody with the owner | Backup/restore certification; security marketing   |
| **O4 — RESOLVED (DEC-102)** | Is FinPlan Pro a SOX compliance system? | **No.** The local chain is client evidence, not SOX authority. | Removes an unsupported compliance claim. | No SOX-compliance claim; reopen only by a new owner decision. |
| **O5** | Which sectors and jurisdiction tiers are supported scope?                                                            | **None certified**; generic FP&A only; all sector packs labelled `EXPERIMENTAL`                                         | Removes certification claims; keeps breadth visible but honest      | E4 builds; E5 certification order                  |
| **O6** | External AI provider: yes or no?                                                                                     | **Local-only AI**; no external egress                                                                                   | Matches DEC-022 and DEC-003; no data leaves the machine             | Any non-local AI                                   |
| **O7** | Can we verify the native Tauri build on a real desktop toolchain?                                                    | **No offline/desktop claim** until verified                                                                             | Removes unsupported platform claims                                 | Offline auth, native persistence, installer claims |
| **O8** | Is CI on `main` green after PR #78?                                                                                  | Record the actual state; if the integration returns 403, record "unverifiable", not red or green                        | Prevents a false release assertion                                  | Release posture                                    |
| **O9** | What is the authoritative authorized-entity set per user, and the entity-switch policy?                              | **Deny by default**; never infer access from the active entity; owner supplies the grants                               | Fails closed; no privilege escalation by inference                  | `authStore.switchEntity` authorization             |

## 1.1 Other §20 scope decisions

| Decision                       | Recommended default                                                                       | What stays blocked                     |
| ------------------------------ | ----------------------------------------------------------------------------------------- | -------------------------------------- |
| Browser versus PWA positioning | Browser build is a development/preview surface; no supported offline/PWA claim            | PWA/offline positioning                |
| Desktop updater channel        | No auto-update claim; manual, signed installer only after O7                              | Updater UI and release claims          |
| Server fate (Q6)               | Retire from supported scope; keep code non-shipping until signed                          | Server integration claims              |
| Plugin marketplace/sandbox     | No marketplace; no sandbox-isolation claim until isolation tests and a threat model exist | Plugin listings and marketplace claims |
| Direct D365 API pull               | Not currently supported; the universal file/template direction is accepted under DEC-104. Consider a provider-specific API only after owner priority, API/security research, and the shared import contract | Direct API feature claim and live support until those gates pass |

## 2. Workflow facts (plan §12)

Please confirm or correct these; they affect imports, statements, comparisons and
correction tracking.

| Fact                                     | Recommended provisional answer                                                                                   |
| ---------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| D365 product/version and export route    | _owner to confirm_ (F&O / Business Central; export route and frequency)                                          |
| Fiscal calendar and close timing         | April–March fiscal year; close by the 5th working day                                                            |
| Entity/currency scope                    | INR presentation; multi-currency transaction data; consolidation only where entity scope is defined              |
| Comparison sign convention               | Debit-positive raw GL; presentation signs normalized by account type; comparisons state the convention on screen |
| Correction assignees and due-date rhythm | Role-based queue (accountant → reviewer); due date by materiality tier; weekly review                            |
| Always-review/watchlist accounts         | Top-N by materiality and prior-period variance; owner can name specific accounts                                 |

These are provisional. They must not be presented as owner-confirmed until the
owner replies.

## 3. Response template

```text
O1:  [provided / not available] — files: ...
O2:  [accept default / change: ...]
O3:  [accept default / change: ...]
O4:  RESOLVED by DEC-102 — no SOX compliance system; no response needed unless reversing the decision.
O5:  [accept default / change: ...]
O6:  [accept default / change: ...]
O7:  [accept default / change: ...]
O8:  [CI is green / red / unknown]
O9:  [accept default / provide grants and policy: ...]
§12: [accept defaults / corrections: ...]
§20: [accept defaults / corrections: ...]

108–200 source: [attached / pasted / not available]
Checklist version/source: [confirm current source; DEC-034 records 111–200 as an extension]
D365 samples + control totals: [attached / not available]
```

## 4. What the agent will do without an answer

- Continue all Tier A engineering work.
- Keep every affected capability labelled `EXPERIMENTAL` or `NOT SUPPORTED`.
- Record each default as a provisional decision with a review trigger.
- Re-ask only if a new fact makes the default unsafe, or if the owner's answer is
  required for a release claim.

## 5. What the agent will never do without an answer

- Call a D365 shape verified.
- Claim "your data is safe", SOX compliance, or jurisdiction support.
- Delete a persisted data namespace or perform an irreversible migration.
- Infer an entity grant from the active entity.
- Declare the programme complete or ship a release.
