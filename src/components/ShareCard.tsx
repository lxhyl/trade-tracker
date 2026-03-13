"use client";

import { forwardRef } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Holding, PortfolioSummary } from "@/lib/calculations";
import { SupportedCurrency, ExchangeRates } from "@/lib/currency";
import { ColorScheme } from "@/actions/settings";
import { Locale } from "@/lib/i18n";
import { createCurrencyFormatter, formatPercent } from "@/lib/utils";

const SITE_URL = "https://trade.ozlab.xyz";
const SITE_HOST = "trade.ozlab.xyz";
const SITE_NAME = "TradeTracker";

const FONT_SANS = "'DM Sans', system-ui, -apple-system, sans-serif";
const FONT_NUM = "'JetBrains Mono', 'Fira Mono', monospace";

interface ShareCardProps {
  holdings: Holding[];
  summary: PortfolioSummary;
  currency: SupportedCurrency;
  rates: ExchangeRates;
  colorScheme: ColorScheme;
  showAvgCost: boolean;
  showQuantity: boolean;
  showPnlAmount: boolean;
  showCurrentPrice: boolean;
  date: string;
  locale: Locale;
  logoDataUrls?: Record<string, string>;
}

export const ShareCard = forwardRef<HTMLDivElement, ShareCardProps>(function ShareCard(
  { holdings, summary, currency, rates, colorScheme, showAvgCost, showQuantity, showPnlAmount, showCurrentPrice, locale, logoDataUrls = {} },
  ref
) {
  const fc = createCurrencyFormatter(currency, rates);
  const gainColor = colorScheme === "cn" ? "#e53e3e" : "#059669";
  const lossColor = colorScheme === "cn" ? "#059669" : "#e53e3e";

  if (holdings.length === 1) {
    return (
      <SingleAssetCard
        ref={ref}
        holding={holdings[0]}
        fc={fc}
        gainColor={gainColor}
        lossColor={lossColor}
        showPnlAmount={showPnlAmount}
        showAvgCost={showAvgCost}
        showCurrentPrice={showCurrentPrice}
        locale={locale}
        logoDataUrl={logoDataUrls[holdings[0].symbol]}
      />
    );
  }

  // ── Multi-asset card ─────────────────────────────────────
  const isGain = summary.totalPnL >= 0;
  const returnColor = isGain ? gainColor : lossColor;
  const totalReturnLabel = locale === "zh" ? "总收益" : "Total Return";
  const avgCostLabel = locale === "zh" ? "均价" : "Avg";
  const qtyLabel = locale === "zh" ? "持仓" : "Qty";

  return (
    <div ref={ref} style={cardBase}>

      {/* Header: summary */}
      <div style={{ padding: "20px 24px 16px" }}>
        <div style={{ color: "#94a3b8", fontSize: 11, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", fontFamily: FONT_SANS, marginBottom: 8 }}>
          {totalReturnLabel}
        </div>
        <div style={{ color: returnColor, fontSize: 40, fontWeight: 700, lineHeight: 1, fontFamily: FONT_NUM, letterSpacing: "-1px" }}>
          {isGain ? "+" : ""}{formatPercent(summary.totalPnLPercent)}
        </div>
        {showPnlAmount && (
          <div style={{ color: returnColor, fontSize: 14, fontWeight: 500, marginTop: 6, fontFamily: FONT_NUM, opacity: 0.85 }}>
            {isGain ? "+" : "-"}{fc(Math.abs(summary.totalPnL))}
          </div>
        )}
      </div>

      <div style={{ height: 1, background: "#f1f5f9", margin: "0 24px" }} />

      {/* Holdings */}
      <div>
        {holdings.map((h, i) => {
          const hGain = h.unrealizedPnL >= 0;
          const hColor = hGain ? gainColor : lossColor;
          return (
            <div key={h.symbol} style={{ padding: "12px 24px", borderBottom: i < holdings.length - 1 ? "1px solid #f8fafc" : "none" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <LogoCircle symbol={h.symbol} assetType={h.assetType} size={32} dataUrl={logoDataUrls[h.symbol]} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#0f172a", fontFamily: FONT_SANS }}>{h.symbol}</div>
                  {h.name && <div style={{ fontSize: 11, color: "#94a3b8", fontFamily: FONT_SANS, marginTop: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{h.name}</div>}
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ color: hColor, fontSize: 14, fontWeight: 700, fontFamily: FONT_NUM }}>
                    {hGain ? "+" : ""}{formatPercent(h.unrealizedPnLPercent)}
                  </div>
                  {showPnlAmount && (
                    <div style={{ color: hColor, fontSize: 11, fontFamily: FONT_NUM, marginTop: 2, opacity: 0.8 }}>
                      {hGain ? "+" : "-"}{fc(Math.abs(h.unrealizedPnL))}
                    </div>
                  )}
                </div>
              </div>
              {(showAvgCost || showQuantity) && (
                <div style={{ display: "flex", gap: 16, marginTop: 7, paddingLeft: 42 }}>
                  {showAvgCost && h.avgCost > 0 && (
                    <div style={{ fontSize: 11, fontFamily: FONT_SANS, color: "#64748b" }}>
                      <span style={{ color: "#94a3b8" }}>{avgCostLabel} </span>
                      <span style={{ fontFamily: FONT_NUM }}>{fc(h.avgCost)}</span>
                    </div>
                  )}
                  {showQuantity && h.quantity > 0 && (
                    <div style={{ fontSize: 11, fontFamily: FONT_SANS, color: "#64748b" }}>
                      <span style={{ color: "#94a3b8" }}>{qtyLabel} </span>
                      <span style={{ fontFamily: FONT_NUM }}>
                        {h.quantity % 1 === 0 ? h.quantity.toLocaleString() : h.quantity.toPrecision(6)}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <Footer />
    </div>
  );
});

// ── Single asset card ────────────────────────────────────────

interface SingleAssetCardProps {
  holding: Holding;
  fc: (v: number) => string;
  gainColor: string;
  lossColor: string;
  showPnlAmount: boolean;
  showAvgCost: boolean;
  showCurrentPrice: boolean;
  locale: Locale;
  logoDataUrl?: string;
}

const SingleAssetCard = forwardRef<HTMLDivElement, SingleAssetCardProps>(function SingleAssetCard(
  { holding: h, fc, gainColor, lossColor, showPnlAmount, showAvgCost, showCurrentPrice, locale, logoDataUrl },
  ref
) {
  const isGain = h.unrealizedPnL >= 0;
  const color = isGain ? gainColor : lossColor;
  const bgTint = isGain ? "rgba(5,150,105,0.04)" : "rgba(229,62,62,0.04)";
  const showDetails = showAvgCost || showCurrentPrice;
  const avgLabel = locale === "zh" ? "买入价" : "Avg Cost";
  const priceLabel = locale === "zh" ? "当前价" : "Price";

  return (
    <div ref={ref} style={{ ...cardBase, background: "#ffffff" }}>

      {/* Asset identity row */}
      <div style={{ padding: "20px 24px 18px", display: "flex", alignItems: "center", gap: 14 }}>
        <LogoCircle symbol={h.symbol} assetType={h.assetType} size={44} dataUrl={logoDataUrl} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ color: "#0f172a", fontSize: 17, fontWeight: 700, fontFamily: FONT_SANS, letterSpacing: "-0.2px" }}>{h.symbol}</div>
          {h.name && <div style={{ color: "#94a3b8", fontSize: 12, fontFamily: FONT_SANS, marginTop: 3 }}>{h.name}</div>}
        </div>
      </div>

      {/* P&L area — tinted bg */}
      <div style={{ background: bgTint, padding: "24px 24px 22px" }}>
        <div style={{ color: color, fontSize: 58, fontWeight: 700, lineHeight: 1, fontFamily: FONT_NUM, letterSpacing: "-2px" }}>
          {isGain ? "+" : ""}{formatPercent(h.unrealizedPnLPercent)}
        </div>
        {showPnlAmount && (
          <div style={{ color: color, fontSize: 16, fontWeight: 500, marginTop: 10, fontFamily: FONT_NUM, opacity: 0.85 }}>
            {isGain ? "+" : "-"}{fc(Math.abs(h.unrealizedPnL))}
          </div>
        )}
      </div>

      {/* Detail row */}
      {showDetails && (
        <div style={{ padding: "0 24px 20px", display: "flex", gap: 32 }}>
          {showAvgCost && h.avgCost > 0 && (
            <div>
              <div style={{ color: "#94a3b8", fontSize: 10, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", fontFamily: FONT_SANS, marginBottom: 4 }}>{avgLabel}</div>
              <div style={{ color: "#0f172a", fontSize: 15, fontWeight: 600, fontFamily: FONT_NUM }}>{fc(h.avgCost)}</div>
            </div>
          )}
          {showCurrentPrice && h.currentPrice > 0 && (
            <div>
              <div style={{ color: "#94a3b8", fontSize: 10, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", fontFamily: FONT_SANS, marginBottom: 4 }}>{priceLabel}</div>
              <div style={{ color: "#0f172a", fontSize: 15, fontWeight: 600, fontFamily: FONT_NUM }}>{fc(h.currentPrice)}</div>
            </div>
          )}
        </div>
      )}

      <Footer />
    </div>
  );
});

// ── Shared ────────────────────────────────────────────────────

function LogoCircle({ symbol, assetType, size, dataUrl }: {
  symbol: string; assetType: string; size: number; dataUrl?: string;
}) {
  const bg = assetType === "crypto"
    ? "linear-gradient(135deg, #7c3aed, #db2777)"
    : "linear-gradient(135deg, #2563eb, #0891b2)";
  const fontSize = size <= 32 ? 11 : 13;

  if (dataUrl) {
    return (
      <div style={{ width: size, height: size, borderRadius: 10, overflow: "hidden", background: "#f1f5f9", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={dataUrl} alt={symbol} style={{ width: "86%", height: "86%", objectFit: "contain" }} />
      </div>
    );
  }
  return (
    <div style={{ width: size, height: size, borderRadius: 10, background: bg, color: "white", fontSize, fontWeight: 700, fontFamily: FONT_SANS, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
      {symbol.slice(0, 2).toUpperCase()}
    </div>
  );
}

function Footer() {
  return (
    <div style={{ padding: "12px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", borderTop: "1px solid #f1f5f9" }}>
      <div style={{ background: "#ffffff", padding: 3, borderRadius: 4, border: "1px solid #e2e8f0", lineHeight: 0, flexShrink: 0 }}>
        <QRCodeSVG value={SITE_URL} size={40} marginSize={0} fgColor="#0f172a" />
      </div>
      <div style={{ textAlign: "right" }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: "#0f172a", fontFamily: FONT_SANS }}>{SITE_NAME}</div>
        <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 2, fontFamily: FONT_SANS }}>{SITE_HOST}</div>
      </div>
    </div>
  );
}

const cardBase: React.CSSProperties = {
  width: 480,
  fontFamily: FONT_SANS,
  background: "#ffffff",
  overflow: "hidden",
  boxShadow: "0 2px 16px rgba(0,0,0,0.08)",
};
