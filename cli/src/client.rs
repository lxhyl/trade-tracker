use anyhow::{bail, Context, Result};
use reqwest::header::{AUTHORIZATION, CONTENT_TYPE};
use serde::de::DeserializeOwned;
use serde::Serialize;

use crate::config::load_config;

pub struct ApiClient {
    client: reqwest::Client,
    base_url: String,
    token: String,
}

#[derive(serde::Deserialize)]
struct ErrorResponse {
    error: String,
}

impl ApiClient {
    pub fn new() -> Result<Self> {
        let config = load_config()?;
        let client = reqwest::Client::new();
        Ok(Self {
            client,
            base_url: config.server_url.trim_end_matches('/').to_string(),
            token: config.token,
        })
    }

    fn url(&self, path: &str) -> String {
        format!("{}{}", self.base_url, path)
    }

    async fn handle_response<T: DeserializeOwned>(&self, resp: reqwest::Response) -> Result<T> {
        let status = resp.status();
        if status == reqwest::StatusCode::UNAUTHORIZED {
            bail!("Session expired. Run `tt login` to re-authenticate.");
        }
        if !status.is_success() {
            let body = resp.text().await.unwrap_or_default();
            if let Ok(err) = serde_json::from_str::<ErrorResponse>(&body) {
                bail!("Error: {}", err.error);
            }
            bail!("Request failed ({}): {}", status, body);
        }
        resp.json::<T>().await.context("Failed to parse response")
    }

    pub async fn get<T: DeserializeOwned>(&self, path: &str) -> Result<T> {
        let resp = self
            .client
            .get(self.url(path))
            .header(AUTHORIZATION, format!("Bearer {}", self.token))
            .send()
            .await
            .context("Failed to connect to server")?;
        self.handle_response(resp).await
    }

    pub async fn post<T: DeserializeOwned, B: Serialize>(&self, path: &str, body: &B) -> Result<T> {
        let resp = self
            .client
            .post(self.url(path))
            .header(AUTHORIZATION, format!("Bearer {}", self.token))
            .header(CONTENT_TYPE, "application/json")
            .json(body)
            .send()
            .await
            .context("Failed to connect to server")?;
        self.handle_response(resp).await
    }

    pub async fn put<T: DeserializeOwned, B: Serialize>(&self, path: &str, body: &B) -> Result<T> {
        let resp = self
            .client
            .put(self.url(path))
            .header(AUTHORIZATION, format!("Bearer {}", self.token))
            .header(CONTENT_TYPE, "application/json")
            .json(body)
            .send()
            .await
            .context("Failed to connect to server")?;
        self.handle_response(resp).await
    }

    pub async fn delete<T: DeserializeOwned>(&self, path: &str) -> Result<T> {
        let resp = self
            .client
            .delete(self.url(path))
            .header(AUTHORIZATION, format!("Bearer {}", self.token))
            .send()
            .await
            .context("Failed to connect to server")?;
        self.handle_response(resp).await
    }
}
