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

// Fonts matching the app
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
  const gainColor = colorScheme === "cn" ? "#dc2626" : "#059669";
  const lossColor = colorScheme === "cn" ? "#059669" : "#dc2626";

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
  const totalReturn = summary.totalPnL;
  const totalReturnPct = summary.totalPnLPercent;
  const isGain = totalReturn >= 0;
  const returnColor = isGain ? gainColor : lossColor;
  const totalReturnLabel = locale === "zh" ? "总收益" : "Total Return";
  const avgCostLabel = locale === "zh" ? "均价" : "Avg";
  const qtyLabel = locale === "zh" ? "持仓" : "Qty";

  return (
    <div ref={ref} style={cardWrap}>
      {/* Header */}
      <div style={{ background: "linear-gradient(160deg, #0f172a 0%, #1e293b 100%)", padding: "22px 24px 18px" }}>
        <div style={{ color: "#64748b", fontSize: 10, fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", fontFamily: FONT_SANS, marginBottom: 10 }}>
          {totalReturnLabel}
        </div>
        <div style={{ color: returnColor, fontSize: 38, fontWeight: 700, lineHeight: 1, fontFamily: FONT_NUM, letterSpacing: "-0.5px" }}>
          {isGain ? "+" : ""}{formatPercent(totalReturnPct)}
        </div>
        {showPnlAmount && (
          <div style={{ color: returnColor, fontSize: 14, fontWeight: 500, marginTop: 6, fontFamily: FONT_NUM, opacity: 0.85 }}>
            {isGain ? "+" : "-"}{fc(Math.abs(totalReturn))}
          </div>
        )}
      </div>

      {/* Holdings */}
      <div style={{ background: "#ffffff" }}>
        {holdings.map((h, i) => {
          const isHoldingGain = h.unrealizedPnL >= 0;
          const hColor = isHoldingGain ? gainColor : lossColor;
          const isLast = i === holdings.length - 1;
          return (
            <div key={h.symbol} style={{ padding: "13px 24px", borderBottom: isLast ? "none" : "1px solid #f1f5f9" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <LogoCircle symbol={h.symbol} assetType={h.assetType} size={34} fontSize={11} dataUrl={logoDataUrls[h.symbol]} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#0f172a", fontFamily: FONT_SANS }}>{h.symbol}</div>
                  {h.name && <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontFamily: FONT_SANS }}>{h.name}</div>}
                </div>
                <div style={{ textAlign: "right", flexShrink: 0 }}>
                  <div style={{ color: hColor, fontSize: 14, fontWeight: 700, fontFamily: FONT_NUM }}>
                    {isHoldingGain ? "+" : ""}{formatPercent(h.unrealizedPnLPercent)}
                  </div>
                  {showPnlAmount && (
                    <div style={{ color: hColor, fontSize: 11, opacity: 0.8, marginTop: 2, fontFamily: FONT_NUM }}>
                      {isHoldingGain ? "+" : "-"}{fc(Math.abs(h.unrealizedPnL))}
                    </div>
                  )}
                </div>
              </div>
              {(showAvgCost || showQuantity) && (
                <div style={{ display: "flex", gap: 14, marginTop: 7, paddingLeft: 44 }}>
                  {showAvgCost && h.avgCost > 0 && (
                    <div style={{ fontSize: 11, color: "#64748b", fontFamily: FONT_SANS }}>
                      <span style={{ color: "#94a3b8" }}>{avgCostLabel} </span>
                      <span style={{ fontFamily: FONT_NUM }}>{fc(h.avgCost)}</span>
                    </div>
                  )}
                  {showQuantity && h.quantity > 0 && (
                    <div style={{ fontSize: 11, color: "#64748b", fontFamily: FONT_SANS }}>
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
  const showDetails = showAvgCost || showCurrentPrice;
  const avgLabel = locale === "zh" ? "买入价" : "Avg Cost";
  const priceLabel = locale === "zh" ? "当前价" : "Price";

  return (
    <div ref={ref} style={cardWrap}>
      {/* Header: logo + name on dark bg */}
      <div style={{ background: "linear-gradient(160deg, #0f172a 0%, #1e293b 100%)", padding: "24px 28px 20px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <LogoCircle symbol={h.symbol} assetType={h.assetType} size={44} fontSize={14} dataUrl={logoDataUrl} />
          <div>
            <div style={{ color: "#f8fafc", fontSize: 18, fontWeight: 700, lineHeight: 1.2, fontFamily: FONT_SANS, letterSpacing: "-0.2px" }}>{h.symbol}</div>
            {h.name && <div style={{ color: "#64748b", fontSize: 12, marginTop: 4, fontFamily: FONT_SANS }}>{h.name}</div>}
          </div>
        </div>
      </div>

      {/* Body */}
      <div style={{ background: "#ffffff", padding: "28px 28px 24px" }}>
        {/* Hero P&L % */}
        <div style={{ color: color, fontSize: 56, fontWeight: 700, lineHeight: 1, fontFamily: FONT_NUM, letterSpacing: "-2px" }}>
          {isGain ? "+" : ""}{formatPercent(h.unrealizedPnLPercent)}
        </div>

        {/* P&L amount */}
        {showPnlAmount && (
          <div style={{ color: color, fontSize: 17, fontWeight: 500, marginTop: 10, fontFamily: FONT_NUM, opacity: 0.9 }}>
            {isGain ? "+" : "-"}{fc(Math.abs(h.unrealizedPnL))}
          </div>
        )}

        {/* Detail row */}
        {showDetails && (
          <div style={{ display: "flex", gap: 28, marginTop: 22, paddingTop: 18, borderTop: "1px solid #f1f5f9" }}>
            {showAvgCost && h.avgCost > 0 && (
              <div>
                <div style={{ color: "#94a3b8", fontSize: 10, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", fontFamily: FONT_SANS, marginBottom: 5 }}>{avgLabel}</div>
                <div style={{ color: "#0f172a", fontSize: 15, fontWeight: 600, fontFamily: FONT_NUM }}>{fc(h.avgCost)}</div>
              </div>
            )}
            {showCurrentPrice && h.currentPrice > 0 && (
              <div>
                <div style={{ color: "#94a3b8", fontSize: 10, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", fontFamily: FONT_SANS, marginBottom: 5 }}>{priceLabel}</div>
                <div style={{ color: "#0f172a", fontSize: 15, fontWeight: 600, fontFamily: FONT_NUM }}>{fc(h.currentPrice)}</div>
              </div>
            )}
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
});

// ── Shared sub-components ────────────────────────────────────

function LogoCircle({ symbol, assetType, size, fontSize, dataUrl }: {
  symbol: string; assetType: string; size: number; fontSize: number; dataUrl?: string;
}) {
  const radius = Math.round(size * 0.22);
  const bg = assetType === "crypto"
    ? "linear-gradient(135deg, #7c3aed, #db2777)"
    : "linear-gradient(135deg, #2563eb, #0891b2)";

  if (dataUrl) {
    return (
      <div style={{ width: size, height: size, borderRadius: radius, overflow: "hidden", background: "#f8fafc", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={dataUrl} alt={symbol} style={{ width: "88%", height: "88%", objectFit: "contain" }} />
      </div>
    );
  }

  return (
    <div style={{ width: size, height: size, borderRadius: radius, background: bg, color: "white", fontSize, fontWeight: 700, fontFamily: FONT_SANS, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, letterSpacing: "0.02em" }}>
      {symbol.slice(0, 2).toUpperCase()}
    </div>
  );
}

function Footer() {
  return (
    <div style={{ background: "#f8fafc", padding: "12px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", borderTop: "1px solid #e2e8f0" }}>
      {/* QR code — left */}
      <div style={{ flexShrink: 0, background: "#ffffff", padding: 4, borderRadius: 6, lineHeight: 0 }}>
        <QRCodeSVG value={SITE_URL} size={44} marginSize={0} fgColor="#0f172a" />
      </div>
      {/* Branding — right */}
      <div style={{ textAlign: "right" }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: "#0f172a", fontFamily: FONT_SANS, letterSpacing: "-0.2px" }}>{SITE_NAME}</div>
        <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 2, fontFamily: FONT_SANS }}>{SITE_HOST}</div>
      </div>
    </div>
  );
}

const cardWrap: React.CSSProperties = {
  width: 480,
  fontFamily: FONT_SANS,
  background: "#ffffff",
  borderRadius: 0,
  overflow: "hidden",
  boxShadow: "0 8px 32px rgba(0,0,0,0.10), 0 1px 4px rgba(0,0,0,0.06)",
};
