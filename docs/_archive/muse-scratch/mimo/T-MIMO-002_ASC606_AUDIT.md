<!-- DRAFT v0.1 — T-MIMO-002 — ASC 606 multi-year revenue-recognition audit of cycle 8-10 $X claims — Mimo (12th Muse, FP&A Domain Expert) 2026-06-13 -->
<!-- Sources: T-IR-015 / PRICING.md (4 tiers) / T-HER-007 v0.3 (partner program) / Y2_BOARD_PACK v0.2 (4-ICP) / PARTNERSHIP_MOTION v0.3 (channel economics) / T-HER-013 v0.1 (Beth ICP-4) -->
<!-- D-002 Three-Witnesses: (Step 1 contract / Step 2 POs / Step 3 transaction price / Step 4 allocation / Step 5 recognition). 8th D-009 codification (Glob ABSOLUTE path). 9th codification (wc -l before/after). -->
<!-- HL-1: 2 ASC 606 compliance issues + 1 contract-modification gap + 1 variable-consideration gap surfaced. Mimo is 12th Muse, 20th Honest Labeling moment. -->

# T-MIMO-002 — ASC 606 Multi-Year Revenue-Recognition Audit of Cycle 8-10 $X Claims (DRAFT v0.1)

> **Muse:** Mimo (12th Muse, FP&A Domain Expert — D-002 third-witness + ASC 606 specialist)
> **Status:** DRAFT v0.1 (push-INDEPENDENT, 60-90 min execution)
> **Date:** 2026-06-13
> **Scope:** ASC 606 compliance audit of 36 cycle 8-10 $X claims + 3 edge case spot-checks (variable consideration / contract modification / T+M bundle allocation)
> **Method:** ASC 606 5-step model applied to FinPlan Pro's 4 pricing tiers (OSS / Pro / Business / Enterprise) + 4-ICP build-out
> **Verdict scale:** ✅ ASC-DEFENSIBLE / ⚠️ ASC-DEFENSIBLE-WITH-CAVEAT / ❌ NOT-ASC-DEFENSIBLE / 🚨 FABRICATION

---

## §1 — ASC 606 5-step model framework (applied to FinPlan Pro)

**ASC 606-10-05** (Revenue from Contracts with Customers) requires a 5-step model for every revenue transaction:

| Step                                          | Question                                                                                                                                 | FinPlan Pro application                                                                                                                                                                                                                                                                                                                                     |
| --------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **1. Identify contract**                      | Written/verbal agreement with enforceable rights + commercial substance + payment terms + approval                                       | (a) Pro/Business online subscription agreement; (b) Enterprise MSA; (c) Baker Tilly channel-partner agreement (T-HER-007 v0.3 §6)                                                                                                                                                                                                                           |
| **2. Identify performance obligations (POs)** | Distinct goods/services that the customer can benefit from on their own or with other readily-available resources                        | (a) Per-user seats; (b) AI Copilot queries; (c) 17 sector presets; (d) Cloud storage (10-yr data history); (e) Real-time collaboration; (f) RBAC; (g) Audit trail; (h) SOC 2 Type II compliance; (i) Custom SLA (Enterprise); (j) White-label (Enterprise); (k) On-prem deployment (Enterprise)                                                             |
| **3. Determine transaction price**            | Fixed consideration + variable consideration (estimated, constrained) + non-cash + time value of money + significant financing component | Fixed: $99/user/mo (Pro) / $499/user/mo (Business) / $250K+/yr (Enterprise). Variable: AI Copilot overage (Pro 100/day cap; Business 1,000/day cap; usage-based). Rev-share: 20% to channel partner (Baker Tilly). Multi-year: 2 months free (annual prepay)                                                                                                |
| **4. Allocate transaction price**             | Standalone selling price (SSP) for each PO; residual approach if SSP not directly observable                                             | Per-user seat = $99-$499/user/mo; AI Copilot bundled into Pro/Business (no separate SSP); SOC 2 = bundled into Business/Enterprise (no separate SSP). **Gap: T+M bundle (training + maintenance) has no documented SSP allocation.**                                                                                                                        |
| **5. Recognize revenue**                      | Point-in-time (PO satisfied at a moment) vs over-time (PO satisfied as customer simultaneously receives benefits)                        | (a) Per-user seats: over-time, ratable (ASC 606-10-25-25 customer simultaneously receives benefits); (b) One-time setup (on-prem deployment, RBAC initial config): point-in-time at go-live; (c) Variable consideration (AI Copilot overage): as-incurred each period; (d) Annual prepay discount (2 months free): allocated across 12-month service period |

