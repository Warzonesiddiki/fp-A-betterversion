# S60 — Architecture

**Date:** 2026-07-25

## 1. Context
Report templates.

## 2. Components
- `src/pages/reports/ReportTemplateLibraryPage.tsx`, `src/templates/report/*`.

## 3. Data Model
- `ReportTemplate { id, name, layout }`.

## 4. Interfaces
- `useTemplate(id)` → S59 layout.

## 5. Integration
- Uses S59; feeds board pack S66.

## 6. Testing
- Use-template round-trip.
