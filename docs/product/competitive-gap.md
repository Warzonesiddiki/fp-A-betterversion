# Competitive Gap Analysis

**Status:** outline only, rechecked 2026-11-11. This is **not** a completed
competitive analysis. No competitor product was inspected for this page, so no
comparative claim below is evidenced and none may be used in product, sales or
board material.

## Overview

The intended differentiation for FinPlan Pro is a local-first, evidence-rigorous
FP&A workspace that carries a finance team from a general-ledger export to
reviewed output without fabricated numbers. Whether that differentiates the
product against any specific competitor is **UNVERIFIED**: this page contains no
named competitor, no feature matrix, no pricing, and no source inspection.

The earlier text in this file ("outclasses legacy FP&A platforms", "enterprise
scale", "real-time collaboration") was marketing language attached to controls
that either do not exist as described or remain open. It has been removed rather
than softened, because an unsupported superiority claim is a fabrication risk
under the project's anti-fabrication rules.

## What can be stated from repository evidence

- **Exact money arithmetic.** Monetary values route through `src/utils/money.ts`
  (decimal.js) and the adoption ratchet holds at 320 modules with 0 raw
  `toFixed` sites (`npm run money:adoption`, 2026-11-11). This is an internal
  engineering fact, not a competitive advantage over a named product.
- **Fabrication controls.** A fabrication detector and an AI census
  (0 ungated narrative surfaces) run as gates. These constrain this product's
  claims; they do not measure a competitor.
- **Honest gaps that undercut any "zero-compromise" framing.** Coverage is below
  the configured 50% threshold, the production dependency audit is red (2 high in
  the root workspace, 2 high in the server workspace), the client audit chain is
  unkeyed, client RBAC is bypassable, backup exports are unencrypted, the
  universal importer is not fully converged, and no real owner data or
  accounts-team acceptance run has been performed.

## Required before this document can make a comparative claim

1. Name the competitors and the compared product editions and deployment models.
2. Cite inspected sources for every compared capability, with inspection dates.
3. Separate demonstrated capability from roadmap intent, and label the latter as
   intent.
4. Obtain owner sign-off that any comparative statement is accurate and
   supportable.