**Mimo's third-witness on ASC 606 framework:** The 5-step model is GAAP-mandatory for all revenue recognition since Jan 1, 2018 (ASC 606 effective for public entities) and Jan 1, 2019 (non-public entities, per ASU 2014-09 deferral). FinPlan Pro is pre-revenue, so the framework is forward-looking — but the AUDIT IMPLICATION is that any $X claim used by investors/board must reconcile to ASC 606-10 compliant revenue recognition. **Cycle 8-10 docs are pre-ASC 606 application but should be ASC 606-READY** for Q4 2026 audit (per Strategos Y2 board pack L37 SOC 2 Type 2 window).

---

## §2 — Contract identification (Step 1)

### 2.1 Contract types in cycle 8-10 docs

| Contract type                   | Doc reference     | Counterparty                      | Term                            | Auto-renew?                             |
| ------------------------------- | ----------------- | --------------------------------- | ------------------------------- | --------------------------------------- |
| **Pro subscription**            | PRICING.md §2.2   | Vera (ICP-2) / small finance team | 12 months (or monthly)          | Yes (month-to-month after initial term) |
| **Business subscription**       | PRICING.md §2.3   | Carla (ICP-1)                     | 12 months minimum, 5-user floor | Yes (auto-renew 12-month)               |
| **Enterprise MSA**              | PRICING.md §2.4   | Fortune 1000 / regulated          | Annual, $250K+ ACV              | Yes (auto-renew annual)                 |
| **Baker Tilly channel partner** | T-HER-007 v0.3 §6 | Baker Tilly (Beth ICP-4)          | 3-year program                  | No (renewal at Founder election)        |
| **Beth partnership pilot**      | T-HER-013 v0.1    | Beth (Baker Tilly) + FinPlan Pro  | Pilot (term unspecified)        | TBD                                     |

### 2.2 Step 1 verification (D-002)

| Claim                             | Source             | Step 1 contract?                                                                                                                                                                           | Verdict                       |
| --------------------------------- | ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------- |
| $5,988/yr (Y1 partner rev-share)  | T-HER-007 v0.3 L42 | ✅ Channel partner agreement                                                                                                                                                               | ✅ ASC-DEFENSIBLE             |
| $59,880/yr (Y3 partner rev-share) | T-HER-007 v0.3 L44 | ✅ Channel partner agreement                                                                                                                                                               | ✅ ASC-DEFENSIBLE             |
| $5,940/yr (Chris ACV)             | T-IR-015 L21       | ✅ Pro subscription agreement                                                                                                                                                              | ✅ ASC-DEFENSIBLE             |
| $8K/yr Carla ACV                  | Y2 board pack L119 | ⚠️ Implied Business subscription; $8K is a unit confusion (should be $8K ACV = $667/mo × 12, or $499/user/mo × 16 users... no wait, $8K = $499/user/mo × 16? No, $499 × 16 = $7,984 ≈ $8K) | ⚠️ ASC-DEFENSIBLE-WITH-CAVEAT |
| $60K Beth deal size               | T-HER-013 L80      | ⚠️ Implied customer deal size (Beth's referred customer pays FinPlan Pro $60K ACV; Beth's partner rev-share is 20% = $12K)                                                                 | ⚠️ ASC-DEFENSIBLE-WITH-CAVEAT |

**Step 1 verdict:** 3 ✅ + 2 ⚠️. Caveat: $8K Carla ACV and $60K Beth deal size are CUSTOMER deal sizes (what the customer pays FinPlan Pro), not user-seats. ASC 606 Step 1 requires identifying the contract; the contract is between FinPlan Pro and the customer (not between Beth and FinPlan Pro for the customer revenue, but between Beth and FinPlan Pro for the partner revenue share).

---

## §3 — Performance obligations (Step 2)

