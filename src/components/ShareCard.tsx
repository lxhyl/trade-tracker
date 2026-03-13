"use client";

import { forwardRef } from "react";
import { Holding, PortfolioSummary } from "@/lib/calculations";
import { SupportedCurrency, ExchangeRates } from "@/lib/currency";
import { ColorScheme } from "@/actions/settings";
import { Locale } from "@/lib/i18n";
import { createCurrencyFormatter, formatPercent } from "@/lib/utils";

interface ShareCardProps {
  holdings: Holding[];
  summary: PortfolioSummary;
  currency: SupportedCurrency;
  rates: ExchangeRates;
  colorScheme: ColorScheme;
  showAvgCost: boolean;
  showQuantity: boolean;
  date: string;
  locale: Locale;
}

export const ShareCard = forwardRef<HTMLDivElement, ShareCardProps>(function ShareCard(
  { holdings, summary, currency, rates, colorScheme, showAvgCost, showQuantity, date, locale },
  ref
) {
  const fc = createCurrencyFormatter(currency, rates);
  const gainColor = colorScheme === "cn" ? "#dc2626" : "#16a34a";
  const lossColor = colorScheme === "cn" ? "#16a34a" : "#dc2626";

  const totalReturn = summary.totalPnL;
  const totalReturnPct = summary.totalPnLPercent;
  const isGain = totalReturn >= 0;
  const returnColor = isGain ? gainColor : lossColor;

  const avgCostLabel = locale === "zh" ? "均价" : "Avg";
  const qtyLabel = locale === "zh" ? "持仓" : "Qty";
  const totalReturnLabel = locale === "zh" ? "总收益" : "Total Return";
  const footerLabel = "TradeTracker";

  return (
    <div
      ref={ref}
      style={{
        width: 480,
        fontFamily: "system-ui, -apple-system, sans-serif",
        background: "#ffffff",
        borderRadius: 16,
        overflow: "hidden",
        boxShadow: "0 4px 24px rgba(0,0,0,0.12)",
      }}
    >
      {/* Header */}
      <div
        style={{
          background: "linear-gradient(135deg, #1e293b 0%, #0f172a 100%)",
          padding: "24px 28px 20px",
        }}
      >
        <div style={{ color: "#94a3b8", fontSize: 12, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 8 }}>
          {totalReturnLabel}
        </div>
        <div style={{ display: "flex", alignItems: "baseline", gap: 12 }}>
          <div style={{ color: returnColor, fontSize: 36, fontWeight: 700, lineHeight: 1 }}>
            {isGain ? "+" : ""}{formatPercent(totalReturnPct)}
          </div>
        </div>
        <div style={{ color: returnColor, fontSize: 15, fontWeight: 600, marginTop: 6, opacity: 0.9 }}>
          {isGain ? "+" : "-"}{fc(Math.abs(totalReturn))}
        </div>
      </div>

      {/* Holdings List */}
      <div style={{ background: "#ffffff", padding: "8px 0" }}>
        {holdings.map((h) => {
          const isHoldingGain = h.unrealizedPnL >= 0;
          const holdingColor = isHoldingGain ? gainColor : lossColor;
          const barPct = Math.min(Math.abs(h.unrealizedPnLPercent), 100);

          return (
            <div
              key={h.symbol}
              style={{
                padding: "12px 28px",
                borderBottom: "1px solid #f1f5f9",
              }}
            >
              {/* Row 1: Logo + Name + P&L */}
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                {/* Logo */}
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 8,
                    background:
                      h.assetType === "crypto"
                        ? "linear-gradient(135deg, #a855f7, #ec4899)"
                        : "linear-gradient(135deg, #3b82f6, #06b6d4)",
                    color: "white",
                    fontSize: 11,
                    fontWeight: 700,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  {h.symbol.slice(0, 2)}
                </div>
                {/* Symbol & Name */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "#0f172a" }}>{h.symbol}</div>
                  {h.name && (
                    <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {h.name}
                    </div>
                  )}
                </div>
                {/* P&L amount */}
                <div style={{ textAlign: "right", flexShrink: 0 }}>
                  <div style={{ color: holdingColor, fontSize: 14, fontWeight: 700 }}>
                    {isHoldingGain ? "+" : "-"}{fc(Math.abs(h.unrealizedPnL))}
                  </div>
                  <div style={{ color: holdingColor, fontSize: 12, opacity: 0.85, marginTop: 1 }}>
                    {isHoldingGain ? "+" : ""}{formatPercent(h.unrealizedPnLPercent)}
                  </div>
                </div>
              </div>

              {/* Row 2: Avg cost / Qty (conditional) */}
              {(showAvgCost || showQuantity) && (
                <div style={{ display: "flex", gap: 16, marginBottom: 8 }}>
                  {showAvgCost && h.avgCost > 0 && (
                    <div style={{ fontSize: 11, color: "#64748b" }}>
                      <span style={{ color: "#94a3b8" }}>{avgCostLabel} </span>
                      {fc(h.avgCost)}
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

              {/* P&L bar */}
              <div style={{ width: "100%", background: "#f1f5f9", height: 4, borderRadius: 2, overflow: "hidden" }}>
                <div
                  style={{
                    width: `${barPct}%`,
                    height: "100%",
                    background: holdingColor,
                    borderRadius: 2,
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div
        style={{
          background: "#f8fafc",
          padding: "12px 28px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          borderTop: "1px solid #e2e8f0",
        }}
      >
        <div style={{ fontSize: 12, fontWeight: 700, color: "#475569", letterSpacing: "0.05em" }}>
          {footerLabel}
        </div>
        <div style={{ fontSize: 11, color: "#94a3b8" }}>{date}</div>
      </div>
    </div>
  );
});
