mod client;
mod commands;
mod config;
mod display;
mod models;

use clap::{Parser, Subcommand};

#[derive(Parser)]
#[command(name = "tt", about = "TradeTracker CLI - manage your portfolio from the terminal")]
struct Cli {
    #[command(subcommand)]
    command: Commands,
}

#[derive(Subcommand)]
enum Commands {
    /// Authenticate via browser OAuth
    Login {
        /// Server URL (default: from TT_SERVER_URL env or http://localhost:3000)
        #[arg(long, env = "TT_SERVER_URL", default_value = "http://localhost:3000")]
        server: String,
    },
    /// Clear stored authentication token
    Logout,
    /// Show portfolio holdings summary
    Portfolio,
    /// Manage transactions
    #[command(subcommand)]
    Transactions(TransactionCommands),
    /// Manage deposits
    #[command(subcommand)]
    Deposits(DepositCommands),
    /// Price operations
    #[command(subcommand)]
    Prices(PriceCommands),
    /// Search for stock/crypto symbols
    Search {
        /// Search query
        query: String,
    },
    /// View or update settings
    Settings {
        #[command(subcommand)]
        action: Option<SettingsAction>,
    },
}

#[derive(Subcommand)]
enum TransactionCommands {
    /// List all transactions
    List,
    /// Get transaction details
    Get {
        /// Transaction ID
        id: i64,
    },
    /// Add a new transaction
    Add {
        /// Asset symbol (e.g. BTC, AAPL)
        #[arg(long)]
        symbol: String,
        /// Trade type: buy or sell
        #[arg(long)]
        trade_type: String,
        /// Quantity
        #[arg(long)]
        quantity: f64,
        /// Price per unit
        #[arg(long)]
        price: f64,
        /// Currency (USD, CNY, HKD)
        #[arg(long, default_value = "USD")]
        currency: String,
        /// Trade date (YYYY-MM-DD)
        #[arg(long)]
        date: String,
        /// Asset name
        #[arg(long)]
        name: Option<String>,
        /// Asset type: crypto or stock
        #[arg(long)]
        asset_type: Option<String>,
        /// Transaction fee
        #[arg(long, default_value = "0")]
        fee: f64,
        /// Notes
        #[arg(long)]
        notes: Option<String>,
    },
    /// Update an existing transaction
    Update {
        /// Transaction ID
        id: i64,
        #[arg(long)]
        symbol: Option<String>,
        #[arg(long)]
        trade_type: Option<String>,
        #[arg(long)]
        quantity: Option<f64>,
        #[arg(long)]
        price: Option<f64>,
        #[arg(long)]
        currency: Option<String>,
        #[arg(long)]
        date: Option<String>,
        #[arg(long)]
        name: Option<String>,
        #[arg(long)]
        asset_type: Option<String>,
        #[arg(long)]
        fee: Option<f64>,
        #[arg(long)]
        notes: Option<String>,
    },
    /// Delete a transaction
    Delete {
        /// Transaction ID
        id: i64,
    },
}

#[derive(Subcommand)]
enum DepositCommands {
    /// List all deposits
    List,
    /// Get deposit details
    Get {
        /// Deposit ID
        id: i64,
    },
    /// Add a new deposit
    Add {
        /// Symbol/identifier
        #[arg(long)]
        symbol: String,
        /// Principal amount
        #[arg(long)]
        principal: f64,
        /// Annual interest rate (e.g. 4.5 for 4.5%)
        #[arg(long)]
        rate: f64,
        /// Currency (USD, CNY, HKD)
        #[arg(long, default_value = "USD")]
        currency: String,
        /// Start date (YYYY-MM-DD)
        #[arg(long)]
        start_date: String,
        /// Deposit name
        #[arg(long)]
        name: Option<String>,
        /// Maturity date (YYYY-MM-DD)
        #[arg(long)]
        maturity_date: Option<String>,
        /// Notes
        #[arg(long)]
        notes: Option<String>,
    },
    /// Update an existing deposit
    Update {
        /// Deposit ID
        id: i64,
        #[arg(long)]
        symbol: Option<String>,
        #[arg(long)]
        principal: Option<f64>,
        #[arg(long)]
        rate: Option<f64>,
        #[arg(long)]
        currency: Option<String>,
        #[arg(long)]
        start_date: Option<String>,
        #[arg(long)]
        name: Option<String>,
        #[arg(long)]
        maturity_date: Option<String>,
        #[arg(long)]
        notes: Option<String>,
    },
    /// Delete a deposit
    Delete {
        /// Deposit ID
        id: i64,
    },
    /// Withdraw from a deposit
    Withdraw {
        /// Deposit ID
        id: i64,
        /// Amount to withdraw
        #[arg(long)]
        amount: f64,
    },
}