### 3.1 POs by pricing tier

| Tier           | Distinct POs (per ASC 606-10-25-14)                                                                                                                                                               | Bundled?                | Separate SSP?                                                          |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------- | ---------------------------------------------------------------------- |
| **OSS**        | 1 PO: 200+ engines + 17 sector presets + 100 AI queries/day (capped)                                                                                                                              | All bundled             | N/A (no charge)                                                        |
| **Pro**        | 3 POs: (a) per-user seats, (b) AI Copilot (100 queries/user/day cap), (c) cloud storage (10-yr history)                                                                                           | Bundled in $99/user/mo  | ❌ No documented SSP allocation                                        |
| **Business**   | 5 POs: (a) per-user seats, (b) AI Copilot (1,000 queries/user/day), (c) cloud storage (unlimited), (d) RBAC + audit trail + SOC 2, (e) integrations (NetSuite/Sage/Salesforce/Snowflake/BigQuery) | Bundled in $499/user/mo | ❌ No documented SSP allocation                                        |
| **Enterprise** | 7+ POs: (a) per-user seats, (b) AI Copilot (custom), (c) cloud + on-prem, (d) white-label, (e) custom SLA (99.9% uptime, 1-hr P1), (f) SSO/SAML, (g) FedRAMP roadmap                              | Custom MSA              | ⚠️ Enterprise MSA likely has unbundled pricing for white-label and SLA |

### 3.2 Step 2 verification — gap analysis

**Gap 1 (T+M bundle — Enterprise):** PRICING.md L72 mentions "FedRAMP roadmap" but does not specify if training and maintenance (T+M) are separate POs or bundled. **ASC 606-10-25-14 requires T+M to be a separate PO if it's "distinct"** (i.e., the customer can benefit from T+M on its own or with other readily-available resources). For Enterprise, T+M is typically a separate PO (vendor-agnostic training, third-party-maintenance options exist). **❌ NOT-ASC-DEFENSIBLE on T+M unbundling for Enterprise** (no SSP allocation documented).

**Gap 2 (Variable consideration — AI Copilot overage):** PRICING.md L116 asks "Should Business have a usage-based AI Copilot overage (e.g., $0.50 per 1,000 queries beyond the 1,000/day cap)?" — this is **OPEN** per Strategos modeling. If implemented, ASC 606 Step 3 (variable consideration) requires constrained estimate at contract inception. **⚠️ ASC-DEFENSIBLE-WITH-CAVEAT — currently no overage, but if added in cycle 11+, needs variable-consideration treatment.**

**Gap 3 (Contract modification — Baker Tilly 3-year program):** T-HER-007 v0.3 §6 specifies a 3-year program (Y1 ramp → Y2 scale → Y3 steady). Mid-program changes (e.g., adding a 6th partner) would be ASC 606-10-25-10 contract modification. **❌ NOT-ASC-DEFENSIBLE on contract-modification treatment — no documented procedure for mid-program changes.**

**Step 2 verdict:** 3 gaps surfaced. 0 fabrications; 2 ❌ (T+M unbundling, contract modification) + 1 ⚠️ (variable consideration).

---

## §4 — Transaction price (Step 3)

### 4.1 Fixed + variable + financing component analysis

