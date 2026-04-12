use anyhow::Result;
use crate::client::ApiClient;
use crate::display::{print_transaction_detail, print_transactions};
use crate::models::{CreateTransaction, SuccessResponse, Transaction};

pub async fn list() -> Result<()> {
    let client = ApiClient::new()?;
    let txs: Vec<Transaction> = client.get("/api/cli/transactions").await?;
    print_transactions(&txs);
    Ok(())
}

pub async fn get(id: i64) -> Result<()> {
    let client = ApiClient::new()?;
    let tx: Transaction = client.get(&format!("/api/cli/transactions/{}", id)).await?;
    print_transaction_detail(&tx);
    Ok(())
}

pub async fn add(
    symbol: &str,
    trade_type: &str,
    quantity: f64,
    price: f64,
    currency: &str,
    date: &str,
    name: Option<&str>,
    asset_type: Option<&str>,
    fee: f64,
    notes: Option<&str>,
) -> Result<()> {
    let client = ApiClient::new()?;
    let body = CreateTransaction {
        symbol: symbol.to_string(),
        name: name.map(|s| s.to_string()),
        asset_type: asset_type.map(|s| s.to_string()),
        trade_type: trade_type.to_string(),
        quantity,
        price,
        fee,
        currency: currency.to_string(),
        trade_date: date.to_string(),
        notes: notes.map(|s| s.to_string()),
    };
    let tx: Transaction = client.post("/api/cli/transactions", &body).await?;
    println!("Transaction created (ID: {})", tx.id);
    print_transaction_detail(&tx);
    Ok(())
}

pub async fn update(
    id: i64,
    symbol: Option<&str>,
    trade_type: Option<&str>,
    quantity: Option<f64>,
    price: Option<f64>,
    currency: Option<&str>,
    date: Option<&str>,
    name: Option<&str>,
    asset_type: Option<&str>,
    fee: Option<f64>,
    notes: Option<&str>,
) -> Result<()> {
    let client = ApiClient::new()?;

    // Build a partial update object
    let mut body = serde_json::Map::new();
    if let Some(v) = symbol { body.insert("symbol".into(), v.into()); }
    if let Some(v) = trade_type { body.insert("tradeType".into(), v.into()); }
    if let Some(v) = quantity { body.insert("quantity".into(), v.into()); }
    if let Some(v) = price { body.insert("price".into(), v.into()); }
    if let Some(v) = currency { body.insert("currency".into(), v.into()); }
    if let Some(v) = date { body.insert("tradeDate".into(), v.into()); }
    if let Some(v) = name { body.insert("name".into(), v.into()); }
    if let Some(v) = asset_type { body.insert("assetType".into(), v.into()); }
    if let Some(v) = fee { body.insert("fee".into(), v.into()); }
    if let Some(v) = notes { body.insert("notes".into(), v.into()); }

    let tx: Transaction = client
        .put(&format!("/api/cli/transactions/{}", id), &body)
        .await?;
    println!("Transaction updated (ID: {})", tx.id);
    print_transaction_detail(&tx);
    Ok(())
}

pub async fn delete(id: i64) -> Result<()> {
    let client = ApiClient::new()?;
    let _: SuccessResponse = client
        .delete(&format!("/api/cli/transactions/{}", id))
        .await?;
    println!("Transaction {} deleted.", id);
    Ok(())
}
