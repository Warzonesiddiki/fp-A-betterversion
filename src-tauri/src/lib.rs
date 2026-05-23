use tauri::menu::{MenuBuilder, MenuItemBuilder, SubmenuBuilder};
use tauri_plugin_sql::{Migration, MigrationKind};

#[tauri::command]
fn get_app_info() -> serde_json::Value {
    serde_json::json!({ "name": "FinPlan Pro", "version": "0.1.0" })
}

fn build_menu(app: &tauri::App) -> Result<(), Box<dyn std::error::Error>> {
    let handle = app.handle();

    // File menu items
    let new_file = MenuItemBuilder::with_id("new_file", "New").accelerator("CmdOrCtrl+N").build(handle)?;
    let open_file = MenuItemBuilder::with_id("open_file", "Open...").accelerator("CmdOrCtrl+O").build(handle)?;
    let save_file = MenuItemBuilder::with_id("save_file", "Save").accelerator("CmdOrCtrl+S").build(handle)?;
    let save_as = MenuItemBuilder::with_id("save_as", "Save As...").accelerator("CmdOrCtrl+Shift+S").build(handle)?;
    let import_data = MenuItemBuilder::with_id("import_data", "Import...").build(handle)?;
    let export_data = MenuItemBuilder::with_id("export_data", "Export...").build(handle)?;
    let print = MenuItemBuilder::with_id("print", "Print").accelerator("CmdOrCtrl+P").build(handle)?;
    let quit = MenuItemBuilder::with_id("quit", "Quit").accelerator("CmdOrCtrl+Q").build(handle)?;

    let file_menu = SubmenuBuilder::new(handle, "File")
        .item(&new_file)
        .item(&open_file)
        .item(&save_file)
        .item(&save_as)
        .separator()
        .item(&import_data)
        .item(&export_data)
        .separator()
        .item(&print)
        .separator()
        .item(&quit)
        .build()?;

    // Edit menu items
    let undo = MenuItemBuilder::with_id("undo", "Undo").accelerator("CmdOrCtrl+Z").build(handle)?;
    let redo = MenuItemBuilder::with_id("redo", "Redo").accelerator("CmdOrCtrl+Y").build(handle)?;
    let cut = MenuItemBuilder::with_id("cut", "Cut").accelerator("CmdOrCtrl+X").build(handle)?;
    let copy = MenuItemBuilder::with_id("copy", "Copy").accelerator("CmdOrCtrl+C").build(handle)?;
    let paste = MenuItemBuilder::with_id("paste", "Paste").accelerator("CmdOrCtrl+V").build(handle)?;
    let select_all = MenuItemBuilder::with_id("select_all", "Select All").accelerator("CmdOrCtrl+A").build(handle)?;
    let find = MenuItemBuilder::with_id("find", "Find").accelerator("CmdOrCtrl+F").build(handle)?;
    let preferences = MenuItemBuilder::with_id("preferences", "Preferences...").build(handle)?;

    let edit_menu = SubmenuBuilder::new(handle, "Edit")
        .item(&undo)
        .item(&redo)
        .separator()
        .item(&cut)
        .item(&copy)
        .item(&paste)
        .item(&select_all)
        .separator()
        .item(&find)
        .separator()
        .item(&preferences)
        .build()?;

    // View menu items
    let toggle_sidebar = MenuItemBuilder::with_id("toggle_sidebar", "Toggle Sidebar").accelerator("CmdOrCtrl+B").build(handle)?;
    let toggle_formula_bar = MenuItemBuilder::with_id("toggle_formula_bar", "Formula Bar").build(handle)?;
    let toggle_status_bar = MenuItemBuilder::with_id("toggle_status_bar", "Status Bar").build(handle)?;
    let zoom_in = MenuItemBuilder::with_id("zoom_in", "Zoom In").accelerator("CmdOrCtrl+Plus").build(handle)?;
    let zoom_out = MenuItemBuilder::with_id("zoom_out", "Zoom Out").accelerator("CmdOrCtrl+-").build(handle)?;
    let reset_zoom = MenuItemBuilder::with_id("reset_zoom", "Reset Zoom").accelerator("CmdOrCtrl+0").build(handle)?;
    let fullscreen = MenuItemBuilder::with_id("fullscreen", "Full Screen").accelerator("F11").build(handle)?;

    let view_menu = SubmenuBuilder::new(handle, "View")
        .item(&toggle_sidebar)
        .item(&toggle_formula_bar)
        .item(&toggle_status_bar)
        .separator()
        .item(&zoom_in)
        .item(&zoom_out)
        .item(&reset_zoom)
        .separator()
        .item(&fullscreen)
        .build()?;

    // Tools menu items
    let consolidate = MenuItemBuilder::with_id("consolidate", "Consolidation Wizard").build(handle)?;
    let scenarios = MenuItemBuilder::with_id("scenarios", "Scenario Manager").build(handle)?;
    let reports = MenuItemBuilder::with_id("reports", "Report Builder").build(handle)?;
    let validate_data = MenuItemBuilder::with_id("validate_data", "Validate Data").build(handle)?;
    let options = MenuItemBuilder::with_id("options", "Options...").build(handle)?;

    let tools_menu = SubmenuBuilder::new(handle, "Tools")
        .item(&consolidate)
        .item(&scenarios)
        .item(&reports)
        .separator()
        .item(&validate_data)
        .separator()
        .item(&options)
        .build()?;

    // Help menu items
    let documentation = MenuItemBuilder::with_id("documentation", "Documentation").accelerator("F1").build(handle)?;
    let keyboard_shortcuts = MenuItemBuilder::with_id("keyboard_shortcuts", "Keyboard Shortcuts").accelerator("CmdOrCtrl+/").build(handle)?;
    let about = MenuItemBuilder::with_id("about", "About FinPlan Pro").build(handle)?;

    let help_menu = SubmenuBuilder::new(handle, "Help")
        .item(&documentation)
        .item(&keyboard_shortcuts)
        .separator()
        .item(&about)
        .build()?;

    let menu = MenuBuilder::new(handle)
        .item(&file_menu)
        .item(&edit_menu)
        .item(&view_menu)
        .item(&tools_menu)
        .item(&help_menu)
        .build()?;

    app.set_menu(menu)?;
    Ok(())
}

pub fn run() {
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

    tauri::Builder::default()
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
        .setup(|app| {
            build_menu(app).expect("Failed to build menu");
            Ok(())
        })
        .on_menu_event(|app, event| {
            let id = event.id().as_ref();
            let _ = app.emit("menu-event", id);
        })
        .invoke_handler(tauri::generate_handler![get_app_info])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
