use serde::{Deserialize, Serialize};
use std::{fs, path::PathBuf};
use tauri::{AppHandle, Manager};
use tauri_plugin_dialog::DialogExt;

const STORAGE_CONFIG_FILE_NAME: &str = "storage.json";
const WORKSPACE_FILE_NAME: &str = "math-notebook-lab-workspace.json";

#[derive(Default, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
struct StorageConfig {
    folder_path: Option<String>,
}

fn storage_config_path(app: &AppHandle) -> Result<PathBuf, String> {
    let config_dir = app
        .path()
        .app_config_dir()
        .map_err(|error| format!("Unable to find the app config directory: {error}"))?;

    fs::create_dir_all(&config_dir)
        .map_err(|error| format!("Unable to create the app config directory: {error}"))?;

    Ok(config_dir.join(STORAGE_CONFIG_FILE_NAME))
}

fn read_storage_config(app: &AppHandle) -> Result<StorageConfig, String> {
    let config_path = storage_config_path(app)?;

    if !config_path.exists() {
        return Ok(StorageConfig::default());
    }

    let config_json = fs::read_to_string(&config_path)
        .map_err(|error| format!("Unable to read storage settings: {error}"))?;

    serde_json::from_str(&config_json)
        .map_err(|error| format!("Unable to parse storage settings: {error}"))
}

fn write_storage_config(app: &AppHandle, config: &StorageConfig) -> Result<(), String> {
    let config_path = storage_config_path(app)?;
    let config_json = serde_json::to_string_pretty(config)
        .map_err(|error| format!("Unable to serialize storage settings: {error}"))?;

    fs::write(&config_path, config_json)
        .map_err(|error| format!("Unable to save storage settings: {error}"))
}

fn ensure_storage_folder(folder_path: &str) -> Result<PathBuf, String> {
    let path = PathBuf::from(folder_path);

    if path.exists() && !path.is_dir() {
        return Err("The selected path is not a folder.".to_string());
    }

    fs::create_dir_all(&path)
        .map_err(|error| format!("Unable to create the notebook folder: {error}"))?;

    Ok(path)
}

fn workspace_file_path(folder_path: &str) -> Result<PathBuf, String> {
    Ok(ensure_storage_folder(folder_path)?.join(WORKSPACE_FILE_NAME))
}

#[tauri::command]
fn get_notebook_storage_folder(app: AppHandle) -> Result<Option<String>, String> {
    Ok(read_storage_config(&app)?.folder_path)
}

#[tauri::command]
async fn choose_notebook_storage_folder(app: AppHandle) -> Result<Option<String>, String> {
    let folder_path = app
        .dialog()
        .file()
        .blocking_pick_folder()
        .map(|file_path| file_path.into_path())
        .transpose()
        .map_err(|error| format!("Unable to read the selected folder path: {error}"))?;

    Ok(folder_path.map(|path| path.to_string_lossy().into_owned()))
}

#[tauri::command]
fn set_notebook_storage_folder(app: AppHandle, folder_path: String) -> Result<(), String> {
    let folder_path = ensure_storage_folder(&folder_path)?
        .to_string_lossy()
        .into_owned();

    write_storage_config(
        &app,
        &StorageConfig {
            folder_path: Some(folder_path),
        },
    )
}

#[tauri::command]
fn read_workspace_from_folder(folder_path: String) -> Result<Option<String>, String> {
    let workspace_path = workspace_file_path(&folder_path)?;

    if !workspace_path.exists() {
        return Ok(None);
    }

    fs::read_to_string(&workspace_path)
        .map(Some)
        .map_err(|error| format!("Unable to read the notebook workspace file: {error}"))
}

#[tauri::command]
fn write_workspace_to_folder(folder_path: String, workspace_json: String) -> Result<(), String> {
    let workspace_path = workspace_file_path(&folder_path)?;

    fs::write(&workspace_path, workspace_json)
        .map_err(|error| format!("Unable to save the notebook workspace file: {error}"))
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .invoke_handler(tauri::generate_handler![
            get_notebook_storage_folder,
            choose_notebook_storage_folder,
            set_notebook_storage_folder,
            read_workspace_from_folder,
            write_workspace_to_folder,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
