# Data Integrity Architecture

## Overview

FinPlan Pro guarantees transactional integrity and zero data loss across storage, backup, and restore pipelines.

## Key Mechanisms

- **ACID Transactions**: SQLite transactions ensure atomic writes for multi-table updates (e.g., GL postings, journal imports, budget cascading).
- **Checksum Verification**: Backup and restore archives (KAV-12 format) undergo cryptographic verification and round-trip integrity checks.
- **Audit Trails**: Field-level data changes are logged with immutable transaction IDs and user attributions.