#[derive(Subcommand)]
enum PriceCommands {
    /// Refresh all asset prices
    Refresh,
    /// Look up a single asset price
    Lookup {
        /// Asset symbol
        symbol: String,
        /// Asset type: crypto or stock
        #[arg(long, name = "type")]
        asset_type: Option<String>,
    },
}

#[derive(Subcommand)]
enum SettingsAction {
    /// Set a setting value
    Set {
        /// Setting key (currency, language, color-scheme, style-theme)
        key: String,
        /// Setting value
        value: String,
    },
}

#[tokio::main]
async fn main() {
    let cli = Cli::parse();

    let result = match cli.command {
        Commands::Login { server } => commands::login::run(&server).await,
        Commands::Logout => commands::logout::run(),
        Commands::Portfolio => commands::portfolio::run().await,
        Commands::Transactions(cmd) => match cmd {
            TransactionCommands::List => commands::transactions::list().await,
            TransactionCommands::Get { id } => commands::transactions::get(id).await,
            TransactionCommands::Add {
                symbol,
                trade_type,
                quantity,
                price,
                currency,
                date,
                name,
                asset_type,
                fee,
                notes,
            } => {
                commands::transactions::add(
                    &symbol,
                    &trade_type,
                    quantity,
                    price,
                    &currency,
                    &date,
                    name.as_deref(),
                    asset_type.as_deref(),
                    fee,
                    notes.as_deref(),
                )
                .await
            }
            TransactionCommands::Update {
                id,
                symbol,
                trade_type,
                quantity,
                price,
                currency,
                date,
                name,
                asset_type,
                fee,
                notes,
            } => {
                commands::transactions::update(
                    id,
                    symbol.as_deref(),
                    trade_type.as_deref(),
                    quantity,
                    price,
                    currency.as_deref(),
                    date.as_deref(),
                    name.as_deref(),
                    asset_type.as_deref(),
                    fee,
                    notes.as_deref(),
                )
                .await
            }
            TransactionCommands::Delete { id } => commands::transactions::delete(id).await,
        },
        Commands::Deposits(cmd) => match cmd {
            DepositCommands::List => commands::deposits::list().await,
            DepositCommands::Get { id } => commands::deposits::get(id).await,
            DepositCommands::Add {
                symbol,
                principal,
                rate,
                currency,
                start_date,
                name,
                maturity_date,
                notes,
            } => {
                commands::deposits::add(
                    &symbol,
                    principal,
                    rate,
                    &currency,
                    &start_date,
                    name.as_deref(),
                    maturity_date.as_deref(),
                    notes.as_deref(),
                )
                .await
            }
            DepositCommands::Update {
                id,
                symbol,
                principal,
                rate,
                currency,
                start_date,
                name,
                maturity_date,
                notes,
            } => {
                commands::deposits::update(
                    id,
                    symbol.as_deref(),
                    principal,
                    rate,
                    currency.as_deref(),
                    start_date.as_deref(),
                    name.as_deref(),
                    maturity_date.as_deref(),
                    notes.as_deref(),
                )
                .await
            }
            DepositCommands::Delete { id } => commands::deposits::delete(id).await,
            DepositCommands::Withdraw { id, amount } => {
                commands::deposits::withdraw(id, amount).await
            }
        },
        Commands::Prices(cmd) => match cmd {
            PriceCommands::Refresh => commands::prices::refresh().await,
            PriceCommands::Lookup { symbol, asset_type } => {
                commands::prices::lookup(&symbol, asset_type.as_deref()).await
            }
        },
        Commands::Search { query } => commands::search::run(&query).await,
        Commands::Settings { action } => match action {
            None => commands::settings::get_all().await,
            Some(SettingsAction::Set { key, value }) => {
                commands::settings::set(&key, &value).await
            }
        },
    };

    if let Err(e) = result {
        eprintln!("Error: {:#}", e);
        std::process::exit(1);
    }
}
