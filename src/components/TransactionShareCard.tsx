"use client";

import { forwardRef } from "react";
import { QRCodeSVG } from "qrcode.react";
import { SupportedCurrency, ExchangeRates, toUsd } from "@/lib/currency";
import { ColorScheme } from "@/actions/settings";
import { Locale } from "@/lib/i18n";
import { createCurrencyFormatter, formatNumber } from "@/lib/utils";
import {
  FONT_SANS,
  FONT_NUM,
  CARD_W,
  SITE_URL,
  SITE_HOST,
  SITE_NAME,
  cardBase,
  LogoCircle,
} from "@/components/ShareCard";

export interface TxShareData {
  symbol: string;
  name: string | null;
  assetType: string;
  tradeType: string;
  quantity: string;
  price: string;
  totalAmount: string;
  currency: string;
  date: Date;
  realizedPnl: string | null;
  currentPrice?: number;   // market price for buy txns
  avgCost?: number;         // avg cost basis for sell txns
}

interface TransactionShareCardProps {
  tx: TxShareData;
  currency: SupportedCurrency;
  rates: ExchangeRates;
  colorScheme: ColorScheme;
  locale: Locale;
  logoDataUrl?: string;
}

export const TransactionShareCard = forwardRef<HTMLDivElement, TransactionShareCardProps>(
  function TransactionShareCard({ tx, currency, rates, colorScheme, locale, logoDataUrl }, ref) {
    const fc = createCurrencyFormatter(currency, rates);
    const isBuy = tx.tradeType === "buy";

    const gainColor = colorScheme === "cn" ? "#e53e3e" : "#059669";
    const lossColor = colorScheme === "cn" ? "#059669" : "#e53e3e";
    const actionColor = isBuy
      ? (colorScheme === "cn" ? "#e53e3e" : "#059669")
      : (colorScheme === "cn" ? "#059669" : "#e53e3e");

    const priceUsd = toUsd(parseFloat(tx.price), tx.currency, rates);
    const totalUsd = toUsd(parseFloat(tx.totalAmount), tx.currency, rates);
    const qty = parseFloat(tx.quantity);
    const dateStr = tx.date instanceof Date
      ? tx.date.toISOString().split("T")[0]
      : String(tx.date).split("T")[0];

    const actionLabel = isBuy
      ? (locale === "zh" ? "买入" : "BUY")
      : (locale === "zh" ? "卖出" : "SELL");

    // For buy: show unrealized P&L if current price is available
    const hasCurrentPrice = isBuy && tx.currentPrice != null && tx.currentPrice > 0;
    const unrealizedPnl = hasCurrentPrice ? (tx.currentPrice! - priceUsd) * qty : 0;
    const unrealizedPct = hasCurrentPrice && priceUsd > 0
      ? ((tx.currentPrice! - priceUsd) / priceUsd) * 100 : 0;

    // For sell: realized P&L
    const hasRealizedPnl = !isBuy && tx.realizedPnl != null;
    const realizedPnlUsd = hasRealizedPnl ? toUsd(parseFloat(tx.realizedPnl!), tx.currency, rates) : 0;
    const costBasis = totalUsd - realizedPnlUsd;
    const realizedPct = costBasis !== 0 ? (realizedPnlUsd / Math.abs(costBasis)) * 100 : 0;

    // Labels
    const L = {
      price: locale === "zh" ? "成交价" : "Price",
      qty: locale === "zh" ? "数量" : "Quantity",
      total: locale === "zh" ? "成交额" : "Total",
      date: locale === "zh" ? "日期" : "Date",
      current: locale === "zh" ? "现价" : "Current",
      avgCost: locale === "zh" ? "成本价" : "Avg Cost",
      unrealizedPnl: locale === "zh" ? "浮动盈亏" : "Unrealized P&L",
      realizedPnl: locale === "zh" ? "已实现盈亏" : "Realized P&L",
    };

    // Decide which P&L to show
    const showPnl = isBuy ? hasCurrentPrice : hasRealizedPnl;
    const pnlValue = isBuy ? unrealizedPnl : realizedPnlUsd;
    const pnlPct = isBuy ? unrealizedPct : realizedPct;
    const pnlLabel = isBuy ? L.unrealizedPnl : L.realizedPnl;
    const pnlColor = pnlValue >= 0 ? gainColor : lossColor;
    const pnlSign = pnlValue >= 0 ? "+" : "";

    return (
      <div ref={ref} style={cardBase}>
        {/* ── Header: Logo + Symbol + Action badge ── */}
        <div style={{ padding: "24px 28px 20px", display: "flex", alignItems: "center", gap: 14 }}>
          <LogoCircle symbol={tx.symbol} assetType={tx.assetType} size={48} dataUrl={logoDataUrl} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ color: "#0f172a", fontSize: 20, fontWeight: 700, fontFamily: FONT_SANS, letterSpacing: "-0.3px" }}>
                {tx.symbol}
              </span>
              <span style={{
                display: "inline-flex", alignItems: "center", gap: 5,
                background: `${actionColor}12`, border: `1px solid ${actionColor}25`,
                borderRadius: 6, padding: "2px 10px",
                color: actionColor, fontSize: 11, fontWeight: 700, fontFamily: FONT_SANS,
                letterSpacing: "0.05em",
              }}>
                <span style={{ width: 5, height: 5, borderRadius: 3, background: actionColor }} />
                {actionLabel}
              </span>
            </div>
            {tx.name && (
              <div style={{ color: "#94a3b8", fontSize: 12, fontFamily: FONT_SANS, marginTop: 4, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {tx.name}
              </div>
            )}
          </div>
        </div>

        {/* ── Main price display ── */}
        <div style={{ padding: "0 28px 20px" }}>
          <div style={{ color: "#64748b", fontSize: 11, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", fontFamily: FONT_SANS, marginBottom: 6 }}>
            {L.price}
          </div>
          <div style={{ color: "#0f172a", fontSize: 36, fontWeight: 700, fontFamily: FONT_NUM, letterSpacing: "-1px", lineHeight: 1.1 }}>
            {fc(priceUsd)}
          </div>
          <div style={{ color: "#94a3b8", fontSize: 12, fontFamily: FONT_SANS, marginTop: 6 }}>
            {dateStr}
          </div>
        </div>

        {/* ── Detail rows ── */}
        <div style={{ margin: "0 28px", borderTop: "1px solid #f1f5f9" }}>
          <DetailRow label={L.qty} value={formatNumber(qty, 8)} />
          <DetailRow label={L.total} value={fc(totalUsd)} />
          {isBuy && hasCurrentPrice && (
            <DetailRow label={L.current} value={fc(tx.currentPrice!)} />
          )}
          {!isBuy && tx.avgCost != null && tx.avgCost > 0 && (
            <DetailRow label={L.avgCost} value={fc(tx.avgCost)} />
          )}
        </div>

        {/* ── P&L block ── */}
        {showPnl && (
          <div style={{ padding: "16px 28px 20px" }}>
            <div style={{
              background: `${pnlColor}08`,
              border: `1px solid ${pnlColor}18`,
              borderRadius: 12,
              padding: "16px 20px",
              display: "flex", alignItems: "center", justifyContent: "space-between",
            }}>
              <span style={{ color: "#64748b", fontSize: 12, fontWeight: 600, fontFamily: FONT_SANS }}>
                {pnlLabel}
              </span>
              <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
                <span style={{ color: pnlColor, fontSize: 22, fontWeight: 700, fontFamily: FONT_NUM, letterSpacing: "-0.5px" }}>
                  {pnlSign}{fc(Math.abs(pnlValue))}
                </span>
                <span style={{ color: pnlColor, fontSize: 13, fontWeight: 600, fontFamily: FONT_NUM, opacity: 0.8 }}>
                  {pnlSign}{pnlPct.toFixed(2)}%
                </span>
              </div>
            </div>
          </div>
        )}

        {/* ── Footer ── */}
        <div style={{ padding: "12px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", borderTop: "1px solid #f1f5f9", background: "#ffffff" }}>
          <div style={{ background: "#ffffff", padding: 3, borderRadius: 4, border: "1px solid #e2e8f0", lineHeight: 0, flexShrink: 0 }}>
            <QRCodeSVG value={SITE_URL} size={40} marginSize={0} fgColor="#0f172a" />
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#0f172a", fontFamily: FONT_SANS }}>{SITE_NAME}</div>
            <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 2, fontFamily: FONT_SANS }}>{SITE_HOST}</div>
          </div>
        </div>
      </div>
    );
  }
);

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{
      display: "flex", justifyContent: "space-between", alignItems: "center",
      padding: "11px 0",
      borderBottom: "1px solid #f8fafc",
    }}>
      <span style={{ color: "#94a3b8", fontSize: 13, fontFamily: FONT_SANS }}>{label}</span>
      <span style={{ color: "#334155", fontSize: 14, fontWeight: 600, fontFamily: FONT_NUM, letterSpacing: "-0.2px" }}>{value}</span>
    </div>
  );
}
