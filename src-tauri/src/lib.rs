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
        .plugin(tauri_plugin_process::init())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .setup(|app| {
            // Build the App menu (macOS requires this as first menu)
            let app_menu = SubmenuBuilder::new(app, "Lost Animator")
                .item(&PredefinedMenuItem::about(app, Some("About Lost Animator"), None)?)
                .separator()
                .item(&PredefinedMenuItem::services(app, Some("Services"))?)
                .separator()
                .item(&PredefinedMenuItem::hide(app, Some("Hide Lost Animator"))?)
                .item(&PredefinedMenuItem::hide_others(app, Some("Hide Others"))?)
                .item(&PredefinedMenuItem::show_all(app, Some("Show All"))?)
                .separator()
                .item(&PredefinedMenuItem::quit(app, Some("Quit Lost Animator"))?)
                .build()?;

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

            // Build the Help menu
            let check_updates = MenuItemBuilder::with_id("check_updates", "Check for Updates...")
                .build(app)?;
            let help_menu = SubmenuBuilder::new(app, "Help")
                .item(&check_updates)
                .build()?;

            // Build the complete menu
            let menu = Menu::with_items(
                app,
                &[&app_menu, &file_menu, &edit_menu, &view_menu, &window_menu, &help_menu],
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
                    "check_updates" => {
                        let _ = window.emit("menu-check-updates", ());
                    }
                    _ => {}
                }
            });

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
