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
  { holdings, summary, currency, rates, colorScheme, showAvgCost, showQuantity, showPnlAmount, showCurrentPrice, date, locale, logoDataUrls = {} },
  ref
) {
  const fc = createCurrencyFormatter(currency, rates);
  const gainColor = colorScheme === "cn" ? "#dc2626" : "#16a34a";
  const lossColor = colorScheme === "cn" ? "#16a34a" : "#dc2626";

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
        date={date}
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
      <div style={{ background: "linear-gradient(135deg, #1e293b 0%, #0f172a 100%)", padding: "24px 28px 20px" }}>
        <div style={{ color: "#94a3b8", fontSize: 12, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 8 }}>
          {totalReturnLabel}
        </div>
        <div style={{ color: returnColor, fontSize: 36, fontWeight: 700, lineHeight: 1 }}>
          {isGain ? "+" : ""}{formatPercent(totalReturnPct)}
        </div>
        <div style={{ color: returnColor, fontSize: 15, fontWeight: 600, marginTop: 6, opacity: 0.9 }}>
          {isGain ? "+" : "-"}{fc(Math.abs(totalReturn))}
        </div>
      </div>

      {/* Holdings list */}
      <div style={{ background: "#ffffff", padding: "8px 0" }}>
        {holdings.map((h) => {
          const isHoldingGain = h.unrealizedPnL >= 0;
          const hColor = isHoldingGain ? gainColor : lossColor;
          return (
            <div key={h.symbol} style={{ padding: "12px 28px", borderBottom: "1px solid #f1f5f9" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <LogoCircle symbol={h.symbol} assetType={h.assetType} size={32} fontSize={11} dataUrl={logoDataUrls[h.symbol]} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "#0f172a" }}>{h.symbol}</div>
                  {h.name && <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{h.name}</div>}
                </div>
                <div style={{ textAlign: "right", flexShrink: 0 }}>
                  <div style={{ color: hColor, fontSize: 14, fontWeight: 700 }}>
                    {isHoldingGain ? "+" : ""}{formatPercent(h.unrealizedPnLPercent)}
                  </div>
                  {showPnlAmount && (
                    <div style={{ color: hColor, fontSize: 12, opacity: 0.85, marginTop: 1 }}>
                      {isHoldingGain ? "+" : "-"}{fc(Math.abs(h.unrealizedPnL))}
                    </div>
                  )}
                </div>
              </div>
              {(showAvgCost || showQuantity) && (
                <div style={{ display: "flex", gap: 16, marginTop: 8 }}>
                  {showAvgCost && h.avgCost > 0 && (
                    <div style={{ fontSize: 11, color: "#64748b" }}>
                      <span style={{ color: "#94a3b8" }}>{avgCostLabel} </span>{fc(h.avgCost)}
                    </div>
                  )}
                  {showQuantity && h.quantity > 0 && (
                    <div style={{ fontSize: 11, color: "#64748b" }}>
                      <span style={{ color: "#94a3b8" }}>{qtyLabel} </span>
                      {h.quantity % 1 === 0 ? h.quantity.toLocaleString() : h.quantity.toPrecision(6)}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <Footer date={date} />
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
  date: string;
  locale: Locale;
  logoDataUrl?: string;
}

const SingleAssetCard = forwardRef<HTMLDivElement, SingleAssetCardProps>(function SingleAssetCard(
  { holding: h, fc, gainColor, lossColor, showPnlAmount, showAvgCost, showCurrentPrice, date, locale, logoDataUrl },
  ref
) {
  const isGain = h.unrealizedPnL >= 0;
  const color = isGain ? gainColor : lossColor;
  const showDetails = showAvgCost || showCurrentPrice;
  const avgLabel = locale === "zh" ? "买入价" : "Avg Cost";
  const priceLabel = locale === "zh" ? "当前价" : "Price";

  return (
    <div ref={ref} style={cardWrap}>
      {/* Header */}
      <div style={{ background: "linear-gradient(135deg, #1e293b 0%, #0f172a 100%)", padding: "24px 28px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <LogoCircle symbol={h.symbol} assetType={h.assetType} size={48} fontSize={15} dataUrl={logoDataUrl} />
          <div>
            <div style={{ color: "#ffffff", fontSize: 20, fontWeight: 700, lineHeight: 1.2 }}>{h.symbol}</div>
            {h.name && <div style={{ color: "#94a3b8", fontSize: 13, marginTop: 4 }}>{h.name}</div>}
          </div>
        </div>
      </div>

      {/* Body */}
      <div style={{ background: "#ffffff", padding: "28px 28px 24px" }}>
        <div style={{ color: color, fontSize: 52, fontWeight: 800, lineHeight: 1, letterSpacing: "-1px" }}>
          {isGain ? "+" : ""}{formatPercent(h.unrealizedPnLPercent)}
        </div>
        {showPnlAmount && (
          <div style={{ color: color, fontSize: 18, fontWeight: 600, marginTop: 8, opacity: 0.9 }}>
            {isGain ? "+" : "-"}{fc(Math.abs(h.unrealizedPnL))}
          </div>
        )}
        {showDetails && (
          <div style={{ display: "flex", gap: 32, marginTop: 20, paddingTop: 20, borderTop: "1px solid #f1f5f9" }}>
            {showAvgCost && h.avgCost > 0 && (
              <div>
                <div style={{ color: "#94a3b8", fontSize: 11, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 4 }}>{avgLabel}</div>
                <div style={{ color: "#0f172a", fontSize: 16, fontWeight: 700 }}>{fc(h.avgCost)}</div>
              </div>
            )}
            {showCurrentPrice && h.currentPrice > 0 && (
              <div>
                <div style={{ color: "#94a3b8", fontSize: 11, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 4 }}>{priceLabel}</div>
                <div style={{ color: "#0f172a", fontSize: 16, fontWeight: 700 }}>{fc(h.currentPrice)}</div>
              </div>
            )}
          </div>
        )}
      </div>

      <Footer date={date} />
    </div>
  );
});

// ── Shared sub-components ────────────────────────────────────

function LogoCircle({ symbol, assetType, size, fontSize, dataUrl }: {
  symbol: string; assetType: string; size: number; fontSize: number; dataUrl?: string;
}) {
  const radius = Math.round(size * 0.25);
  const bg = assetType === "crypto"
    ? "linear-gradient(135deg, #a855f7, #ec4899)"
    : "linear-gradient(135deg, #3b82f6, #06b6d4)";

  if (dataUrl) {
    return (
      <div style={{ width: size, height: size, borderRadius: radius, overflow: "hidden", background: "#f8fafc", flexShrink: 0 }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={dataUrl} alt={symbol} style={{ width: "100%", height: "100%", objectFit: "contain", padding: 2 }} />
      </div>
    );
  }

  return (
    <div style={{ width: size, height: size, borderRadius: radius, background: bg, color: "white", fontSize, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
      {symbol.slice(0, 2)}
    </div>
  );
}

function Footer({ date }: { date: string }) {
  return (
    <div style={{ background: "#f8fafc", padding: "14px 20px", display: "flex", alignItems: "center", gap: 14, borderTop: "1px solid #e2e8f0" }}>
      {/* QR code */}
      <div style={{ flexShrink: 0, background: "#ffffff", padding: 3, borderRadius: 6 }}>
        <QRCodeSVG value={SITE_URL} size={48} marginSize={0} />
      </div>
      {/* Site info */}
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: "#1e293b" }}>{SITE_NAME}</div>
        <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 2 }}>{SITE_HOST}</div>
      </div>
      {/* Date */}
      <div style={{ fontSize: 11, color: "#94a3b8", flexShrink: 0 }}>{date}</div>
    </div>
  );
}

const cardWrap: React.CSSProperties = {
  width: 480,
  fontFamily: "system-ui, -apple-system, sans-serif",
  background: "#ffffff",
  borderRadius: 16,
  overflow: "hidden",
  boxShadow: "0 4px 24px rgba(0,0,0,0.12)",
};