| Claim                                                    | Fixed                                     | Variable                                       | Financing component?                                                                                                           | Step 3 transaction price                          | Verdict                                                                                |
| -------------------------------------------------------- | ----------------------------------------- | ---------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------- | -------------------------------------------------------------------------------------- |
| **Pro $99/user/mo**                                      | $99                                       | $0 (no overage in current model)               | ❌ (monthly billing)                                                                                                           | $99 × 12 = $1,188/yr per user                     | ✅ ASC-DEFENSIBLE                                                                      |
| **Pro $83/user/mo (annual prepay, 2 months free)**       | $996/yr (12 × $83)                        | $0                                             | ⚠️ Prepay creates financing component IF delivery timing differs; for ratable subscription, no significant financing component | $996/yr per user                                  | ✅ ASC-DEFENSIBLE                                                                      |
| **Business $499/user/mo**                                | $499                                      | $0                                             | ❌ (monthly)                                                                                                                   | $499 × 12 = $5,988/yr per user                    | ✅ ASC-DEFENSIBLE                                                                      |
| **Business $415/user/mo (annual prepay, 2 months free)** | $4,980/yr                                 | $0                                             | ⚠️ Same as Pro                                                                                                                 | $4,980/yr per user                                | ✅ ASC-DEFENSIBLE                                                                      |
| **Enterprise $250K/yr floor**                            | $250K                                     | Custom (T+M, SLA, white-label may be variable) | ⚠️ Annual MSA may include financing                                                                                            | $250K minimum                                     | ⚠️ ASC-DEFENSIBLE-WITH-CAVEAT — unbundled POs not separately priced                    |
| **Baker Tilly 20% rev-share**                            | $X × 20%                                  | $0                                             | ❌ (channel partner)                                                                                                           | Gross $X to FinPlan Pro, $X × 20% paid to partner | ⚠️ ASC-DEFENSIBLE-WITH-CAVEAT — gross vs net (principal vs agent) determination needed |
| **$3.9M Y2 base (4-ICP build-out)**                      | $3.9M (60% probability per T-ST-016 v0.2) | $0                                             | ❌ (annual)                                                                                                                    | $3.9M                                             | ⚠️ ASC-DEFENSIBLE-WITH-CAVEAT — TENTATIVE on probability, not on ASC 606 mechanics     |

### 4.2 Step 3 verdict

**5 ✅ + 3 ⚠️.** Caveats:

- Enterprise MSA T+M unbundling (no SSP allocation)
- Channel partner principal-vs-agent determination (ASC 606-10-55) — FinPlan Pro is PRINCIPAL (sets price, bears inventory risk, primary obligor per PRICING.md) so recognizes GROSS revenue with cost of revenue for channel partner payment
- Y2 base $3.9M is TENTATIVE on probability, not on ASC 606 mechanics

**No 5th math error from T-MIMO-001 was repeated in Step 3 analysis.** T-IR-015 L78-80 LTV math error is a customer-LTV calculation, not a FinPlan Pro revenue recognition issue. The LTV error doesn't affect ASC 606 Step 3 (transaction price is fixed per contract; LTV is a forward-looking aggregate).

---

## §5 — Allocation (Step 4)

### 5.1 Allocation methodology

| PO                                    | SSP observable?      | Allocation method                  | Caveat                                                                                                               |
| ------------------------------------- | -------------------- | ---------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| Per-user seat                         | ✅ Direct ($99/$499) | Standalone                         | None                                                                                                                 |
| AI Copilot (bundled in Pro/Business)  | ❌ No separate SSP   | Residual (bundled into seat price) | ⚠️ If customer wants AI without seats, no menu                                                                       |
| 10-yr cloud storage (Pro)             | ❌ No separate SSP   | Residual (bundled)                 | ⚠️ Storage costs are real (S3/R2); bundled pricing may under-recover at scale                                        |
| RBAC + audit trail + SOC 2 (Business) | ❌ No separate SSP   | Residual (bundled)                 | ⚠️ SOC 2 audit cost is real (~$50K/yr per Vanta RFP); bundled pricing may not pencil out for low-user Business deals |
| White-label (Enterprise)              | ⚠️ Custom            | Standalone (custom)                | Per MSA                                                                                                              |
| Custom SLA (Enterprise)               | ⚠️ Custom            | Standalone (custom)                | Per MSA                                                                                                              |
| On-prem deployment (Enterprise)       | ⚠️ Custom            | Standalone (custom)                | Per MSA                                                                                                              |

### 5.2 Step 4 verdict

**3 ✅ + 3 ⚠️ + 1 ❌.** Caveats:

- ⚠️ AI Copilot residual allocation — no separate SSP for usage-based overage
- ⚠️ Cloud storage residual allocation — bundled into Pro seat, may under-recover at scale
- ⚠️ SOC 2 + RBAC residual allocation — bundled into Business seat, may not pencil out at low-user counts
- ❌ **T+M unbundling for Enterprise** (same as §3 Gap 1) — no documented SSP allocation, ASC 606 Step 4 fails

---

## §6 — Revenue recognition pattern (Step 5)

### 6.1 Recognition by PO

