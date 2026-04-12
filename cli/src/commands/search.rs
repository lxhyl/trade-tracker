use anyhow::Result;
use crate::client::ApiClient;
use crate::display::print_search_results;
use crate::models::SearchResult;

pub async fn run(query: &str) -> Result<()> {
    let client = ApiClient::new()?;
    let results: Vec<SearchResult> = client
        .get(&format!("/api/cli/search?q={}", query))
        .await?;
    print_search_results(&results);
    Ok(())
}
