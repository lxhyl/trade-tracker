use anyhow::Result;
use crate::client::ApiClient;
use crate::display::{print_deposit_detail, print_deposits};
use crate::models::{CreateDeposit, Deposit, SuccessResponse, WithdrawRequest};

pub async fn list() -> Result<()> {
    let client = ApiClient::new()?;
    let deps: Vec<Deposit> = client.get("/api/cli/deposits").await?;
    print_deposits(&deps);
    Ok(())
}

pub async fn get(id: i64) -> Result<()> {
    let client = ApiClient::new()?;
    let dep: Deposit = client.get(&format!("/api/cli/deposits/{}", id)).await?;
    print_deposit_detail(&dep);
    Ok(())
}

pub async fn add(
    symbol: &str,
    principal: f64,
    rate: f64,
    currency: &str,
    start_date: &str,
    name: Option<&str>,
    maturity_date: Option<&str>,
    notes: Option<&str>,
) -> Result<()> {
    let client = ApiClient::new()?;
    let body = CreateDeposit {
        symbol: symbol.to_string(),
        name: name.map(|s| s.to_string()),
        principal,
        interest_rate: rate,
        currency: currency.to_string(),
        start_date: start_date.to_string(),
        maturity_date: maturity_date.map(|s| s.to_string()),
        notes: notes.map(|s| s.to_string()),
    };
    let dep: Deposit = client.post("/api/cli/deposits", &body).await?;
    println!("Deposit created (ID: {})", dep.id);
    print_deposit_detail(&dep);
    Ok(())
}

pub async fn update(
    id: i64,
    symbol: Option<&str>,
    principal: Option<f64>,
    rate: Option<f64>,
    currency: Option<&str>,
    start_date: Option<&str>,
    name: Option<&str>,
    maturity_date: Option<&str>,
    notes: Option<&str>,
) -> Result<()> {
    let client = ApiClient::new()?;

    let mut body = serde_json::Map::new();
    if let Some(v) = symbol { body.insert("symbol".into(), v.into()); }
    if let Some(v) = principal { body.insert("principal".into(), v.into()); }
    if let Some(v) = rate { body.insert("interestRate".into(), v.into()); }
    if let Some(v) = currency { body.insert("currency".into(), v.into()); }
    if let Some(v) = start_date { body.insert("startDate".into(), v.into()); }
    if let Some(v) = name { body.insert("name".into(), v.into()); }
    if let Some(v) = maturity_date { body.insert("maturityDate".into(), v.into()); }
    if let Some(v) = notes { body.insert("notes".into(), v.into()); }

    let dep: Deposit = client
        .put(&format!("/api/cli/deposits/{}", id), &body)
        .await?;
    println!("Deposit updated (ID: {})", dep.id);
    print_deposit_detail(&dep);
    Ok(())
}

pub async fn delete(id: i64) -> Result<()> {
    let client = ApiClient::new()?;
    let _: SuccessResponse = client
        .delete(&format!("/api/cli/deposits/{}", id))
        .await?;
    println!("Deposit {} deleted.", id);
    Ok(())
}

pub async fn withdraw(id: i64, amount: f64) -> Result<()> {
    let client = ApiClient::new()?;
    let body = WithdrawRequest { amount };
    let dep: Deposit = client
        .post(&format!("/api/cli/deposits/{}/withdraw", id), &body)
        .await?;
    println!("Withdrew {:.2} from deposit {}.", amount, id);
    print_deposit_detail(&dep);
    Ok(())
}
