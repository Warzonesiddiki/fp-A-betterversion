# S47 — Research

**Date:** 2026-07-25

## 1. Questions
- Seasonality support?

## 2. Findings
- `ForecastMethodEngine` likely has seasonal logic.
- Tasklist 2.2.1 seasonality presets.

## 3. Decision
- Implement presets + custom; normalize to 12-month sum=1.

## 4. Risks
- Non-12-period calendars.

## 5. Dependencies
- S32, S76 (sector presets).
