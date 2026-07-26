# S66 — Architecture

**Date:** 2026-07-25

## 1. Context
Board pack.

## 2. Components
- `src/pages/reports/BoardPackPage.tsx`, S61 PDF.

## 3. Data Model
- `BoardPack { sections: SectionType[] }`.

## 4. Interfaces
- `generateBoardPack(pack)`.

## 5. Integration
- Uses S56–S58, S61, S65; templates S60.

## 6. Testing
- Generate + template round-trip.
