# SOX Controls

## Overview

FinPlan Pro implements Sarbanes-Oxley (SOX) compliance controls for financial reporting systems.

## Controls

- **Financial Statement Articulation**: Automated verification that P&L net income articulates to Retained Earnings and Cash Flow ending cash matches Balance Sheet cash (KAV-09).
- **Accounting Equation Invariant**: Continuous invariant checks guaranteeing Assets − Liabilities − Equity == 0 (KAV-10).
- **Period Close & Locking**: SOX period-lock enforcement preventing unauthorized post-close mutations.
- **Audit Logging**: 7-year retention capability and immutable hash-chained audit trails.
