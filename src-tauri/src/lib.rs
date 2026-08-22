use tauri_plugin_sql::{Migration, MigrationKind};

// Orphan-module wiring (wave-3 lane R20 disposition, 2026-08-23): these two
// files were previously declared by NO module and compiled by nobody.
// Registered per BLUEPRINT §23 P0 features:
//   - F-DESK-006 (OS credential storage) -> secure_storage.rs
//   - F-DESK-012 (local crash reporting) -> crash_reporter.rs (pub: main.rs
//     installs it from the setup hook)
pub mod crash_reporter;
mod secure_storage;

// Commands live in an inner module: rustc ≥1.98 unifies macro-namespace
// items (`__cmd__*`) with same-named fns in one scope (E0255), so a bare
// #[tauri::command] at crate root no longer compiles against tauri-macros.
// The module boundary gives the generated macros their own scope.
// secure_storage.rs keeps its #[tauri::command] fns inside its own
// file-module for the same reason.
mod commands {
    use serde_json::Value;

    /// Keep in sync with package.json / tauri.conf.json / Cargo.toml —
    /// enforced by scripts/check-version-consistency.mjs (F-0033).
    #[tauri::command]
    pub fn get_app_info() -> Value {
        serde_json::json!({ "name": "FinPlan Pro", "version": env!("CARGO_PKG_VERSION") })
    }
}

pub fn run_with_builder(builder: tauri::Builder<tauri::Wry>) {
    let migrations = vec![
        Migration {
            version: 1,
            description: "initial_schema",
            sql: include_str!("../migrations/001_initial_schema.sql"),
            kind: MigrationKind::Up,
        },
        Migration {
            version: 2,
            description: "cube_schema",
            sql: include_str!("../migrations/002_cube_schema.sql"),
            kind: MigrationKind::Up,
        },
    ];

    builder
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_clipboard_manager::init())
        .plugin(tauri_plugin_global_shortcut::Builder::new().build())
        .plugin(tauri_plugin_window_state::Builder::new().build())
        .plugin(
            tauri_plugin_sql::Builder::default()
                .add_migrations("sqlite:finplan.db", migrations)
                .build(),
        )
        // F-DESK-006: the vault starts locked; every command that extracts
        // State<'_, SecureStorageState> panics at invoke-time unless this
        // state is managed before the event loop runs.
        .manage(secure_storage::initial_state())
        // F-0007 fix: updater plugin is registered but disabled in tauri.conf.json.
        // The stale startup check (handle.updater().check().await) has been removed.
        // Re-enable the updater check only when controlled update infrastructure
        // (endpoints + signing key + tests) is in place (F-0020).
        .invoke_handler(tauri::generate_handler![
            commands::get_app_info,
            secure_storage::secure_storage_store,
            secure_storage::secure_storage_retrieve,
            secure_storage::secure_storage_delete,
            secure_storage::secure_storage_exists,
            secure_storage::secure_storage_list_accounts,
            secure_storage::secure_storage_lock,
            secure_storage::secure_storage_unlock,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

pub fn run() {
    run_with_builder(tauri::Builder::default());
}
