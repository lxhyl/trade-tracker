use serde::{Deserialize, Serialize};

// ── Transactions ────────────────────────────────────────────

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Transaction {
    pub id: i64,
    pub symbol: String,
    pub name: Option<String>,
    pub asset_type: String,
    pub trade_type: String,
    pub quantity: String,
    pub price: String,
    pub total_amount: String,
    pub fee: Option<String>,
    pub currency: String,
    pub trade_date: String,
    pub notes: Option<String>,
    pub realized_pnl: Option<String>,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct CreateTransaction {
    pub symbol: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub name: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub asset_type: Option<String>,
    pub trade_type: String,
    pub quantity: f64,
    pub price: f64,
    #[serde(default)]
    pub fee: f64,
    pub currency: String,
    pub trade_date: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub notes: Option<String>,
}

// ── Deposits ────────────────────────────────────────────────

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Deposit {
    pub id: i64,
    pub symbol: String,
    pub name: Option<String>,
    pub principal: String,
    pub withdrawn_amount: Option<String>,
    pub interest_rate: String,
    pub currency: String,
    pub start_date: String,
    pub maturity_date: Option<String>,
    pub notes: Option<String>,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct CreateDeposit {
    pub symbol: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub name: Option<String>,
    pub principal: f64,
    pub interest_rate: f64,
    pub currency: String,
    pub start_date: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub maturity_date: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub notes: Option<String>,
}

#[derive(Debug, Serialize)]
pub struct WithdrawRequest {
    pub amount: f64,
}

// ── Portfolio ───────────────────────────────────────────────

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
#[allow(dead_code)]
pub struct Holding {
    pub symbol: String,
    pub name: Option<String>,
    pub asset_type: String,
    pub quantity: f64,
    pub avg_cost: f64,
    pub current_price: f64,
    pub market_value: f64,
    pub cost_basis: f64,
    pub unrealized_pnl: f64,
    pub unrealized_pnl_pct: f64,
    pub currency: String,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PortfolioSummary {
    pub total_invested: f64,
    pub total_market_value: f64,
    pub total_unrealized_pnl: f64,
    pub total_unrealized_pnl_pct: f64,
    pub holdings: Vec<Holding>,
}

// ── Prices ──────────────────────────────────────────────────

#[derive(Debug, Deserialize)]
pub struct PriceRefreshResult {
    pub updated: usize,
    pub prices: Vec<PriceEntry>,
}

#[derive(Debug, Deserialize)]
pub struct PriceEntry {
    pub symbol: String,
    pub price: f64,
    pub source: Option<String>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PriceLookupResult {
    pub symbol: String,
    pub price: Option<f64>,
    pub currency: Option<String>,
    pub detected_type: Option<String>,
}

// ── Search ──────────────────────────────────────────────────

#[derive(Debug, Deserialize)]
pub struct SearchResult {
    pub symbol: String,
    pub name: String,
    pub exchange: Option<String>,
    #[serde(rename = "type")]
    pub result_type: Option<String>,
}

// ── Settings ────────────────────────────────────────────────

#[derive(Debug, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Settings {
    pub currency: String,
    pub language: String,
    pub color_scheme: String,
    pub style_theme: String,
}

// ── Generic ─────────────────────────────────────────────────

#[derive(Debug, Deserialize)]
#[allow(dead_code)]
pub struct SuccessResponse {
    pub success: bool,
}
