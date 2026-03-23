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

// Minimal shape of a transaction row needed for the share card
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

    // Color convention (same as ShareCard)
    const gainColor = colorScheme === "cn" ? "#e53e3e" : "#059669";
    const lossColor = colorScheme === "cn" ? "#059669" : "#e53e3e";
    const buyColor = colorScheme === "cn" ? "#e53e3e" : "#059669";
    const sellColor = colorScheme === "cn" ? "#059669" : "#e53e3e";
    const actionColor = isBuy ? buyColor : sellColor;

    const priceUsd = toUsd(parseFloat(tx.price), tx.currency, rates);
    const totalUsd = toUsd(parseFloat(tx.totalAmount), tx.currency, rates);
    const qty = parseFloat(tx.quantity);
    const dateStr = tx.date instanceof Date
      ? tx.date.toISOString().split("T")[0]
      : String(tx.date).split("T")[0];

    const actionLabel = isBuy
      ? (locale === "zh" ? "买入" : "BUY")
      : (locale === "zh" ? "卖出" : "SELL");

    const priceLabel = locale === "zh" ? "价格" : "Price";
    const totalLabel = locale === "zh" ? "总额" : "Total";
    const qtyLabel = locale === "zh" ? "数量" : "Quantity";
    const dateLabel = locale === "zh" ? "日期" : "Date";
    const realizedPnlLabel = locale === "zh" ? "已实现盈亏" : "Realized P&L";

    const hasPnl = !isBuy && tx.realizedPnl !== null && tx.realizedPnl !== undefined;
    const pnlUsd = hasPnl ? toUsd(parseFloat(tx.realizedPnl!), tx.currency, rates) : 0;
    const pnlColor = pnlUsd >= 0 ? gainColor : lossColor;
    const pnlSign = pnlUsd >= 0 ? "+" : "";

    // P&L percentage relative to cost basis
    const costBasis = totalUsd - pnlUsd;
    const pnlPct = costBasis !== 0 ? (pnlUsd / Math.abs(costBasis)) * 100 : 0;

    return (
      <div ref={ref} style={cardBase}>
        {/* ── Header: Logo + Symbol + Name ── */}
        <div style={{ padding: "22px 24px 18px", display: "flex", alignItems: "center", gap: 14 }}>
          <LogoCircle symbol={tx.symbol} assetType={tx.assetType} size={44} dataUrl={logoDataUrl} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ color: "#0f172a", fontSize: 18, fontWeight: 700, fontFamily: FONT_SANS, letterSpacing: "-0.3px" }}>
              {tx.symbol}
            </div>
            {tx.name && (
              <div style={{ color: "#94a3b8", fontSize: 12, fontFamily: FONT_SANS, marginTop: 3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {tx.name}
              </div>
            )}
          </div>
        </div>

        <div style={{ height: 1, background: "#f1f5f9", margin: "0 24px" }} />

        {/* ── Action Label ── */}
        <div style={{ padding: "24px 24px 20px", textAlign: "center" }}>
          <div style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 10,
            background: `${actionColor}10`,
            border: `1.5px solid ${actionColor}30`,
            borderRadius: 12,
            padding: "8px 24px",
          }}>
            {/* Dot indicator */}
            <div style={{ width: 8, height: 8, borderRadius: 4, background: actionColor }} />
            <span style={{
              color: actionColor,
              fontSize: 22,
              fontWeight: 800,
              fontFamily: FONT_SANS,
              letterSpacing: "0.06em",
            }}>
              {actionLabel}
            </span>
          </div>
        </div>

        {/* ── Stats Grid ── */}
        <div style={{ padding: "0 24px 20px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <StatBox label={priceLabel} value={fc(priceUsd)} />
          <StatBox label={totalLabel} value={fc(totalUsd)} />
          <StatBox label={qtyLabel} value={formatNumber(qty, 8)} />
          <StatBox label={dateLabel} value={dateStr} isDate />
        </div>

        {/* ── Realized P&L (sell only) ── */}
        {hasPnl && (
          <div style={{ padding: "0 24px 24px" }}>
            <div style={{
              background: `${pnlColor}08`,
              border: `1px solid ${pnlColor}20`,
              borderRadius: 10,
              padding: "14px 18px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}>
              <span style={{ color: "#64748b", fontSize: 12, fontFamily: FONT_SANS, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em" }}>
                {realizedPnlLabel}
              </span>
              <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
                <span style={{ color: pnlColor, fontSize: 20, fontWeight: 700, fontFamily: FONT_NUM }}>
                  {pnlSign}{fc(pnlUsd)}
                </span>
                <span style={{ color: pnlColor, fontSize: 13, fontWeight: 600, fontFamily: FONT_NUM, opacity: 0.85 }}>
                  ({pnlSign}{pnlPct.toFixed(2)}%)
                </span>
              </div>
            </div>
          </div>
        )}

        <div style={{ height: 1, background: "#f1f5f9" }} />

        {/* ── Footer ── */}
        <div style={{ padding: "12px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", background: "#ffffff" }}>
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

// ── StatBox ────────────────────────────────────────────────────
function StatBox({ label, value, isDate }: { label: string; value: string; isDate?: boolean }) {
  return (
    <div style={{
      background: "#f8fafc",
      borderRadius: 10,
      padding: "12px 14px",
      border: "1px solid #f1f5f9",
    }}>
      <div style={{ color: "#94a3b8", fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", fontFamily: FONT_SANS, marginBottom: 6 }}>
        {label}
      </div>
      <div style={{
        color: "#0f172a",
        fontSize: isDate ? 14 : 16,
        fontWeight: 700,
        fontFamily: isDate ? FONT_SANS : FONT_NUM,
        letterSpacing: isDate ? "0" : "-0.3px",
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap",
      }}>
        {value}
      </div>
    </div>
  );
}
