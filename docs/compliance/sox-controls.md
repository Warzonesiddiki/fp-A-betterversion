# SOX Controls

> **Supersession notice (2026-11-05):** Owner decision DEC-102 states that FinPlan Pro is **not a SOX compliance system** and the local audit chain is client evidence, not SOX authority (`docs/discovery/decision-log.md:165`; `docs/security/SECURITY.md:7-10`). The implementation claim below is superseded; retain this page as historical context, not as a current product claim. The server audit service has a default 2,555-day retention configuration and an HMAC checksum method (`server/src/services/AuditService.ts:224-232, 1154-1160`), but those scoped facts do not establish SOX compliance. Its source comment still uses SOX wording; no application-source file was changed under the docs-first gate. No independent SOX audit, legal assessment, or deployed retention verification was performed.

## Overview

FinPlan Pro implements Sarbanes-Oxley (SOX) compliance controls for financial reporting systems.

## Controls

- **Financial Statement Articulation**: Automated verification that P&L net income articulates to Retained Earnings and Cash Flow ending cash matches Balance Sheet cash (KAV-09).
- **Accounting Equation Invariant**: Continuous invariant checks guaranteeing Assets − Liabilities − Equity == 0 (KAV-10).
- **Period Close & Locking**: SOX period-lock enforcement preventing unauthorized post-close mutations.
- **Audit Logging**: 7-year retention capability and immutable hash-chained audit trails.
