# Agent 3 (Integrator): Remaining Tasks

## YOUR FILES ONLY
- `src/utils/` — VERIFY (indexedDBStorage, retry.ts, dataMigration.ts)
- `src-tauri/` — VERIFY (Cargo.toml, src/main.rs, tauri.conf.json)
- `reports/agent3-complete.md` — CREATE

## DO NOT TOUCH
`src/App.tsx`, `src/store/`, `src/pages/` (all), `src/components/ui/`, `src/components/analytics/`

---

## AUDIT FINDING: Phase 2 (Persistence) — ✅ VERIFIED
- `src/utils/indexedDBStorage.ts` — EXISTS
- `src/hooks/usePersistence.ts` — EXISTS  
- `src/hooks/useIndexedDB.ts` — EXISTS
- `src/utils/retry.ts` — EXISTS (added by A5 with withRetry function)
- `src/utils/dataMigration.ts` — EXISTS

## AUDIT FINDING: Phase 4 (Import Pipeline) — ✅ VERIFIED
- `src/components/data/FileUploader.tsx` — EXISTS
- `src/components/data/GLColumnMapper.tsx` — EXISTS
- `src/components/data/GLDataPreview.tsx` — EXISTS
- `src/components/data/GLDropZone.tsx` — EXISTS
- `src/components/data/GLTrialBalanceGrid.tsx` — EXISTS

## AUDIT FINDING: Phase 12 (Customization) — ❌ NOT STARTED
No evidence of customization work. Since the app is feature-complete, this phase is now:
### Task: Create settings persistence profile system
1. Verify that app settings (currency, fiscal year, sector) persist across page reloads
2. Check `useSettingsStore` has Zustand persist middleware configured with the indexedDB storage adapter
3. If not, add persist middleware:
```typescript
import { persist } from 'zustand/middleware';
import { indexedDBStorage } from '@/utils/indexedDBStorage';

export const useSettingsStore = create(
  persist(settingsStoreDefinition, {
    name: 'finplan-settings',
    storage: indexedDBStorage,
  })
);
```
4. Test: Change setting → reload page → setting persists

## AUDIT FINDING: Phase 16 (Tauri) — ✅ VERIFIED
- `src-tauri/Cargo.toml` — EXISTS  
- `src-tauri/src/main.rs` — EXISTS
- `src-tauri/tauri.conf.json` — should exist, verify it has correct window config

## Phase 17: NSIS Installer (1 hr)
### Create src-tauri/installer/ directory with NSIS config
1. Create `src-tauri/installer/installer.nsi` with:
   - App name: "FinPlan Pro"
   - Publisher: Self-signed
   - Output: `FinPlanPro-Setup.exe`
   - Install dir: `$PROGRAMFILES\FinPlanPro`
   - Start menu shortcut
   - Desktop shortcut (optional)
   - Uninstaller

2. Verify Tauri build command works:
```
npm run tauri build
```
This should produce an MSI installer in `src-tauri/target/release/bundle/msi/`

3. If Rust toolchain is missing, report: "Need: winget install Rust.Rustup"

## Quality Gate
`npm run build` passes. Settings persist across reloads. Tauri builds successfully.
Write `reports/agent3-complete.md`.