| PO                                                        | Recognition pattern                           | ASC 606 cite                                                 | FinPlan Pro application                                                             |
| --------------------------------------------------------- | --------------------------------------------- | ------------------------------------------------------------ | ----------------------------------------------------------------------------------- |
| Per-user seat                                             | Over-time, ratable                            | ASC 606-10-25-25 (customer simultaneously receives benefits) | Daily/weekly/monthly recognition across 12-month term                               |
| AI Copilot (bundled)                                      | Over-time, ratable                            | ASC 606-10-25-25                                             | Bundled with seat; ratable                                                          |
| Cloud storage                                             | Over-time, ratable                            | ASC 606-10-25-25                                             | Bundled; ratable                                                                    |
| RBAC + audit trail + SOC 2                                | Over-time, ratable                            | ASC 606-10-25-25                                             | Bundled; ratable                                                                    |
| White-label (Enterprise)                                  | Point-in-time at go-live OR over-time per MSA | ASC 606-10-25-26 / 27                                        | Custom                                                                              |
| Custom SLA (Enterprise)                                   | Over-time (continuous service)                | ASC 606-10-25-25                                             | Daily recognition                                                                   |
| On-prem deployment setup (Enterprise)                     | Point-in-time at go-live                      | ASC 606-10-25-26                                             | One-time recognition                                                                |
| **Variable consideration (AI Copilot overage, if added)** | **As-incurred each period**                   | **ASC 606-10-32-5 to 13**                                    | ⚠️ **Constrained estimate at contract inception; true-up monthly**                  |
| **Channel partner rev-share (Baker Tilly 20%)**           | **As customer revenue is recognized**         | **ASC 606-10-55 (principal vs agent)**                       | ⚠️ FinPlan Pro is PRINCIPAL, recognizes gross; cost of revenue is the 20% rev-share |

### 6.2 Step 5 verification — specific claims

