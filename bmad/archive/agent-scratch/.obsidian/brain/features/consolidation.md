---
date: 2026-05-19
type: feature-doc
project: FinPlan Pro
tags: [finplan-pro, consolidation, accounting, asc-810]
status: complete
---

# Consolidation Engine

## Overview
966 lines. ASC 810 compliant multi-entity consolidation with intercompany eliminations, currency translation, minority interest, and goodwill.

## Key Features

### 1. Intercompany Elimination
- Manual IC pair matching
- Auto-detect IC accounts (prefix '9')
- Types: receivable, payable, revenue, expense, investment, dividend, loan
- Matched amount = min(|from|, |to|)

### 2. Currency Translation (ASC 830)
- Assets/Liabilities: closing rate (spot)
- Revenue/Expenses: average rate
- Equity: historical rate
- FX gain/loss to OCI

### 3. Minority Interest (ASC 810)
- Net income method: minority % × (net income - dividends)
- Per-subsidiary detail tracking
- Beginning balance + net income - dividends = ending balance

### 4. Goodwill (ASC 805)
- Goodwill = acquisition cost - (book value × ownership %) - fair value adjustments
- 10-year amortization schedule (for impairment testing)
- Pushed to account 1800 as asset

### 5. VIE Consolidation (ASC 810-10)
- Primary beneficiary fully consolidates VIE
- Investment elimination entries

### 6. Balance Verification
- Assets + Liabilities + Equity + Minority Interest = 0
- Tolerance: $0.01

## Currency Translation
Uses [[fx-engine]] for ASC 830 currency translation (closing, average, historical rates).

## Consolidation Methods
- `full` — 100% elimination, minority interest calculated
- `equity` — Equity method (investment account adjusted)
- `cost` — Cost method (dividends recognized as income)

## Data Types
- `EntityData` — GL entries, currency, VIE/foreign flags
- `OwnershipStructure` — Parent/child, %, method, acquisition data
- `ICPair` — Intercompany transaction pairs
- `ConsolidationWorksheet` — Full transparency worksheet
- `ConsolidatedResult` — Final output with all details
