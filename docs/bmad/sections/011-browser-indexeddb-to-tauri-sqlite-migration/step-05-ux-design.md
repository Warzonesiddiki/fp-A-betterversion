# Step 05 — UX Design: Browser IndexedDB to Tauri SQLite Migration

**Section:** 011

## 1. Current State (Pain Points)

- `BackupRestorePage.tsx` hardcodes:  
  `Storage Mode: Local (IndexedDB)`
- No indication that migration is available or has occurred.
- No visual difference between browser and desktop modes.
- No feedback when running in desktop.

## 2. Target Experience

### 2.1 Storage Status Card (BackupRestorePage)

Replace the static card with dynamic content:

**Browser Mode:**
- Icon: Globe / Monitor
- Label: "Storage Mode: Browser (sql.js)"
- Subtext: "Data stored locally in your browser"
- Migration status: "Desktop migration available when using Tauri app"

**Desktop (Tauri) Mode — Not Migrated:**
- Icon: HardDrive
- Label: "Storage Mode: Desktop (Tauri SQLite)"
- Subtext: "Native desktop storage ready"
- Banner / Button: "Migrate data from browser" (if legacy detected)
- Status: "Migration pending"

**Desktop (Tauri) Mode — Migrated:**
- Label: "Storage Mode: Desktop (Tauri SQLite)"
- Status pill: "Migrated ✓"
- Last migrated: date
- "Re-run migration" (advanced / hidden)

### 2.2 First Desktop Launch Behavior

- Non-blocking toast (bottom-right, 6s):
  > "Migrating your browser data to desktop storage..."
- On success:
  > "Migration complete. All your data is now in Tauri SQLite."
- On failure:
  > "Migration encountered an issue. Your browser data is safe. Try again from Settings."

### 2.3 Manual Trigger

- Button in the Storage section of BackupRestorePage:
  - "Migrate from Browser" (only visible when `isTauri() && hasLegacy`)
  - Disabled while migrating
  - Loading state with spinner

### 2.4 Accessibility

- All new elements have proper `aria-*`
- Status changes announced via live region
- Keyboard accessible CTA

## 3. Wireframe Summary (Text)

```
[ Storage Mode Card ]
HardDrive   Desktop (Tauri SQLite)
            Status: Migrated on 2026-07-26
            [ View Migration Log ] (future)

[ Integrity Check ] [ Export Backup ] [ Import Backup ]

[ Danger Zone ]
```

## 4. Interaction States

1. Idle (browser) → no CTA
2. Idle (desktop, legacy present) → CTA visible
3. Migrating → CTA disabled + progress text
4. Success → toast + card update + CTA disappears or becomes "Re-migrate"
5. Error → error banner + retry CTA

## 5. Copy Guidelines

- Use "Desktop (Tauri SQLite)" not "Native DB"
- "Your browser data has been safely migrated"
- Never promise "all data" without verification

## 6. Visual Language

- Reuse existing Card, Button, icons from lucide-react
- Green success states consistent with integrity check
- Amber for "pending migration"

## 7. Edge Cases Handled in UX

- User runs migration twice → idempotent, shows already done
- User has no legacy data on desktop → no CTA
- Migration fails → keep "Migrate" button visible
- Very large data → show "This may take a moment" (no exact ETA yet)

## 8. Future Enhancements (Out of Scope)

- Migration progress bar
- Detailed migration log modal
- "Export legacy data before migrating" link

This UX design is sufficient for implementation in this section.
