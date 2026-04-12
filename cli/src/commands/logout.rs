use anyhow::Result;
use crate::config::clear_config;

pub fn run() -> Result<()> {
    clear_config()?;
    println!("Logged out. Token cleared.");
    Ok(())
}
