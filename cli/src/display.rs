use colored::Colorize;
use tabled::{Table, Tabled, settings::Style};

use crate::models::{Deposit, PortfolioSummary, SearchResult, Transaction};

#[derive(Tabled)]
struct TransactionRow {
    #[tabled(rename = "ID")]
    id: i64,
    #[tabled(rename = "Date")]
    date: String,
    #[tabled(rename = "Type")]
    trade_type: String,
    #[tabled(rename = "Symbol")]
    symbol: String,
    #[tabled(rename = "Qty")]
    quantity: String,
    #[tabled(rename = "Price")]
    price: String,
    #[tabled(rename = "Total")]
    total: String,
    #[tabled(rename = "Fee")]
    fee: String,
    #[tabled(rename = "P&L")]
    pnl: String,
}

pub fn print_transactions(transactions: &[Transaction]) {
    if transactions.is_empty() {
        println!("No transactions found.");
        return;
    }

    let rows: Vec<TransactionRow> = transactions
        .iter()
        .map(|t| {
            let date = t.trade_date.split('T').next().unwrap_or(&t.trade_date).to_string();
            TransactionRow {
                id: t.id,
                date,
                trade_type: t.trade_type.to_uppercase(),
                symbol: t.symbol.clone(),
                quantity: format_decimal(&t.quantity),
                price: format_decimal(&t.price),
                total: format_decimal(&t.total_amount),
                fee: format_decimal(t.fee.as_deref().unwrap_or("0")),
                pnl: t.realized_pnl.as_deref().map(format_pnl).unwrap_or_else(|| "-".to_string()),
            }
        })
        .collect();

    let table = Table::new(rows).with(Style::rounded()).to_string();
    println!("{}", table);
}

pub fn print_transaction_detail(t: &Transaction) {
    println!("{}", "Transaction Detail".bold());
    println!("  ID:         {}", t.id);
    println!("  Symbol:     {}", t.symbol);
    if let Some(ref name) = t.name {
        if !name.is_empty() {
            println!("  Name:       {}", name);
        }
    }
    println!("  Type:       {} ({})", t.trade_type.to_uppercase(), t.asset_type);
    println!("  Quantity:   {}", format_decimal(&t.quantity));
    println!("  Price:      {} {}", format_decimal(&t.price), t.currency);
    println!("  Total:      {} {}", format_decimal(&t.total_amount), t.currency);
    println!("  Fee:        {} {}", format_decimal(t.fee.as_deref().unwrap_or("0")), t.currency);
    println!("  Date:       {}", t.trade_date.split('T').next().unwrap_or(&t.trade_date));
    if let Some(ref pnl) = t.realized_pnl {
        println!("  P&L:        {}", format_pnl(pnl));
    }
    if let Some(ref notes) = t.notes {
        if !notes.is_empty() {
            println!("  Notes:      {}", notes);
        }
    }
}

#[derive(Tabled)]
struct HoldingRow {
    #[tabled(rename = "Symbol")]
    symbol: String,
    #[tabled(rename = "Qty")]
    quantity: String,
    #[tabled(rename = "Avg Cost")]
    avg_cost: String,
    #[tabled(rename = "Price")]
    current_price: String,
    #[tabled(rename = "Value")]
    market_value: String,
    #[tabled(rename = "P&L")]
    pnl: String,
    #[tabled(rename = "P&L %")]
    pnl_pct: String,
}

pub fn print_portfolio(summary: &PortfolioSummary) {
    println!("{}", "Portfolio Summary".bold());
    println!("  Invested:   {:.2}", summary.total_invested);
    println!("  Value:      {:.2}", summary.total_market_value);
    println!("  P&L:        {}", format_pnl_f64(summary.total_unrealized_pnl));
    println!("  P&L %:      {}", format_pct(summary.total_unrealized_pnl_pct));
    println!();

    if summary.holdings.is_empty() {
        println!("No holdings.");
        return;
    }

    let rows: Vec<HoldingRow> = summary
        .holdings
        .iter()
        .map(|h| HoldingRow {
            symbol: h.symbol.clone(),
            quantity: format!("{:.4}", h.quantity),
            avg_cost: format!("{:.2}", h.avg_cost),
            current_price: format!("{:.2}", h.current_price),
            market_value: format!("{:.2}", h.market_value),
            pnl: format_pnl_f64(h.unrealized_pnl),
            pnl_pct: format_pct(h.unrealized_pnl_pct),
        })
        .collect();

    let table = Table::new(rows).with(Style::rounded()).to_string();
    println!("{}", table);
}

