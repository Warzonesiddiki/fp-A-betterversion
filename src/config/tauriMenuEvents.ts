// =============================================================================
// Tauri native menu event manifest — single source of truth for menu item ids
// =============================================================================
//
// W6-P0-07 (2026-08-24): the native File/View/Tools menu shipped inert
// end-to-end because the Rust menu ids and the frontend handler surface had
// no enforced contract. This module IS that contract:
//
//   - src-tauri/src/main.rs constructs one MenuItemBuilder::with_id(...) per
//     entry below and forwards every click via `emit("menu-event", id)`.
//   - src/hooks/useTauriMenu.ts keys its command map off this union, so a new
//     Rust item cannot compile on the frontend side without an action, and an
//     unbound id fails useTauriMenu.test.ts exhaustiveness checks.
//   - A #[cfg(test)] module in main.rs re-reads this very file via
//     include_str! and asserts the two sides stay in sync at `cargo test`.
//
// Every id must map to a REAL action (router navigation / store action /
// window operation). An item that cannot be bound honestly is removed from
// BOTH this list and the Rust menu rather than staying decorative.

export const TAURI_MENU_EVENT_IDS = [
  'open_file', // File > Import Data -> /data (DataImportPage)
  'industry_dashboards', // View > Industry Dashboards -> /sector/sector
  'benchmarks', // Tools > Benchmarks -> /admin/benchmarks
  'debug', // Tools > Debug -> /admin/debug
] as const;

export type TauriMenuEventId = (typeof TAURI_MENU_EVENT_IDS)[number];
