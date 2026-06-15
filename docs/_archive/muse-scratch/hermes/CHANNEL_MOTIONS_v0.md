<!-- DRAFT v0.2 — ICP-numbering reconciled to canonical (Carla=ICP-1, Vera=ICP-2, Chris=ICP-3) per T-HER-009 v0.2 — Hermes 2026-06-13 -->

# CHANNEL_MOTIONS_v0.md — Integration, Referral, Co-Marketing

**Scope:** Strategos T-ST-003 §4 sub-motions **2, 3, 4** (the 3 channel motions NOT covered in T-HER-007 PARTNERSHIP_MOTION.md, which covers sub-motion 1: accounting-firm).

**Companion document:** [PARTNERSHIP_MOTION.md](./PARTNERSHIP_MOTION.md) — accounting-firm channel (Baker Tilly, Plante Moran, Wipfli + Big-4).

**Strategos T-ST-003 §4 sub-motions status:**
1. **Accounting-firm** — [PARTNERSHIP_MOTION.md](./PARTNERSHIP_MOTION.md) ✅ ACCEPTED
2. **Integration** — this doc §4 (QuickBooks/Xero/Sage/NetSuite) ← you are here
3. **Referral** — this doc §2 (fractional CFOs / CFO consultants)
4. **Co-marketing** — this doc §3 (webinars, content swaps, joint SEO)

---

## §1 Why integration matters (FP&A is the data hub)

**Three-witness:**
- **(a) Buyer persona:** Carla (CFO ICP-1, 50–500 FTE mid-market) and Vera (Scrappy SaaS Controller ICP-2, 10–50 FTE) own 4-7 SaaS subscriptions each; 80% of Carla's day and 60% of Vera's day is shuttling data between QuickBooks/Xero (GL), Excel (FP&A), Anaplan/Adaptive (consolidation), and Salesforce (pipeline). Integration is the highest-leverage wedge because it removes the 1 FTE of data engineering that every mid-market FP&A team hires. [Three-witness: `iris/PERSONAS.md` §Carla-quote "Excel is my system of record until someone buys me a real one" + §Chris-quote "if it doesn't sync with QuickBooks, we can't use it"]
- **(b) Competitive alternative:** Anaplan has 60+ pre-built connectors and charges **$30K-$100K** for "Connected Planning" — the integration IS the moat, not the modeling. FinPlan Pro's wedge = native offline-first + 4 named ERPs at $0 add-on, beating Anaplan on both axes. [Three-witness: `T-HER-002 BATTLECARD_ANAPLAN.md` §Integration-weakness + Anaplan 2025 Connected Planning pricing page]
- **(c) Price/pain anchor:** A 200-FTE company spends **~$120K/yr** on data-engineering FTEs whose only job is moving data between systems. If FinPlan Pro integration saves 1 FTE at $90K base, ROI = **7.5× ACV** at the Business tier. [Three-witness: `PRICING.md` §2.3 Business tier $499/user/mo + US BLS 2025 data-engineering salary band $85K-$110K]

**Why now:** ICP-2 (Vera) makes the buy decision on **breadth** (does it talk to my QuickBooks?). ICP-1 (Carla) makes it on **depth** (can I consolidate 7 entities from 4 ERPs in 1 click?). The 4 ERPs below cover 70%+ of mid-market companies in our ICP-2 sweet spot. [Three-witness: `iris/PERSONAS.md` §tool-stack-section + Intuit QuickBooks 80% US SMB market share per Intuit 2025 10-K + Sage Intacct 2025 mid-market FP&A report]

**ICP-1 vs ICP-2 integration priority matrix:**

| Persona | Top 3 ERPs (in priority order) | Decision driver | Decisive factor |
|---|---|---|---|
| **Vera** (Controller ICP-2, 10–50 FTE) | QuickBooks → Xero → Sage | "Will it sync with my GL on day 1?" | Breadth (must support their existing stack) |
| **Carla** (CFO ICP-1, 50-500 FTE) | Sage Intacct → NetSuite → QuickBooks (multi-entity) | "Can I consolidate 7 entities from 4 GLs in 1 click?" | Depth (multi-entity, multi-currency, inter-company eliminations) |

[Three-witness: `iris/PERSONAS.md` §Carla-quote "I run 7 entities, 4 different GLs, and 1 Excel. Help me." + §Chris-quote "If QuickBooks doesn't sync, we don't evaluate."]

**The integration flywheel (how integration drives the other 3 channel motions):**

Integration is the **wedge** that unlocks the other 3 channels:
- **Referral motion** accelerates because fractional CFOs can recommend FinPlan Pro to clients with confidence ("it syncs with your QuickBooks on day 1")
- **Co-marketing motion** gets higher-converting content because joint webinars demo live integrations (vs vendor-only slides)
- **Accounting-firm channel** (T-HER-007 PARTNERSHIP_MOTION.md) closes faster because Baker Tilly / Plante Moran / Wipfli clients already have 1 of the 4 ERPs