#[derive(Tabled)]
struct DepositRow {
    #[tabled(rename = "ID")]
    id: i64,
    #[tabled(rename = "Symbol")]
    symbol: String,
    #[tabled(rename = "Principal")]
    principal: String,
    #[tabled(rename = "Withdrawn")]
    withdrawn: String,
    #[tabled(rename = "Rate %")]
    rate: String,
    #[tabled(rename = "Currency")]
    currency: String,
    #[tabled(rename = "Start")]
    start: String,
    #[tabled(rename = "Maturity")]
    maturity: String,
}

pub fn print_deposits(deposits: &[Deposit]) {
    if deposits.is_empty() {
        println!("No deposits found.");
        return;
    }

    let rows: Vec<DepositRow> = deposits
        .iter()
        .map(|d| DepositRow {
            id: d.id,
            symbol: d.symbol.clone(),
            principal: format_decimal(&d.principal),
            withdrawn: format_decimal(d.withdrawn_amount.as_deref().unwrap_or("0")),
            rate: format_decimal(&d.interest_rate),
            currency: d.currency.clone(),
            start: d.start_date.split('T').next().unwrap_or(&d.start_date).to_string(),
            maturity: d.maturity_date.as_deref()
                .map(|s| s.split('T').next().unwrap_or(s).to_string())
                .unwrap_or_else(|| "-".to_string()),
        })
        .collect();

    let table = Table::new(rows).with(Style::rounded()).to_string();
    println!("{}", table);
}

pub fn print_deposit_detail(d: &Deposit) {
    println!("{}", "Deposit Detail".bold());
    println!("  ID:         {}", d.id);
    println!("  Symbol:     {}", d.symbol);
    if let Some(ref name) = d.name {
        if !name.is_empty() {
            println!("  Name:       {}", name);
        }
    }
    println!("  Principal:  {} {}", format_decimal(&d.principal), d.currency);
    println!("  Withdrawn:  {} {}", format_decimal(d.withdrawn_amount.as_deref().unwrap_or("0")), d.currency);
    println!("  Rate:       {}%", format_decimal(&d.interest_rate));
    println!("  Start:      {}", d.start_date.split('T').next().unwrap_or(&d.start_date));
    if let Some(ref maturity) = d.maturity_date {
        println!("  Maturity:   {}", maturity.split('T').next().unwrap_or(maturity));
    }
    if let Some(ref notes) = d.notes {
        if !notes.is_empty() {
            println!("  Notes:      {}", notes);
        }
    }
}

pub fn print_search_results(results: &[SearchResult]) {
    if results.is_empty() {
        println!("No results found.");
        return;
    }

    for r in results {
        let exchange = r.exchange.as_deref().unwrap_or("");
        let rtype = r.result_type.as_deref().unwrap_or("");
        println!(
            "  {} {} {} {}",
            r.symbol.bold(),
            r.name.dimmed(),
            exchange.dimmed(),
            rtype.dimmed(),
        );
    }
}

// ── Helpers ─────────────────────────────────────────────────

fn format_decimal(s: &str) -> String {
    s.parse::<f64>()
        .map(|v| {
            if v == v.floor() && v.abs() < 1_000_000.0 {
                format!("{:.2}", v)
            } else {
                // Trim trailing zeros but keep at least 2 decimal places
                let formatted = format!("{:.8}", v);
                let trimmed = formatted.trim_end_matches('0');
                let trimmed = trimmed.trim_end_matches('.');
                if !trimmed.contains('.') {
                    format!("{}.00", trimmed)
                } else {
                    let decimals = trimmed.split('.').nth(1).map(|d| d.len()).unwrap_or(0);
                    if decimals < 2 {
                        format!("{:.2}", v)
                    } else {
                        trimmed.to_string()
                    }
                }
            }
        })
        .unwrap_or_else(|_| s.to_string())
}

fn format_pnl(s: &str) -> String {
    match s.parse::<f64>() {
        Ok(v) if v > 0.0 => format!("+{:.2}", v).green().to_string(),
        Ok(v) if v < 0.0 => format!("{:.2}", v).red().to_string(),
        Ok(_) => "0.00".to_string(),
        Err(_) => s.to_string(),
    }
}

fn format_pnl_f64(v: f64) -> String {
    if v > 0.0 {
        format!("+{:.2}", v).green().to_string()
    } else if v < 0.0 {
        format!("{:.2}", v).red().to_string()
    } else {
        "0.00".to_string()
    }
}

fn format_pct(v: f64) -> String {
    if v > 0.0 {
        format!("+{:.2}%", v).green().to_string()
    } else if v < 0.0 {
        format!("{:.2}%", v).red().to_string()
    } else {
        "0.00%".to_string()
    }
}
