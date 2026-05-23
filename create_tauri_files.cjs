const fs = require('fs');
const path = require('path');

const baseDir = path.join(process.cwd(), 'src-tauri');
if (!fs.existsSync(baseDir)) fs.mkdirSync(baseDir);
if (!fs.existsSync(path.join(baseDir, 'src'))) fs.mkdirSync(path.join(baseDir, 'src'));
if (!fs.existsSync(path.join(baseDir, 'icons'))) fs.mkdirSync(path.join(baseDir, 'icons'));

const files = {
  'src-tauri/Cargo.toml': `[package]
name = "finplan-pro"
version = "0.1.0"
edition = "2021"
[lib]
name = "finplan_pro_lib"
crate-type = ["lib", "cdylib", "staticlib"]
[build-dependencies]
tauri-build = { version = "2", features = [] }
[dependencies]
tauri = { version = "2", features = [] }
tauri-plugin-dialog = "2"
tauri-plugin-fs = "2"
tauri-plugin-shell = "2"
tauri-plugin-sql = { version = "2", features = ["sqlite"] }
serde = { version = "1", features = ["derive"] }
serde_json = "1"`,

  'src-tauri/tauri.conf.json': `{ "productName": "FinPlan Pro", "version": "0.1.0", "identifier": "com.finplanpro.app",
  "build": { "frontendDist": "../dist", "devUrl": "http://localhost:5173", "beforeDevCommand": "npm run dev", "beforeBuildCommand": "npm run build" },
  "app": { "windows": [{ "title": "FinPlan Pro", "width": 1400, "height": 900, "minWidth": 1024, "minHeight": 600, "resizable": true, "center": true }], "security": { "csp": null } },
  "bundle": { "active": true, "targets": "nsis", "icon": ["icons/icon.ico"], "nsis": { "installMode": "currentUser" } } }`,

  'src-tauri/src/main.rs': `#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]
fn main() { finplan_pro_lib::run() }`,

  'src-tauri/src/lib.rs': `#[tauri::command]
fn get_app_info() -> serde_json::Value {
    serde_json::json!({ "name": "FinPlan Pro", "version": "0.1.0" })
}
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_sql::Builder::default().build())
        .invoke_handler(tauri::generate_handler![get_app_info])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}`,

  'src-tauri/build.rs': `fn main() { tauri_build::build() }`
};

for (const [filePath, content] of Object.entries(files)) {
  fs.writeFileSync(path.join(process.cwd(), filePath), content);
}
// Create a fake icon file to avoid build error
fs.writeFileSync(path.join(baseDir, 'icons', 'icon.ico'), '');

console.log('Tauri shell files created successfully!');
