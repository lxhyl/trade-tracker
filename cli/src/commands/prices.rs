use anyhow::Result;
use crate::client::ApiClient;
use crate::models::{PriceLookupResult, PriceRefreshResult};

pub async fn refresh() -> Result<()> {
    let client = ApiClient::new()?;
    println!("Refreshing prices...");
    let result: PriceRefreshResult = client.get("/api/cli/prices").await?;
    println!("Updated {} prices:", result.updated);
    for p in &result.prices {
        println!(
            "  {} = {:.2}{}",
            p.symbol,
            p.price,
            p.source.as_deref().map(|s| format!(" ({})", s)).unwrap_or_default(),
        );
    }
    Ok(())
}

pub async fn lookup(symbol: &str, asset_type: Option<&str>) -> Result<()> {
    let client = ApiClient::new()?;
    let mut path = format!("/api/cli/price-lookup?symbol={}", symbol);
    if let Some(t) = asset_type {
        path.push_str(&format!("&type={}", t));
    }
    let result: PriceLookupResult = client.get(&path).await?;
    match result.price {
        Some(price) => {
            println!(
                "{} = {:.2} {}{}",
                result.symbol,
                price,
                result.currency.as_deref().unwrap_or("USD"),
                result.detected_type.as_deref().map(|t| format!(" [{}]", t)).unwrap_or_default(),
            );
        }
        None => {
            println!("No price found for {}", result.symbol);
        }
    }
    Ok(())
}
