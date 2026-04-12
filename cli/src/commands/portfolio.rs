use anyhow::Result;
use crate::client::ApiClient;
use crate::display::print_portfolio;
use crate::models::PortfolioSummary;

pub async fn run() -> Result<()> {
    let client = ApiClient::new()?;
    let summary: PortfolioSummary = client.get("/api/cli/portfolio").await?;
    print_portfolio(&summary);
    Ok(())
}
