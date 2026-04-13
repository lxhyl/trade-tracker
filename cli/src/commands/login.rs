use anyhow::{Context, Result};
use axum::{extract::Query, response::Html, routing::get, Router};
use std::collections::HashMap;
use std::net::TcpListener;
use std::sync::Arc;
use tokio::sync::oneshot;

use crate::config::{save_config, Config};

pub async fn run(server_url: &str) -> Result<()> {
    // Bind to an ephemeral port on localhost
    let listener = TcpListener::bind("127.0.0.1:0")?;
    let port = listener.local_addr()?.port();

    let (tx, rx) = oneshot::channel::<String>();
    let tx = Arc::new(std::sync::Mutex::new(Some(tx)));

    let app = Router::new().route(
        "/callback",
        get(move |Query(params): Query<HashMap<String, String>>| async move {
            let token = params.get("token").cloned().unwrap_or_default();
            if token.is_empty() {
                return Html("<html><body><h2>Login failed</h2><p>No token received.</p></body></html>".to_string());
            }
            if let Some(tx) = tx.lock().unwrap().take() {
                let _ = tx.send(token);
            }
            Html("<html><body style=\"font-family:system-ui;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;background:#f8fafc\">\
                <div style=\"text-align:center\"><h2>Login successful!</h2><p style=\"color:#64748b\">You can close this tab and return to the terminal.</p></div>\
                </body></html>".to_string())
        }),
    );

    let login_url = format!("{}/cli/login?callback_port={}", server_url, port);
    println!("Opening browser for authentication...");
    println!("If the browser doesn't open, visit: {}", login_url);

    // Open the browser
    if let Err(e) = open::that(&login_url) {
        eprintln!("Failed to open browser: {}. Please open the URL manually.", e);
    }

    // Start axum server in a background task so the handler runs independently
    let tokio_listener = tokio::net::TcpListener::from_std(listener)?;
    let server_handle = tokio::spawn(async move {
        let _ = axum::serve(tokio_listener, app).await;
    });

    // Wait for the token from the callback handler (timeout 120s)
    let token = tokio::time::timeout(std::time::Duration::from_secs(120), rx)
        .await
        .context("Login timed out after 120 seconds. Please try again.")?
        .context("Login flow was interrupted")?;

    // Save the config
    let config = Config {
        token,
        server_url: server_url.to_string(),
    };
    save_config(&config)?;

    println!("Login successful! Token saved.");

    // Exit immediately — the spawned server task holds a TCP listener
    // that prevents the tokio runtime from shutting down cleanly.
    std::process::exit(0);
}
