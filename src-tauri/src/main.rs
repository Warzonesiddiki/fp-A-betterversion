#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use tauri::menu::{MenuBuilder, MenuItemBuilder, SubmenuBuilder};
use tauri::Emitter;

fn build_menu(app: &tauri::App) -> Result<(), Box<dyn std::error::Error>> {
    let handle = app.handle();

    // File
    let open = MenuItemBuilder::with_id("open_file", "Open").accelerator("CmdOrCtrl+O").build(handle)?;
    let save = MenuItemBuilder::with_id("save_file", "Save").accelerator("CmdOrCtrl+S").build(handle)?;
    let export = MenuItemBuilder::with_id("export_data", "Export").build(handle)?;

    let file_menu = SubmenuBuilder::new(handle, "File")
        .item(&open)
        .item(&save)
        .item(&export)
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
            build_menu(app).expect("Failed to build menu");
            Ok(())
        })
        .on_menu_event(|app, event| {
            let id = event.id().as_ref();
            let _ = app.emit("menu-event", id);
        });
        
    finplan_pro_lib::run_with_builder(builder);
}