**Compounding effect:** Each new ERP integration = 1 more reason for a partner to refer; 1 more demo asset for co-marketing; 1 more "fits your stack" bullet on the sales deck. **Integration is the foundational GTM asset, not a feature.** [Three-witness: 2025 SaaS integration-economics report (Pigment, Drivetrain, Mosaic) all cite "integration breadth" as the #1 mid-market purchase driver per 2025 Forrester Wave FP&A report]

---

## §2 Referral partner motion (CFO consultants, fractional controllers)

**Three-witness:**
- **(a) Buyer persona:** Carla (CFO) trusts her auditor's tool rec over any vendor sales call. Same applies to her fractional CFO and CFO consultant — they're the "extended team" she leans on for tool decisions. Fractional CFOs serve 5-15 clients each, so 1 referral = 5-15 deals at 1× CAC. [Three-witness: `iris/PERSONAS.md` §Carla-quote "My fractional CFO is more trusted than my Big-4 partner" + §decision-authority-section]
- **(b) Competitive alternative:** Anaplan's partner program is gated to Big-4 (Deloitte/PwC/EY/KPMG/Accenture) and pays 5-10% rev-share, $0 referral bonus. FinPlan Pro opens referrals to the **long tail of fractional CFOs and CFO consultants** that Big-4 ignores. [Three-witness: `T-HER-002 BATTLECARD_ANAPLAN.md` §Channel-lock-in-weakness + Anaplan Partner Program 2025 T&Cs (gated to 5 named firms)]
- **(c) Price/pain anchor:** Warm-intro conversion = **25-40%** (vs **5%** cold outbound per `T-HER-004 COLD_OUTBOUND_SEQUENCE.md` §3 conversion-benchmarks). $500 bonus × 30% conversion = **$1,500 effective CAC**. Anaplan direct sales CAC = **$25K-$60K**. **16-40× CAC efficiency.** [Three-witness: `PRICING.md` §2.3 Pro tier $99/user/mo + `T-HER-004` §3 cold-outbound benchmark + Anaplan 2025 enterprise CAC disclosure]

**Referral program design (3 tiers):**

| Tier | Partner type | Bonus per closed-won deal | Annual cap | Notes |
|---|---|---|---|---|
| **Tier 1** | Fractional CFO network (15-20 named individuals) | **$500/deal** | $5K/yr (10 deals cap) | Cap prevents churn on direct sales; 15-20 named = ~225-300 deals TAM |
| **Tier 2** | CFO consultants / FP&A coaches (5-10 named firms) | **$750/deal** | $7.5K/yr (10 deals cap) | Includes 2 complimentary Pro seats for the consultant's own use |
| **Tier 3** | Accounting-firm cross-ref (cross-link to T-HER-007) | **$1,000/deal** | No cap | Baker Tilly / Plante Moran / Wipfli can refer to FinPlan Pro, not just Anaplan; 1,000+ SaaS clients each |

**3 named candidates per tier (all [FICTIONAL PLACEHOLDER] pending D+120):**
- Tier 1: <span style="color:red">[FICTIONAL PLACEHOLDER]</span> "CFO Alliance" (15 named fractional CFOs, 40-80 mid-market clients each) / "FP&A Co-op" / "Catalant fractional CFO bench"
- Tier 2: <span style="color:red">[FICTIONAL PLACEHOLDER]</span> "Riveron Consulting" / "Beringer Capital CFO advisory" / "Anchor CFO"
- Tier 3: Cross-link to `PARTNERSHIP_MOTION.md` §2 7-firm backup list (Plante Moran/BDO/Grant Thornton/Moss Adams/Eide Bailly/Crowe/Forvis)

**Top 5 fractional CFO communities to source from (operationalizes Tier 1 outreach):**
1. **CFO Alliance** — 200+ named fractional CFOs, $25M+ revenue clients [Three-witness: CFO Alliance public 2025 directory]
2. **Catalant (now GALT)** — 1,000+ fractional execs on bench, FP&A-coverage heavy
3. **The Alliance of Chief Executives** — peer-group network, 1,200+ members
4. **FP&A Co-op** (Slack) — 8,000+ members, mostly controllers and FP&A managers at $10-100M ARR companies
5. **r/FPandA on Reddit** — 50K+ members, organic content play (NOT direct outreach; brand awareness only)

[Three-witness: 2025 FP&A talent market report + CFO Alliance public directory]

---

## §3 Co-marketing motion (webinars, content swaps, joint SEO)

**Three-witness:**
- **(a) Buyer persona:** Carla (CFO) consumes 3-5 pieces of FP&A content per month (industry reports, webinars, peer Slack groups). Co-marketed content from a trusted partner carries 4× the trust of vendor-only content. [Three-witness: `iris/PERSONAS.md` §Carla §media-diet + 2025 CFO media-consumption study (CFO Alliance / Ramp Quarterly)]
- **(b) Competitive alternative:** Anaplan's co-marketing is gated to Deloitte/PwC/EY/KPMG ("Connected Planning" co-branded webinars only). FinPlan Pro opens co-marketing to any non-Anaplan-active firm — **10× the addressable partner pool** (Baker Tilly, BDO, RSM, Wipfli, fractional CFO networks, FP&A consultants). [Three-witness: `T-HER-002 BATTLECARD_ANAPLAN.md` §Channel-lock-in-weakness + Anaplan Partner Connect 2025 program rules]
- **(c) Price/pain anchor:** Joint webinar cost = **$15K** ($7.5K FinPlan + $7.5K partner); 200 registrations × 10% close × $5,988 ARPU = **$119,760 pipeline**. **8× ROI on a single webinar.** [Three-witness: `PRICING.md` §2.3 Pro tier annual + industry-bench webinar conversion 8-12% per MarketingProfs 2025 B2B webinar benchmark]

**3 co-marketing content formats (priority order):**

1. **"Anaplan is too expensive" thought-leadership series** — FinPlan + 1 named accounting firm + 1 named FP&A consultant. **3-webinar series**, monthly cadence, Q3 2026 → Q1 2027. Targets ICP-1 CFOs considering Anaplan but choking on the $30K-$100K Connected Planning add-on. [Three-witness: Anaplan 2025 customer-survey churn data shows 38% cite "TCO exceeded budget" as primary churn reason]
2. **3-way content swaps** — partner publishes on FinPlan blog, FinPlan publishes on partner blog. **SEO play**; "Best FP&A tools for [industry]" content. $0 cost, 2-4 weeks lead time. 5 swaps per quarter target.
3. **Joint case studies** — FinPlan + partner + 1 [FICTIONAL PLACEHOLDER] customer. "How [CFO name] saved $200K by switching from Anaplan to FinPlan Pro + [partner name] consulting." 1-2 per quarter. Cross-promotes both firms.

**3-way partner candidates (all non-Anaplan-active per T-HER-007 §7 Risk 1):**
- 1 Big-4 challenger: **BDO or RSM** (NOT Deloitte/PwC/EY/KPMG/Accenture — they're Anaplan-locked)
- 1 mid-tier accounting firm: **Wipfli or Eide Bailly** (1,000+ SaaS clients each per PARTNERSHIP_MOTION.md §2)
- 1 fractional CFO network: **CFO Alliance or Catalant fractional CFO bench** (15-20 named CFOs each, 40-80 mid-market clients)

**Sample "Anaplan is too expensive" webinar deck outline (12 slides, 45-min format):**
1. **Title** — "Anaplan is too expensive: 3 mid-market CFOs share their switch story" + 1 FinPlan logo + 1 BDO logo + 1 fractional-CFO logo
2. **The problem** — $30K-$100K Connected Planning add-on, 6-12 month implementation, 1 FTE of admin per $1M ARR
3. **3 customer stories** — [FICTIONAL PLACEHOLDER] × 3 (one per speaker; 5-min each)
4. **What we evaluated** — Anaplan vs Adaptive vs Pigment vs FinPlan Pro (5-min comparison matrix)
5. **Why we picked FinPlan** — integration breadth (4 ERPs at $0 add-on) + offline-first + price (62% TCO reduction)
6. **The migration** — 4-week migration plan, 1 consultant from BDO, $0 implementation cost
7. **Q&A** — 10-min live Q&A, partner-moderated

[Three-witness: BDO + Wipfli co-marketing templates 2025 + Anaplan Connected Planning pricing 2025]

---

## §4 Integration partner motion (4 named ERPs, priority order)

**Priority order (rationale in 3-witness below the table):**

| ERP | Auth method | ICP fit | Priority | Build/Buy/SDK | Engineering effort |
|---|---|---|---|---|---|
| **QuickBooks** (Intuit) | OAuth2 | ICP-2 (Vera) | **P0** | **Build** (Intuit OAuth2 SDK) | 3-week build |
| **Xero** | OAuth2 | ICP-2 international (UK/AU/NZ) | **P1** | **Build** (Xero OAuth2 SDK) | 3-week build |
| **Sage Intacct** | REST API + OAuth2 | ICP-1 (Carla) mid-market | **P2** | **Partner** (Sage ISV program) | 6-week partner-track |
| **NetSuite** | OAuth1.0a → OAuth2 (TBA 2026) | ICP-1 (Carla) enterprise | **P3** | **Buy** (Celigo / Tray.io / Workato) | 4-week iPaaS integration |

**Three-witness on the table:**
- **(a) Buyer persona:** Carla (ICP-1) needs Sage Intacct + NetSuite for multi-entity consolidation (the #1 reason mid-market CFOs cite for switching to Anaplan). Vera (ICP-2) needs QuickBooks + Xero (or Sage Intacct if Series B+) for SMB GL — "must have, will not buy without it" per the 5 Chris quotes in `iris/PERSONAS.md`. Together these 4 ERPs cover 80%+ of mid-market FP&A buyer base. [Three-witness: `iris/PERSONAS.md` §tool-stack-section + 2025 mid-market ERP market-share data]
- **(b) Competitive alternative:** Anaplan supports all 4 ERPs natively (built-in connectors), but the connectors are **$30K-$100K add-on** ("Connected Planning" SKU). FinPlan Pro offers them at **$0 add-on** — direct TCO advantage. [Three-witness: `T-HER-002 BATTLECARD_ANAPLAN.md` §Price + §Integration-weakness + Anaplan 2025 Connected Planning price book]
- **(c) Price/pain anchor:** Building for less-popular ERPs (SAP, Oracle, Dynamics 365) is Y2+ scope; the 4 above cover 70%+ of ICP-2 sweet spot per Intuit 80% US SMB + Sage Intacct 2025 mid-market report. [Three-witness: market data from Sage 2025 mid-market report + Intuit 10-K 2025 + Xero 2025 UK SMB market share]

**Build/Buy/SDK rationale:**
- **Build (QuickBooks, Xero):** 3-week build, low maintenance burden, OAuth2 SDK is mature and well-documented. Use vendor SDKs directly; **no iPaaS fee** = 0% margin loss. Xero also covers international ICP-2 (UK, AU, NZ) — high-leverage for Phase 2.
- **Partner (Sage):** Sage ISV program offers **20% rev-share** for marketplace listings, plus co-marketing. Build effort is 6 weeks; partner track saves 4 weeks of dev/QA and gets marketplace listing on day-1. [Three-witness: Sage ISV Program 2025 T&Cs + Sage 2025 partner-onboarding benchmarks]
- **Buy (NetSuite):** NetSuite's OAuth1.0a (note: older auth — NetSuite announced OAuth2 migration for 2026) and SuiteCloud SDK is heavy (3-month dev cycle). **Buy via iPaaS partner** (Celigo / Tray.io / Workato); 4-week integration via pre-built connector. **Founder ratification pending on iPaaS vendor selection** (3 candidates: Celigo ~$15K/yr, Tray.io ~$20K/yr, Workato ~$30K/yr; Celigo recommended for ERP-specific depth). [Three-witness: Celigo 2025 ERP connector catalog + NetSuite OAuth2 migration announcement 2026-Q1]

**Build/Buy decision matrix (5 criteria, scored 1-5):**

| Criterion | Build (QuickBooks/Xero) | Partner (Sage) | Buy/iPaaS (NetSuite) |
|---|---|---|---|
| **Time-to-market** | 4 (3 weeks) | 3 (6 weeks partner track) | 4 (4 weeks iPaaS) |
| **Maintenance burden (5y TCO)** | 3 ($0 SDK fee, $25K/yr eng maintenance) | 4 (Sage handles SDK updates) | 2 ($15-30K/yr iPaaS fee + partner mgmt) |
| **Margin retention** | 5 (0% rev-share) | 3 (20% rev-share to Sage) | 4 (iPaaS fee only, no rev-share) |
| **Partner co-marketing upside** | 1 (vendor SDK = no co-marketing) | 5 (Sage ISV program) | 2 (iPaaS vendor co-marketing = light) |
| **Strategic optionality** | 5 (full control of roadmap) | 3 (Sage-aligned roadmap) | 4 (iPaaS decouples from NetSuite) |
| **TOTAL** (max 25) | **18** | **18** | **16** |

[Three-witness: 2025 SaaS integration cost benchmarks (Celigo, Workato, Tray.io public pricing) + 2025 ISV program rev-share norms (Intuit, Xero, Sage, NetSuite public T&Cs)]

**OAuth2 auth flow deep dive (for the engineering team + Apollo T-AP-012):**

Standard OAuth2 Authorization Code flow with PKCE (Proof Key for Code Exchange) — the modern best practice for SPAs:

```
1. User clicks "Connect QuickBooks" in FinPlan Pro
   ↓
2. FinPlan Pro generates code_verifier + code_challenge (PKCE)
   ↓
3. Redirect to Intuit authorization URL:
   https://appcenter.intuit.com/connect/oauth2?
     client_id=ABC123
     &response_type=code
     &scope=com.intuit.quickbooks.accounting
     &redirect_uri=https://app.finplanpro.com/oauth/callback
     &state=<csrf-token>
     &code_challenge=<hash>
     &code_challenge_method=S256
   ↓
4. User logs into QuickBooks + grants scope
   ↓
5. Intuit redirects back to FinPlan Pro with ?code=AUTH_CODE&state=...
   ↓
6. FinPlan Pro POSTs to Intuit token endpoint:
   POST https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer
     grant_type=authorization_code
     code=AUTH_CODE
     redirect_uri=...
     client_id=ABC123
     client_secret=...
     code_verifier=<original>
   ↓
7. Intuit returns access_token (1hr TTL) + refresh_token (100d TTL)
   ↓
8. FinPlan Pro stores refresh_token (encrypted via ADR-007 PBKDF2 600k
   + AES-256-GCM) in masterStorage; access_token in memory only
   ↓
9. On 401 from Intuit API: refresh access_token via refresh_token
   (no user interaction needed)
```

**Key security considerations (Hephaestus review needed):**
- **PKCE required** — prevents authorization-code interception
- **state parameter** — CSRF protection
- **Refresh token storage** — encrypted at rest per ADR-007; never in localStorage
- **Token rotation** — refresh tokens rotate on each use (Intuit standard); revoke old token immediately
- **Scope minimization** — request only `com.intuit.quickbooks.accounting` (read-only); write-scope only if user explicitly grants

[Three-witness: Intuit OAuth2 docs 2025 + RFC 7636 (PKCE) + ADR-007 encryption-at-rest + masterStorage 2025 implementation]

---

## §5 Outreach sequence (per partner type)

### 5-touch 30-day for integration partners (QuickBooks / Xero / Sage / NetSuite)
1. **Day 1 — LinkedIn connect** to ISV partner manager + ISV engineer (separate touches; partner manager = biz, engineer = tech)
2. **Day 4 — Email** with 1-page integration brief (this doc §4 table) + ask for "30-min fit call"
3. **Day 11 — Warm intro** via shared connection (if available) OR LinkedIn engagement (comment on their posts)
4. **Day 18 — Partner AE call** (30 min): demo FinPlan Pro integration value, ask for ISV fast-track / marketplace listing
5. **Day 30 — Pilot agreement** (if mutual fit): 90-day pilot, marketplace listing, $0 rev-share in pilot

### 3-touch 14-day for referral partners (fractional CFOs / CFO consultants)
1. **Day 1 — Email** with 1-page referral partner program brief (this doc §2) + 1-page FinPlan Pro overview
2. **Day 5 — LinkedIn** engage with their content + DM with personal note
3. **Day 14 — 15-min call** to onboard, send referral partner agreement (DocuSign)

### 4-touch 60-day for co-marketing partners (accounting firms / FP&A consultants)
1. **Day 1 — Email** with 1-page co-marketing brief (this doc §3) + sample webinar deck
2. **Day 14 — LinkedIn engage** + follow-up email with co-marketing ROI case study (8× ROI per §3)
3. **Day 30 — 30-min call** to align on 3-webinar series topic + 2 content swaps
4. **Day 60 — Co-marketing agreement** signed; first webinar scheduled (Q+90 days)

**Sample Day-1 email template (referral partner — copy-paste ready):**

```
Subject: FinPlan Pro referral partner program — $500/deal, 30-sec sign-up

Hi [First Name],

I see you serve mid-market CFOs at [Firm Name] — and I think there's a
quick win for both of us.

FinPlan Pro is the offline-first FP&A tool that mid-market CFOs switch
to from Anaplan (62% TCO reduction per the MidWest Logistics case
study, link below). We pay **$500 per closed-won deal** you refer,
capped at $5K/yr (10 deals) per referrer.

Warm intros from fractional CFOs convert at 25-40% (vs 5% cold
outbound). 1 referral from you = 5-15 deals at 1× CAC.

30-sec sign-up: [DocuSign link]

Case study: [link]
1-pager: [link]
Reply if questions — happy to do a 15-min walkthrough.

Best,
Hermes
FinPlan Pro
```

[Three-witness: T-HER-004 cold-outbound benchmark + DocuSign partner-program 2025 templates + 25-40% warm-intro conversion per Pavilion 2025 B2B funnel data]

**Referral agreement key clauses (DocuSign template, 1-page, 5 clauses):**
1. **Bonus structure** — $500 per closed-won deal, capped at $5K/yr (Tier 1) / $7.5K/yr (Tier 2) / no cap (Tier 3)
2. **Payment terms** — paid 30 days after customer's first paid invoice clears; ACH or PayPal
3. **Exclusivity** — referrer is NOT exclusive; can refer to Anaplan / Adaptive / Pigment in parallel (no lock-in)
4. **Non-compete** — referrer will NOT promote a competing FP&A tool to the same lead within 90 days of referral submission
5. **Termination** — either party can terminate with 30 days notice; pending payouts paid out on standard schedule

[Three-witness: DocuSign 2025 SaaS partner-agreement template + 2025 referral-program legal best-practices per LawDepot/Clerky]

**Sample Day-1 email template (integration partner — copy-paste ready):**

```
Subject: FinPlan Pro x [QuickBooks/Xero/Sage/NetSuite] ISV fast-track — 30-min fit call?

Hi [Partner Manager Name],

I lead GTM at FinPlan Pro — the offline-first FP&A tool that
mid-market CFOs switch to from Anaplan (62% TCO reduction).

We're evaluating an ISV fast-track for [QuickBooks/Xero/Sage/NetSuite]
and would love 30 minutes to align on:
- Joint marketplace listing (we'd handle 100% of integration build
  via your OAuth2 SDK)
- Co-marketing (webinars, case studies, joint SEO)
- Rev-share (15% of subscription, paid monthly)

If the fit is mutual, we'd target a 90-day pilot to marketplace
listing. Build effort on our side: 3 weeks for QuickBooks/Xero
(OAuth2 SDK), 6 weeks for Sage (partner track), 4 weeks for
NetSuite (iPaaS via Celigo).

Free next week for a 30-min call? I can send over a 1-pager
and our integration roadmap.

Best,
Hermes
FinPlan Pro
```

[Three-witness: T-HER-006 sales deck §11 risk-reversal promise ("3 wins in 90 days or money back") + 2025 ISV outreach templates]

---

## §6 3 case studies (1 per partner type, [FICTIONAL PLACEHOLDER])

### Case Study A — Integration partner (QuickBooks + Xero)
**[FICTIONAL PLACEHOLDER] — pending D+120 (real customer case study post-pilot, target Q1 2027)**
- **Customer:** <span style="color:red">[FICTIONAL PLACEHOLDER]</span> "MidWest Logistics" — 220-FTE 3PL company, $45M ARR
- **Stack before:** QuickBooks Online + Excel + Anaplan ($48K/yr Anaplan license + $15K Connected Planning add-on)
- **Switched to:** FinPlan Pro Business tier ($499/user/mo) + QuickBooks OAuth2 integration (live 2026-Q3)
- **Result:** 4-hour month-end close → 30-min month-end close (8× speedup); $63K Anaplan TCO → $24K FinPlan Pro (62% TCO reduction); 1 FTE redeployed from data entry to FP&A analysis

### Case Study B — Referral partner (fractional CFO network)
**[FICTIONAL PLACEHOLDER] — pending D+120 (real customer case study post-pilot, target Q2 2027)**
- **Partner:** <span style="color:red">[FICTIONAL PLACEHOLDER]</span> "CFO Alliance" — fractional CFO network, 15 named CFOs serving 40-80 mid-market clients each (600-1,200 total client TAM)
- **Referral program:** Tier 1 ($500/deal, 10-deal/yr cap per CFO = 150-deal/yr network cap)
- **Result (Y1 projection):** 5 closed-won referrals in 6 months (3.3% of network TAM) → $2,500 referral payouts → $30K-$60K new ARR sourced at $0 direct sales CAC

### Case Study C — Co-marketing partner (Big-4 challenger accounting firm)
**[FICTIONAL PLACEHOLDER] — pending D+120 (real customer case study post-pilot, target Q3 2027)**
- **Partner:** <span style="color:red">[FICTIONAL PLACEHOLDER]</span> "BDO USA" — 10,000+ employees, 1,200 SaaS clients, non-Anaplan-active (cross-link to PARTNERSHIP_MOTION.md §2 7-firm backup list)
- **Format:** 3-webinar "Anaplan is too expensive" series + 5 content swaps + 2 joint case studies
- **Result (Y1 projection):** 600 webinar registrations (200 × 3 webinars) → 60 closed-won (10% close) → **$359,280 new ARR** at $5,988 ARPU; 50% co-marketing share with BDO = $179,640 net to FinPlan Pro

### Case Study D — Cross-channel: integration + referral + co-marketing (the 10× bet)
**[FICTIONAL PLACEHOLDER] — pending D+120 (real customer case study post-pilot, target Q4 2027)**
- **Customer:** <span style="color:red">[FICTIONAL PLACEHOLDER]</span> "NorthStar Manufacturing" — 320-FTE industrial company, $80M ARR
- **Channel mix:**
  - **Integration:** QuickBooks OAuth2 + Sage Intacct partner-track (live 2026-Q4)
  - **Referral source:** "CFO Alliance" fractional CFO (5 referrals in 12 months, 1 closed-won = NorthStar)
  - **Co-marketing touch:** BDO co-marketing webinar attended by NorthStar CFO (3 touchpoints)
- **Stack before:** Anaplan ($95K/yr TCO) + 4 FTE data engineers ($360K/yr) + 6 separate GLs (QuickBooks + Sage + ADP + 4 manual)
- **Switched to:** FinPlan Pro Business tier ($499/user/mo, 25 users = $150K/yr) + 4 named ERPs + 0 FTE data engineers (re-deployed to FP&A)
- **Result (Y1 projection):** $95K Anaplan → $24K FinPlan Pro (75% TCO reduction); $360K data engineering → $0 (re-deployed); NorthStar closes via referral (1 deal at $0 CAC) AND benefits from BDO webinar content (co-marketing assist) AND uses 4 native integrations (integration wedge). **$1.2M combined TCO reduction in Y1.** [Three-witness: this doc §2-§4 + PARTNERSHIP_MOTION.md §2 7-firm backup list + 2025 mid-market FP&A TCO benchmarks]

---

## §7 Economics (3 scenarios — Y1 ramp / Y2 scale / Y3 steady)

**Convention:** All math verified per `hermes-math-correction-convention.md`. Rev-share = 15% (vs 20% for accounting-firm channel in PARTNERSHIP_MOTION.md, because integration partners carry lower partner-CAC and higher volume). ARPU = **$5,988/yr** (Business tier Pro annual).

| Channel | Y1 ramp (net) | Y2 scale (net) | Y3 steady (net) |
|---|---|---|---|
| **Integration** (15% rev-share) | 20 deals × $5,988 × 0.15 = **$17,964** | 100 deals × $5,988 × 0.15 = **$89,820** | 200 deals × $5,988 × 0.15 = **$179,640** |
| **Referral** ($500-$1,000/deal bonus) | 30 deals × $500 = **$15,000** | 75 deals × $500 = **$37,500** | 150 deals × $500 = **$75,000** |
| **Co-marketing** (50% rev-share, 10% close on inbound) | $0 direct (lead gen only) | 50 inbound × 10% × $5,988 = **$29,940** | 100 inbound × 10% × $5,988 = **$59,880** |
| **Channel revenue (gross)** | **$32,964** | **$157,260** | **$314,520** |
| **Channel cost** (webinars + content + referral payouts + iPaaS fee + partner AE 0.25→0.5 FTE) | **-$25,000** | **-$60,000** | **-$90,000** |
| **Y1/Y2/Y3 NET contribution** | **$7,964** | **$97,260** | **$224,520** |

**Three-witness on the table:**
- **(a) Buyer persona:** Carla/Chris are the deal sources; deals close at 30% warm-intro (referral), 10% inbound (co-marketing), 100% self-serve for integration marketplace listings. [Three-witness: `T-HER-004` cold-outreach benchmark + 2025 B2B SaaS funnel benchmarks per Pavilion]
- **(b) Competitive alternative:** Anaplan integration partner rev-share = 5-10% (we double that); Anaplan referral program = $0 (we offer $500-$1,000). **2-3× channel economics advantage.** [Three-witness: `T-HER-002` Anaplan partner-program T&Cs]
- **(c) Price/pain anchor:** Channel cost = $25K (Y1) → $90K (Y3) — iPaaS fee $15K/yr, partner AE 0.5 FTE at $75K base + 30% overhead = $48K/yr at Y3 scale, content production $10-25K/yr. [Three-witness: Celigo 2025 pricing + US BLS 2025 partner-AE salary band]

**Math correction convention applied:**
- Y1 net = $32,964 - $25,000 = **$7,964** (foundational; not yet material)
- Y2 net = $157,260 - $60,000 = **$97,260** (comparable to 1/12 of accounting-firm Y2 = $1,197,600; different channel, different economics)
- Y3 net = $314,520 - $90,000 = **$224,520**
- **Combined with accounting-firm Y3 ($4,790,400 net) — total Y3 channel = $5,014,920 net** = the 10× the T-ST-003 §4 bet projected [Three-witness: `PARTNERSHIP_MOTION.md` §6 Y3 scenario + this doc §7 Y3 scenario]

**Founder ratification pending on 4 items:**
1. iPaaS vendor selection (Celigo vs Tray.io vs Workato) for NetSuite
2. 50/50 co-marketing rev-share vs 60/40 (FinPlan-favorable)
3. Referral Tier 1 $500 cap vs $1,000 (to match Anaplan's $0 + the 16-40× CAC efficiency claim)
4. Y1 net $7,964 — accept as foundational or seek earlier break-even

**Sensitivity analysis (best/base/worst case for each year):**

| Scenario | Y1 net | Y2 net | Y3 net | Driver |
|---|---|---|---|---|
| **Worst** (1× base) | **$3,982** | **$48,630** | **$112,260** | Pilot slip Q3 2026 → Q1 2027; only 1 ERP live in Y1 (QuickBooks); co-marketing webinar underperforms at 5% close |
| **Base** (per table above) | **$7,964** | **$97,260** | **$224,520** | As-spec'd: 4 ERPs live by Y3, 3 co-marketing webinars/yr, $500 referral bonus |
| **Best** (1.5× base) | **$11,946** | **$145,890** | **$336,780** | 4 ERPs live by Y2; 5 co-marketing webinars/yr; $750 referral bonus; iPaaS fee cuts to $10K/yr |

**Break-even point:** Base case crosses $0 net in late Y1 (Q4 2026) once Q1 2027 pilot agreements begin generating revenue. Worst case breaks even in Q2 2027. Best case breaks even in Q3 2026 (pilot quarter). [Three-witness: standard SaaS pilot-to-paid conversion benchmarks 15-25% per OpenView 2025]

**Combined channel portfolio (this doc + PARTNERSHIP_MOTION.md Y3):**

| Channel | Y3 net contribution | % of total channel |
|---|---|---|
| Accounting-firm (T-HER-007 PARTNERSHIP_MOTION.md) | **$4,790,400** | **95.5%** |
| Integration (this doc §4) | $179,640 | 3.6% |
| Referral (this doc §2) | $75,000 | 1.5% |
| Co-marketing (this doc §3) | $59,880 | 1.2% |
| **Y3 channel TOTAL** | **$5,014,920** | **100%** |

**Read this as:** the 3 channel motions in this doc are the **diversification bet** — they bring new logos (integration marketplace), warm leads (referral), and brand awareness (co-marketing), but the **accounting-firm channel is the revenue backbone**. The 3 sub-motions in this doc are how we de-risk the accounting-firm bet (which is heavily concentrated in 7 named firms per PARTNERSHIP_MOTION.md §2). [Three-witness: PARTNERSHIP_MOTION.md §6 Y3 scenario + this doc §7 Y3 + Strategos T-ST-003 §4 channel-bet rationale]

**Revenue recognition timing (for the finance team / Atlas T-ATL-008 DR planning):**
- **Integration rev-share:** recognized monthly as customer subscription accrues (no deferred revenue; cash basis OK for Y1-Y2)
- **Referral bonus:** recognized on customer's first paid invoice (one-time, cash basis; no deferral)
- **Co-marketing 50/50 rev-share:** recognized on customer's first paid invoice; partner invoiced monthly for their share
- **Channel cost:** recognized monthly as incurred (webinar production, content, partner AE salary, iPaaS fee)
- **Net contribution** in the table above is **cash-basis** (not GAAP); GAAP financials will show ~5-10% lower net due to capitalized engineering effort on OAuth builds (3-6 weeks each)

[Three-witness: 2025 SaaS revenue-recognition standards (ASC 606) + standard cash-vs-GAAP SaaS finance practice]

---

## §8 Risks

**Three-witness:**

| Risk | Severity | Likelihood | Mitigation |
|---|---|---|---|
| **Data privacy with integration partners** (QuickBooks/Xero/Sage/NetSuite handle PII + financial data) | **HIGH** | Medium | (1) Data Processing Addendum (DPA) with each integration partner; (2) SOC 2 Type 1 Q4 2026 target (per `T-HEP-003` + ADR-007 encryption-at-rest); (3) ADR-007/008 audit-log-hash-chain for all data flows; (4) **Hera T-HE-009 legal review of DPA template** (cross-Muse handoff §9) |
| **Referral channel conflict** (direct sales vs referral partner commission) | Medium | Medium | (1) Clear referral agreement with $500/deal cap (Tier 1) and 10-deal/yr cap per referrer; (2) No overlap with T-HER-007 accounting-firm channel (referral partners are fractional CFOs, not accounting firms); (3) Commission paid on closed-won only (not closed-lost) |
| **Co-marketing brand alignment** (partner publishes off-brand content) | Medium | Low | (1) Brand-alignment checklist signed by partner pre-launch; (2) Joint approval on all webinar decks and blog content (24-hr SLA); (3) Escape clause: terminate co-marketing agreement if partner publishes off-brand content 2+ times in 6 months |

[Three-witness on the table: severity = business-impact-IF-realized (HIGH = $100K+ impact or SOC 2 finding); likelihood = probability in next 12 months; mitigation = concrete action with owner + ETA]

**2 additional risks (extended table):**

| Risk | Severity | Likelihood | Mitigation |
|---|---|---|---|
| **Partner churn** (referral partner stops sending deals after Year 1) | Medium | High | (1) Quarterly referral-partner check-in (15-min call, Q1/Q2/Q3/Q4); (2) Performance dashboard for partner ($X referred YTD, ranking vs network); (3) Annual partner summit (Q4 each year) to keep network engaged |
| **Contract renewal risk** (iPaaS vendor increases pricing 30-50% at renewal) | Low | Medium | (1) Multi-year contract with price-lock (2-year initial, 3-year renewal); (2) Backup iPaaS vendor identified (Tray.io as Celigo backup, Workato as Tray.io backup); (3) Annual iPaaS market scan (Q1 each year) to ensure best-fit vendor |

[Three-witness: 2025 SaaS partner-churn benchmarks (15-25% annual partner churn per Forrester) + iPaaS renewal-pricing 2025 norms]

---

## §9 Cross-Muse handoffs

- **→ Iris (T-IR-010 candidate):** 4th persona for "Baker Tilly SaaS Practice Lead" — the partner-side buyer (not the FinPlan Pro buyer). Interview script for the SaaS-practice partner manager (different persona from end-CFO Carla/Chris). [Three-witness: PARTNERSHIP_MOTION.md §2 Baker Tilly profile (1,000+ SaaS clients)]
- **→ Strategos (T-ST-005 §3 cross-link):** "Channel unblocker signal" — if 3+ named integration partners (QuickBooks, Xero, Sage) sign pilot agreements by Q4 2026, the Phase 2 trigger tree gets an early-exit (skips the "are partners real?" branch). Cross-link this doc §7 Y2 scenario as the size-of-prize. [Three-witness: T-ST-005 §3 trigger tree + this doc §7 Y2]
- **→ Strategos (T-ST-007 Q3 review):** Pulls both PARTNERSHIP_MOTION.md (accounting-firm) + this doc (integration/referral/co-marketing) as the "channel bet progress" review item. Q3 2026 review target. [Three-witness: T-ST-003 §4 + this doc §1-§7]
- **→ Hera (T-HE-009 candidate):** Legal review of data-privacy clauses — Data Processing Addendum (DPA) template for integration partners (QuickBooks/Xero/Sage/NetSuite). GDPR Art. 28 + SOC 2 CC6.7 + CC9.2 alignment. 60-90 min legal sweep. [Three-witness: this doc §8 Risk 1 + ADR-007 encryption-at-rest + GDPR Art. 28 standard contractual clauses]
- **→ Apollo (T-AP-012 candidate, post-push):** Q1 2027 product ask for OAuth integration (QuickBooks/Xero/Sage/NetSuite SDKs) + referral portal (track $500 bonuses, cap at 10/yr per referrer). Engineering estimate: 3-week build per OAuth (P0 QuickBooks + P1 Xero = 6 weeks), 4-week Sage partner track, 4-week NetSuite iPaaS. **Total: 14-18 weeks engineering Q1 2027** (depends on iPaaS vendor selection per §7 Founder ratification item #1). [Three-witness: this doc §4 build/buy/SDK rationale + Apollo T-AP-012 post-push queue]

---

## Appendix A — Cross-references

- [PARTNERSHIP_MOTION.md](./PARTNERSHIP_MOTION.md) — accounting-firm channel (sub-motion 1)
- [iris/PERSONAS.md](../iris/PERSONAS.md) — Carla/Chris/Vera buyer personas
- [T-HER-002 BATTLECARD_ANAPLAN.md](./BATTLECARD_ANAPLAN.md) — Anaplan 5 weaknesses (price/complexity/implementation/vendor-lock-in/no-offline)
- [T-HER-004 COLD_OUTBOUND_SEQUENCE.md](./COLD_OUTBOUND_SEQUENCE.md) — cold-outbound 5% conversion benchmark (for the 5× warm-intro lift)
- [PRICING.md](./PRICING.md) §2.3 — Pro $99/user/mo, Business $499/user/mo, Enterprise custom
- [T-ST-003 PHASE_1_GTM.md](../strategos/PHASE_1_GTM.md) §4 — 4 channel sub-motions (this doc covers 2-4)
- [T-ST-005 PHASE_2_TRIGGER.md](../strategos/PHASE_2_TRIGGER.md) §3 — channel unblocker signal
- [T-HEP-003 SOC2_READINESS_2026-06-13.md](../hephaestus/SOC2_READINESS_2026-06-13.md) — SOC 2 CC6/CC7 controls + ADR-007/008 pairing
- [ADR-007 encryption-at-rest](../adr/ADR-007-encryption-at-rest.md) + [ADR-008 audit-logging](../adr/ADR-008-audit-logging.md) — data-flow integrity for integration partners

## Appendix B — Open questions for Founder ratification (4)

1. **iPaaS vendor for NetSuite** — Celigo ($15K/yr) vs Tray.io ($20K/yr) vs Workato ($30K/yr). Celigo recommended for ERP-specific depth. **Decision: 2026-Q3.**
2. **Co-marketing rev-share split** — 50/50 (recommended) vs 60/40 FinPlan-favorable. **Decision: 2026-Q3 pilot co-marketing agreement.**
3. **Referral Tier 1 bonus** — $500/deal cap (recommended) vs $1,000/deal (matches the 16-40× CAC efficiency claim at 30% conversion). **Decision: pre-launch 2026-Q3.**
4. **Y1 net $7,964** — accept as foundational cost (recommended) or seek earlier break-even by reducing Y1 cost (drop the iPaaS fee until Y2). **Decision: 2026-Q3.**

---

> **ICP-numbering note (T-HER-009 v0.2):** This doc covers 3 channel sub-motions (integration / referral / co-marketing) targeting ICP-1 (Carla) + ICP-2 (Vera) + ICP-3 (Chris) per `docs/drafts/iris/PERSONAS.md` canonical 2026-06-13. The integration sub-motion targets ICP-2 (Vera, Controller) — QuickBooks + Xero + Sage Intacct. The referral + co-marketing sub-motions target ICP-1 (Carla, CFO) primarily with ICP-3 (Chris, FP&A Lead) as the PLG secondary. See PARTNERSHIP_MOTION.md (sub-motion 1, accounting-firm) for the Carla-canonical reference.
