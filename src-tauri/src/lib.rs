use tauri_plugin_sql::{Migration, MigrationKind};
use tauri_plugin_updater::UpdaterExt;

#[tauri::command]
pub fn get_app_info() -> serde_json::Value {
    serde_json::json!({ "name": "FinPlan Pro", "version": "0.1.0" })
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
        .plugin(tauri_plugin_updater::Builder::new().build())
        .invoke_handler(tauri::generate_handler![get_app_info])
        .setup(|app| {
            // Check for updates on startup
            let handle = app.handle().clone();
            std::thread::spawn(move || {
                tauri::async_runtime::block_on(async move {
                    let _ = handle.updater().check().await;
                });
            });
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

pub fn run() {
    run_with_builder(tauri::Builder::default());
}
