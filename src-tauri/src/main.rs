//! OmniPlan (finplan-pro) Windows shell entry point.
//!
//! F-0020 (updater policy, relocated from a `_updater_comment` field that
//! `tauri-build` rejects): the updater is DISABLED. updates.finplanpro.com is
//! not controlled infrastructure, so an active updater would poll a
//! dead/uncontrolled domain. Re-enable only with controlled update
//! infrastructure (endpoints + signing key + tests);
//! scripts/check-version-consistency.mjs blocks unverified re-enablement.
//! Tauri v2 semantics: a removed legacy v1-style `updater` block plus NO
//! `plugins.updater` entry IS the disabled state; re-enabling means adding
//! the tauri-plugin-updater crate + config + signing keys together.

#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use tauri::menu::{MenuBuilder, MenuItemBuilder, SubmenuBuilder};
use tauri::Emitter;

// W6-P0-07 (2026-08-24): every menu item MUST have a real frontend binding in
// src/hooks/useTauriMenu.ts (`createMenuCommands`). Items without an honest
// global binding were REMOVED rather than left decorative: the previous
// Save/Export entries had no app-wide action behind them (export/save helpers
// are consumer-scoped hooks requiring per-grid state). The surviving id list
// mirrors TAURI_MENU_EVENT_IDS in src/config/tauriMenuEvents.ts — the test
// module below enforces the two-sided sync via include_str!.
fn build_menu(app: &tauri::App) -> Result<(), Box<dyn std::error::Error>> {
    let handle = app.handle();

    // File
    let import_data = MenuItemBuilder::with_id("open_file", "Import Data")
        .accelerator("CmdOrCtrl+O")
        .build(handle)?;

    let file_menu = SubmenuBuilder::new(handle, "File")
        .item(&import_data)
        .build()?;

    // View
    let dashboards = MenuItemBuilder::with_id("industry_dashboards", "Industry Dashboards").build(handle)?;
    let view_menu = SubmenuBuilder::new(handle, "View")
        .item(&dashboards)
        .build()?;

    // Tools
    let benchmarks = MenuItemBuilder::with_id("benchmarks", "Benchmarks").build(handle)?;
    let debug = MenuItemBuilder::with_id("debug", "Debug").build(handle)?;
    let tools_menu = SubmenuBuilder::new(handle, "Tools")
        .item(&benchmarks)
        .item(&debug)
        .build()?;

    let menu = MenuBuilder::new(handle)
        .item(&file_menu)
        .item(&view_menu)
        .item(&tools_menu)
        .build()?;

    app.set_menu(menu)?;
    Ok(())
}

fn main() {
    let builder = tauri::Builder::default()
        .setup(|app| {
            // F-DESK-012: install the local-only panic reporter first so any
            // later setup/event-loop panic still leaves a crash log on disk.
            finplan_pro_lib::crash_reporter::init();
            build_menu(app).expect("Failed to build menu");
            Ok(())
        })
        .on_menu_event(|app, event| {
            let id = event.id().as_ref();
            let _ = app.emit("menu-event", id);
        });
        
    finplan_pro_lib::run_with_builder(builder);
}

#[cfg(test)]
mod menu_binding_tests {
    use super::*;

    /// Mirror of TAURI_MENU_EVENT_IDS in src/config/tauriMenuEvents.ts.
    const EXPECTED_MENU_IDS: [&str; 4] = [
        "open_file",
        "industry_dashboards",
        "benchmarks",
        "debug",
    ];

    /// Decorative items removed by W6-P0-07 must never reappear on either side.
    /// Assembled from fragments at runtime so this very file cannot contain the
    /// full marker string and defeat its own assertion.
    fn retired_marker(retired: &str) -> String {
        format!("{retired}_item_retired_w6p007")
    }

    /// Construction half of this file only — the #[cfg(test)] module below
    /// legitimately repeats the scanned needles as string literals, so
    /// self-scans must stop at the module boundary.
    fn construction_source() -> &'static str {
        include_str!("main.rs")
            .split("#[cfg(test)]")
            .next()
            .expect("cfg(test) module delimiter present")
    }

    #[test]
    fn every_expected_id_appears_in_shared_ts_manifest() {
        let ts_manifest = include_str!("../../src/config/tauriMenuEvents.ts");
        for id in EXPECTED_MENU_IDS {
            let needle = format!("'{id}'");
            assert!(
                ts_manifest.contains(&needle),
                "shared TS manifest is missing native menu id '{id}'"
            );
        }
    }

    #[test]
    fn shared_ts_manifest_declares_nothing_beyond_the_expected_ids() {
        let ts_manifest = include_str!("../../src/config/tauriMenuEvents.ts");
        for id in EXPECTED_MENU_IDS {
            let needle = format!("'{id}'");
            let occurrences = ts_manifest.matches(&needle).count();
            assert_eq!(
                occurrences, 1,
                "native menu id '{id}' must appear exactly once in the TS manifest"
            );
        }
        // Every single-quoted literal inside the id array block must be one of
        // the expected ids (guards against additions without a Rust twin).
        let array_body = ts_manifest
            .split("TAURI_MENU_EVENT_IDS = [")
            .nth(1)
            .and_then(|rest| rest.split("] as const").next())
            .expect("TAURI_MENU_EVENT_IDS array shape changed");
        for literal in array_body.split('\'').skip(1).step_by(2) {
            // split('\'') yields: [pre, id1, mid1, id2, ...]; skip(1).step_by(2)
            // walks the odd segments, which are exactly the quoted literals.
            assert!(
                EXPECTED_MENU_IDS.contains(&literal.trim()),
                "TS manifest declares unbound menu id '{}'",
                literal.trim()
            );
        }
    }

    #[test]
    fn menu_source_constructs_exactly_the_expected_items_and_emits_each_id() {
        let rust_source = construction_source();
        for id in EXPECTED_MENU_IDS {
            let needle = format!("MenuItemBuilder::with_id(\"{id}\"");
            assert!(
                rust_source.contains(&needle),
                "menu construction missing item '{id}'"
            );
        }
        let constructed = rust_source.matches("MenuItemBuilder::with_id(").count();
        assert_eq!(
            constructed,
            EXPECTED_MENU_IDS.len(),
            "unexpected extra menu items without frontend bindings"
        );
        assert!(
            rust_source.contains("app.emit(\"menu-event\""),
            "on_menu_event must forward item ids as menu-event payloads"
        );
    }

    #[test]
    fn removed_decorative_items_stay_removed_from_both_sides() {
        let ts_manifest = include_str!("../../src/config/tauriMenuEvents.ts");
        // Marker tokens stand in for the retired Save/Export ids so this very
        // assertion cannot be defeated by comments mentioning them.
        for retired in ["save", "export"] {
            let marker = retired_marker(retired);
            assert!(!ts_manifest.contains(&marker));
            assert!(!construction_source().contains(&marker));
        }
        // The retired accelerator-only Save path must not come back silently:
        // no with_id may carry an id absent from EXPECTED_MENU_IDS.
        for line in construction_source().lines() {
            if let Some(start) = line.find("with_id(\"") {
                let rest = &line[start + "with_id(\"".len()..];
                let id = rest.split('"').next().expect("quoted id");
                assert!(
                    EXPECTED_MENU_IDS.contains(&id),
                    "menu item '{id}' has no entry in EXPECTED_MENU_IDS"
                );
            }
        }
    }
}