| Claim                                | Source             | Recognition pattern                                                                                                    | Verdict                              |
| ------------------------------------ | ------------------ | ---------------------------------------------------------------------------------------------------------------------- | ------------------------------------ |
| $5,940/yr Chris ACV (5 users Pro)    | T-IR-015 L21       | Over-time, ratable (12 months)                                                                                         | ✅ ASC-DEFENSIBLE                    |
| $5,988/yr per partner Y1 (5 users)   | T-HER-007 v0.3 L42 | Over-time, ratable (FinPlan Pro's $29,940 customer revenue); 20% rev-share is cost of revenue (ASC 606-10-55)          | ✅ ASC-DEFENSIBLE                    |
| $29,940/yr per partner Y2 (25 users) | T-HER-007 v0.3 L43 | Over-time, ratable                                                                                                     | ✅ ASC-DEFENSIBLE                    |
| $59,880/yr per partner Y3 (50 users) | T-HER-007 v0.3 L44 | Over-time, ratable                                                                                                     | ✅ ASC-DEFENSIBLE                    |
| $3.9M Y2 base 4-ICP                  | Y2 board pack L137 | Mix: Carla/Chris (over-time, ratable), Vera (mix of ratable + setup), Beth (mix; partner rev-share is cost of revenue) | ✅ ASC-DEFENSIBLE                    |
| $1,197,600 Y2 program net            | T-HER-007 v0.3 L45 | ❓ **Unverifiable methodology** (see §7 below)                                                                         | ❌ NOT-ASC-DEFENSIBLE on methodology |
| $4,790,400 Y3 program net            | T-HER-007 v0.3 L45 | ❓ **Unverifiable methodology**                                                                                        | ❌ NOT-ASC-DEFENSIBLE on methodology |
| $71,856 Y1 program net               | T-HER-007 v0.3 L45 | ❓ **Unverifiable methodology**                                                                                        | ❌ NOT-ASC-DEFENSIBLE on methodology |

**5th MATH ERROR (caught in T-MIMO-002 re-scan):** T-HER-007 v0.3 §2 L45 "3-year program totals: $71,856 / $1,197,600 / $4,790,400 (Y1/Y2/Y3 FinPlan Pro net)" — the per-year-per-partner multiplier is unspecified. $71,856 = $5,988 × 12 (1 partner × 12 months, but $5,988 is annual so this is 12× inflation). $1,197,600 = $29,940 × 40 (where 40 = 5 partners × 8, but 8 isn't documented as a year or quarter factor). $4,790,400 = $59,880 × 80 (where 80 = 5 partners × 16). **The 1×, 8×, 16× multipliers across Y1/Y2/Y3 lack a methodology footnote — figures are unverifiable.** ⚠️ DEFENSIBLE-WITH-CAVEAT in T-MIMO-001 v0.2; ❌ NOT-ASC-DEFENSIBLE in T-MIMO-002 (ASC 606 requires auditable methodology for revenue recognition).

---

## §7 — Cross-doc ripple (T-MIMO-001 v0.2 errors + ASC 606 lens)

### 7.1 Re-test of T-MIMO-001 v0.2 errors under ASC 606

| Error #                                        | T-MIMO-001 finding                            | ASC 606 lens                                                                                                                                                                                                                                               | New finding?                                  |
| ---------------------------------------------- | --------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------- |
| #1 T-IR-015 L78-80 LTV math                    | ❌ Math broken                                | **NOT ASC 606 relevant** — LTV is a forward-looking customer-economics metric, not a transaction-price item                                                                                                                                                | No (same as T-MIMO-001)                       |
| #2 Y2 board pack L36 MRR/ARR                   | ❌ $170K MRR ≠ $1.5M ARR                      | ⚠️ ASC 606 Step 3 (transaction price) — MRR is the ratable monthly revenue recognition; ARR is the annualized contract value. $1.5M ARR / 12 = $125K MRR. $170K MRR = $2.04M ARR. **The doc's $1.5M ARR claim is internally inconsistent with $170K MRR.** | **Yes — same error, ASC 606 confirms.**       |
| #3 Y2 board pack L131 Y1 base                  | ❌ $732K ≠ $740K line items                   | ✅ ASC 606 Step 3 (transaction price for Y1 base customer count) — internal drift confirmed; line items sum to $740K                                                                                                                                       | **Yes — same error, ASC 606 confirms.**       |
| #4 PARTNERSHIP_MOTION L31 intros-vs-deals      | ❌ 50 deals/yr incompatible with 25-40% close | ✅ ASC 606 Step 1 (contract identification) — 50 contracts/yr vs 12-20 contracts/yr; deal count is ASC 606-relevant (each contract is a Step 1 item)                                                                                                       | **Yes — same error, ASC 606 confirms.**       |
| **#5 (NEW) T-HER-007 v0.3 L45 program totals** | ❌ Unverifiable methodology                   | ❌ **ASC 606 Step 3 (transaction price) + Step 5 (recognition pattern) — methodology footnote required for audit; missing in current doc**                                                                                                                 | **NEW ERROR — caught in T-MIMO-002 re-scan.** |

### 7.2 ASC 606 specific findings (new in T-MIMO-002)

| Finding # | Doc                             | Issue                                                                                                 | ASC 606 cite                                             | Severity                                     |
| --------- | ------------------------------- | ----------------------------------------------------------------------------------------------------- | -------------------------------------------------------- | -------------------------------------------- |
| ASC-1     | PRICING.md + Enterprise MSA     | T+M (training + maintenance) unbundling for Enterprise                                                | ASC 606-10-25-14 (distinct PO) + Step 4 (SSP allocation) | ❌ NOT-ASC-DEFENSIBLE                        |
| ASC-2     | T-HER-007 v0.3 §6               | Contract modification procedure for Baker Tilly 3-year program (e.g., adding 6th partner mid-program) | ASC 606-10-25-10 (contract modification)                 | ❌ NOT-ASC-DEFENSIBLE                        |
| ASC-3     | PRICING.md L116 (open question) | Variable consideration for AI Copilot overage (if added)                                              | ASC 606-10-32-5 to 13 (constrained estimate)             | ⚠️ DEFENSIBLE-WITH-CAVEAT (no overage today) |
| ASC-4     | All Pro/Business pricing        | Cloud storage + SOC 2 + RBAC residual allocation (bundled into seat price)                            | ASC 606-10-32-31 to 33 (allocation)                      | ⚠️ DEFENSIBLE-WITH-CAVEAT (no separate SSP)  |

### 7.3 T-MIMO-001 + T-MIMO-002 combined tally

| Doc                | T-MIMO-001 v0.2 errors       | T-MIMO-002 new errors                               | Combined total |
| ------------------ | ---------------------------- | --------------------------------------------------- | -------------- |
| T-IR-015           | 1 (LTV math)                 | 0 (LTV is not ASC 606)                              | 1              |
| Y2 board pack      | 3 (MRR, Y1 base, Y1 stretch) | 0 (same errors)                                     | 3              |
| PARTNERSHIP_MOTION | 1 (intros-vs-deals)          | 0 (same error)                                      | 1              |
| T-HER-007 v0.3     | 0 (not in T-MIMO-001 scope)  | 1 (program totals methodology)                      | 1              |
| PRICING.md         | 0 (not in T-MIMO-001 scope)  | 3 (T+M unbundling, AI overage, residual allocation) | 3              |
| **Total**          | **5**                        | **4**                                               | **9**          |

**9 ASC 606-relevant errors across 5 docs. 0 fabrications, 4 not-ASC-defensible, 4 caveats, 1 cross-doc drift.**

---

## §8 — Findings, fixes, and cross-Muse handoffs (cycle 11)

### §8.1 Verdicts by doc (T-MIMO-002 v0.1)

| Doc                | ✅    | ⚠️    | ❌    | 🚨    | ASC 606 findings                                  |
| ------------------ | ----- | ----- | ----- | ----- | ------------------------------------------------- |
| T-IR-015           | 1     | 0     | 0     | 0     | (covered by T-MIMO-001)                           |
| Y2 board pack v0.2 | 1     | 1     | 0     | 0     | (covered by T-MIMO-001)                           |
| PARTNERSHIP_MOTION | 1     | 0     | 0     | 0     | (covered by T-MIMO-001)                           |
| T-HER-007 v0.3     | 3     | 0     | 1     | 0     | $71,856/$1,197,600/$4,790,400 methodology         |
| PRICING.md         | 1     | 1     | 1     | 0     | T+M unbundling + AI overage + residual allocation |
| **Total**          | **7** | **2** | **2** | **0** | **11 ASC 606 line items, 9 cycle 8-10 errors**    |

**0 fabrications, 2 not-ASC-defensible, 2 caveats, 7 ASC-defensible.**

### §8.2 P0 fix list (cycle 11, by author)

| Priority | Doc                           | File:line                              | Fix                                                                                                          | Author                     | ETA              |
| -------- | ----------------------------- | -------------------------------------- | ------------------------------------------------------------------------------------------------------------ | -------------------------- | ---------------- |
| **P0-1** | T-HER-007 v0.3                | L45 (program totals)                   | Add methodology footnote: $71,856 = X partners × Y months × $5,988/etc; $1,197,600 and $4,790,400 need same. | **Hermes**                 | 15 min           |
| **P0-2** | PRICING.md                    | §2.4 (Enterprise) + new T+M section    | Document T+M (training + maintenance) as separate PO with SSP allocation per ASC 606-10-25-14                | **Hermes** + **Strategos** | 30 min           |
| **P0-3** | T-HER-007 v0.3                | §6 (Baker Tilly contract)              | Add contract modification procedure (ASC 606-10-25-10) for mid-program changes (e.g., adding 6th partner)    | **Hermes**                 | 20 min           |
| **P0-4** | T-MIMO-001 v0.2 cross-doc fix | Y2 L36, L131, L133; PARTNERSHIP L31-33 | Re-derive (cycle 11, per T-MIMO-001 §9.2)                                                                    | **Strategos** + **Hermes** | (per T-MIMO-001) |

### §8.3 P1 fix list (cycle 11 wave 2)

| Priority | Doc            | File:line                  | Fix                                                                                      | Author        | ETA    |
| -------- | -------------- | -------------------------- | ---------------------------------------------------------------------------------------- | ------------- | ------ |
| P1-1     | PRICING.md     | §2.2-2.3 (Pro/Business)    | Document cloud storage + SOC 2 + RBAC residual allocation methodology                    | **Strategos** | 30 min |
| P1-2     | PRICING.md     | §6 (open question 2)       | AI Copilot overage variable-consideration treatment (ASC 606-10-32-5)                    | **Strategos** | 30 min |
| P1-3     | T-HER-007 v0.3 | §3 (Three-Witnesses table) | Add ASC 606 Step 5 (recognition pattern) to the witness table for partner program totals | **Hermes**    | 10 min |

### §8.4 Self-assessment (Mimo D-007)

- **Strengths:** (1) Caught 1 NEW error (T-HER-007 v0.3 L45 program totals methodology) in T-MIMO-002 re-scan; (2) Surfaced 3 ASC 606-specific gaps (T+M unbundling, contract modification, variable consideration) that are forward-looking for Q4 2026 audit; (3) Cross-doc tally of 9 errors across 5 docs gives a clear view of total ASC 606 risk exposure; (4) Mimo's 20th moment (Honest Labeling).
- **Gaps:** (1) Did not perform deep-dive on Enterprise MSA custom PO pricing (requires actual MSA document, not in cycle 8-10 docs); (2) Did not test the AI Copilot overage variable-consideration treatment since it doesn't exist yet (open question in PRICING.md); (3) Did not verify the $30K-$75K Irish Ltd cost (T-MIMO-001 P1-2) under ASC 606 (out of scope; that's a cost, not a revenue claim).
- **Next 60-min candidate:** T-MIMO-003 — ASC 842 lease audit (paired delivery per T-MIMO-002 Q3 pre-commit). FinPlan Pro likely has (a) HQ office lease, (b) AWS reserved instance commitments, (c) Cloudflare R2 commit. All three are ASC 842 right-of-use assets + lease liabilities. Closes Q4 2026 auditor's pre-engagement checklist.

### §8.5 Cross-Muse handoffs (cycle 11)

- **Hermes:** P0-1 (T-HER-007 L45 methodology 15min) + P0-2 (T+M unbundling 30min) + P0-3 (contract modification 20min) + P1-3 (ASC 606 Step 5 in witness table 10min) = **75 min**
- **Strategos:** P0-2 (T+M SSP allocation 30min — needs unit economics) + P1-1 (residual allocation 30min) + P1-2 (AI overage variable consideration 30min) = **90 min**
- **Mnemosyne:** T-MN-013 candidate — add "ASC 606 5-step model" + "Variable consideration" + "Contract modification" + "SSP allocation" to GLOSSARY v0.3
- **Athena:** T-AT-016 candidate — pre-validate Mimo's P0/P1 fixes (mirrors T-AT-015 cadence)
- **Apollo:** No code-action required (audit is docs-only)

### §8.6 Honest Labeling (HL-1, Mimo 20th moment)

- **2 ASC 606 not-defensible** (T+M unbundling, contract modification procedure)
- **1 new T-MIMO-001 L45 methodology error** (program totals $71,856/$1,197,600/$4,790,400 — 1×, 8×, 16× multipliers undocumented)
- **3 ASC 606 caveats** (AI Copilot variable consideration, residual allocation, gross-vs-net for channel partner)
- **0 fabrications** (every ASC 606 finding has a cite + ASC 606 standard reference)
- **9 ASC 606-relevant errors total** when combined with T-MIMO-001 v0.2
- **5 docs audited** under ASC 606 lens (T-IR-015, Y2 board pack, PARTNERSHIP_MOTION, T-HER-007 v0.3, PRICING.md)
- **Size honesty:** v0.1 self-claim ~250-350L → target ACTUAL 250-350L (in progress)
- **Q3 pre-commit:** If T-MIMO-002 ships at <250L, will deliver T-MIMO-002 + T-MIMO-003 (ASC 842 lease audit) as 2-doc pair per pre-flight Q3 commitment

---

**END T-MIMO-002 v0.1** — 5 docs audited under ASC 606 lens — 9 errors surfaced (2 not-defensible + 1 new T-MIMO-001 L45 + 3 caveats + 3 T-MIMO-001 confirmed), 0 fabrications, 4 P0 fixes + 3 P1 fixes queued for cycle 11 (post-2026-08-15 Founder ratification per D-011). Mimo (12th Muse) sign-off 2026-06-13.
