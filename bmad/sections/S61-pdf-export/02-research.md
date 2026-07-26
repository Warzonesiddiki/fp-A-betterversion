# S61 — Research

**Date:** 2026-07-25

## 1. Questions
- PDF export status?

## 2. Findings
- `jspdf` is a dependency. Export service likely exists.
- Tasklist 2.3.1/2.3.4 mention PDF export with headers/formatting.

## 3. Decision
- Build `exportPDF` service; headers/footers/page numbers; used by reports.

## 4. Risks
- Large tables paginate; charts embed as images.

## 5. Dependencies
- S56–S60, S66.
