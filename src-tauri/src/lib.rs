use tauri::{
    menu::{Menu, MenuItemBuilder, PredefinedMenuItem, SubmenuBuilder},
    Emitter, Manager,
};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_dialog::init())
        .setup(|app| {
            // Build the File menu
            let new_file = MenuItemBuilder::with_id("new", "New")
                .accelerator("CmdOrCtrl+N")
                .build(app)?;
            let open_file = MenuItemBuilder::with_id("open", "Open...")
                .accelerator("CmdOrCtrl+O")
                .build(app)?;
            let save_file = MenuItemBuilder::with_id("save", "Save")
                .accelerator("CmdOrCtrl+S")
                .build(app)?;
            let save_as = MenuItemBuilder::with_id("save_as", "Save As...")
                .accelerator("CmdOrCtrl+Shift+S")
                .build(app)?;

            let file_menu = SubmenuBuilder::new(app, "File")
                .item(&new_file)
                .separator()
                .item(&open_file)
                .separator()
                .item(&save_file)
                .item(&save_as)
                .separator()
                .item(&PredefinedMenuItem::close_window(app, Some("Close"))?)
                .build()?;

            // Build the Edit menu
            let undo = MenuItemBuilder::with_id("undo", "Undo")
                .accelerator("CmdOrCtrl+Z")
                .build(app)?;
            let redo = MenuItemBuilder::with_id("redo", "Redo")
                .accelerator("CmdOrCtrl+Shift+Z")
                .build(app)?;

            let edit_menu = SubmenuBuilder::new(app, "Edit")
                .item(&undo)
                .item(&redo)
                .separator()
                .item(&PredefinedMenuItem::cut(app, Some("Cut"))?)
                .item(&PredefinedMenuItem::copy(app, Some("Copy"))?)
                .item(&PredefinedMenuItem::paste(app, Some("Paste"))?)
                .item(&PredefinedMenuItem::select_all(app, Some("Select All"))?)
                .build()?;

            // Build the View menu
            let view_menu = SubmenuBuilder::new(app, "View")
                .item(&PredefinedMenuItem::fullscreen(app, Some("Toggle Fullscreen"))?)
                .build()?;

            // Build the Window menu
            let window_menu = SubmenuBuilder::new(app, "Window")
                .item(&PredefinedMenuItem::minimize(app, Some("Minimize"))?)
                .item(&PredefinedMenuItem::maximize(app, Some("Zoom"))?)
                .separator()
                .item(&PredefinedMenuItem::close_window(app, Some("Close"))?)
                .build()?;

            // Build the complete menu
            let menu = Menu::with_items(
                app,
                &[&file_menu, &edit_menu, &view_menu, &window_menu],
            )?;

            app.set_menu(menu)?;

            // Handle menu events
            app.on_menu_event(move |app_handle, event| {
                let window = app_handle.get_webview_window("main").unwrap();
                match event.id().as_ref() {
                    "new" => {
                        let _ = window.emit("menu-new", ());
                    }
                    "open" => {
                        let _ = window.emit("menu-open", ());
                    }
                    "save" => {
                        let _ = window.emit("menu-save", ());
                    }
                    "save_as" => {
                        let _ = window.emit("menu-save-as", ());
                    }
                    "undo" => {
                        let _ = window.emit("menu-undo", ());
                    }
                    "redo" => {
                        let _ = window.emit("menu-redo", ());
                    }
                    _ => {}
                }
            });

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
