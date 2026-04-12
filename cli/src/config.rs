use anyhow::{Context, Result};
use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;

#[derive(Debug, Serialize, Deserialize)]
pub struct Config {
    pub token: String,
    pub server_url: String,
}

pub fn config_dir() -> PathBuf {
    dirs::config_dir()
        .unwrap_or_else(|| PathBuf::from("."))
        .join("tt")
}

pub fn config_path() -> PathBuf {
    config_dir().join("credentials.json")
}

pub fn load_config() -> Result<Config> {
    let path = config_path();
    let content = fs::read_to_string(&path)
        .with_context(|| format!("Not logged in. Run `tt login` first.\n(No config at {:?})", path))?;
    let config: Config = serde_json::from_str(&content)
        .context("Corrupted config file. Run `tt login` to re-authenticate.")?;
    Ok(config)
}

pub fn save_config(config: &Config) -> Result<()> {
    let dir = config_dir();
    fs::create_dir_all(&dir)
        .with_context(|| format!("Failed to create config directory: {:?}", dir))?;

    let path = config_path();
    let content = serde_json::to_string_pretty(config)?;
    fs::write(&path, &content)?;

    // Set file permissions to 600 on Unix
    #[cfg(unix)]
    {
        use std::os::unix::fs::PermissionsExt;
        fs::set_permissions(&path, fs::Permissions::from_mode(0o600))?;
    }

    Ok(())
}

pub fn clear_config() -> Result<()> {
    let path = config_path();
    if path.exists() {
        fs::remove_file(&path)?;
    }
    Ok(())
}
