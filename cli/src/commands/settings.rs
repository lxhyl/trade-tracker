use anyhow::Result;
use crate::client::ApiClient;
use crate::models::Settings;

pub async fn get_all() -> Result<()> {
    let client = ApiClient::new()?;
    let settings: Settings = client.get("/api/cli/settings").await?;
    println!("Settings:");
    println!("  currency:     {}", settings.currency);
    println!("  language:     {}", settings.language);
    println!("  color-scheme: {}", settings.color_scheme);
    println!("  style-theme:  {}", settings.style_theme);
    Ok(())
}

pub async fn set(key: &str, value: &str) -> Result<()> {
    let client = ApiClient::new()?;
    let mut body = serde_json::Map::new();
    body.insert(key.to_string(), serde_json::Value::String(value.to_string()));
    let settings: Settings = client.put("/api/cli/settings", &body).await?;
    println!("Updated. Current settings:");
    println!("  currency:     {}", settings.currency);
    println!("  language:     {}", settings.language);
    println!("  color-scheme: {}", settings.color_scheme);
    println!("  style-theme:  {}", settings.style_theme);
    Ok(())
}
