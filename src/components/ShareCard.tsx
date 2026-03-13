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

const CARD_W = 480;
const CHART_H = 200;
const φ = 0.618; // golden ratio

export interface PricePoint { t: number; p: number }

interface ShareCardProps {
  holdings: Holding[];
  summary: PortfolioSummary;
  currency: SupportedCurrency;
  rates: ExchangeRates;
  colorScheme: ColorScheme;
  // legacy props kept for multi-asset compat
  showAvgCost?: boolean;
  showQuantity?: boolean;
  showPnlAmount?: boolean;
  showCurrentPrice?: boolean;
  date: string;
  locale: Locale;
  logoDataUrls?: Record<string, string>;
  priceHistory?: PricePoint[];  // for single-asset chart
}

export const ShareCard = forwardRef<HTMLDivElement, ShareCardProps>(function ShareCard(
  { holdings, summary, currency, rates, colorScheme, locale, logoDataUrls = {}, priceHistory = [] },
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
        locale={locale}
        logoDataUrl={logoDataUrls[holdings[0].symbol]}
        priceHistory={priceHistory}
      />
    );
  }

  // ── Multi-asset ──────────────────────────────────────────
  const isGain = summary.totalPnL >= 0;
  const returnColor = isGain ? gainColor : lossColor;
  const totalReturnLabel = locale === "zh" ? "总收益" : "Total Return";

  return (
    <div ref={ref} style={cardBase}>
      <div style={{ padding: "20px 24px 16px" }}>
        <div style={{ color: "#94a3b8", fontSize: 11, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", fontFamily: FONT_SANS, marginBottom: 8 }}>
          {totalReturnLabel}
        </div>
        <div style={{ color: returnColor, fontSize: 40, fontWeight: 700, lineHeight: 1, fontFamily: FONT_NUM, letterSpacing: "-1px" }}>
          {isGain ? "+" : ""}{formatPercent(summary.totalPnLPercent)}
        </div>
      </div>
      <div style={{ height: 1, background: "#f1f5f9", margin: "0 24px" }} />
      <div>
        {holdings.map((h, i) => {
          const hGain = h.unrealizedPnL >= 0;
          const hColor = hGain ? gainColor : lossColor;
          return (
            <div key={h.symbol} style={{ padding: "12px 24px", borderBottom: i < holdings.length - 1 ? "1px solid #f8fafc" : "none", display: "flex", alignItems: "center", gap: 10 }}>
              <LogoCircle symbol={h.symbol} assetType={h.assetType} size={32} dataUrl={logoDataUrls[h.symbol]} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#0f172a", fontFamily: FONT_SANS }}>{h.symbol}</div>
                {h.name && <div style={{ fontSize: 11, color: "#94a3b8", fontFamily: FONT_SANS, marginTop: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{h.name}</div>}
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ color: hColor, fontSize: 14, fontWeight: 700, fontFamily: FONT_NUM }}>{hGain ? "+" : ""}{formatPercent(h.unrealizedPnLPercent)}</div>
              </div>
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
  locale: Locale;
  logoDataUrl?: string;
  priceHistory: PricePoint[];
}

const SingleAssetCard = forwardRef<HTMLDivElement, SingleAssetCardProps>(function SingleAssetCard(
  { holding: h, fc, gainColor, lossColor, locale, logoDataUrl, priceHistory },
  ref
) {
  const isGain = h.unrealizedPnL >= 0;
  const color = isGain ? gainColor : lossColor;

  return (
    <div ref={ref} style={cardBase}>
      {/* Asset identity */}
      <div style={{ padding: "20px 24px 16px", display: "flex", alignItems: "center", gap: 14, background: "#ffffff" }}>
        <LogoCircle symbol={h.symbol} assetType={h.assetType} size={44} dataUrl={logoDataUrl} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ color: "#0f172a", fontSize: 17, fontWeight: 700, fontFamily: FONT_SANS, letterSpacing: "-0.2px" }}>{h.symbol}</div>
          {h.name && <div style={{ color: "#94a3b8", fontSize: 12, fontFamily: FONT_SANS, marginTop: 3 }}>{h.name}</div>}
        </div>
      </div>

      {/* Chart + overlay */}
      <div style={{ position: "relative", height: CHART_H, background: "#fafafa", overflow: "hidden" }}>
        <Sparkline
          prices={priceHistory.map(p => p.p)}
          avgCost={h.avgCost}
          currentPrice={h.currentPrice}
          fc={fc}
          color={color}
          width={CARD_W}
          height={CHART_H}
          symbol={h.symbol}
          locale={locale}
        />

        {/* P&L % overlay at bottom-left */}
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(250,250,250,0.88) 30%, transparent 100%)" }} />
        <div style={{ position: "absolute", bottom: 18, left: 24 }}>
          <div style={{ color, fontSize: 52, fontWeight: 700, lineHeight: 1, fontFamily: FONT_NUM, letterSpacing: "-2px" }}>
            {isGain ? "+" : ""}{formatPercent(h.unrealizedPnLPercent)}
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
});

// ── Sparkline ────────────────────────────────────────────────

function Sparkline({ prices, avgCost, currentPrice, fc, color, width, height, symbol, locale }: {
  prices: number[]; avgCost: number; currentPrice: number; fc: (v: number) => string;
  color: string; width: number; height: number; symbol: string; locale: Locale;
}) {
  const clean = prices.filter(p => p > 0 && isFinite(p));
  if (clean.length < 3) {
    return (
      <svg width={width} height={height} style={{ position: "absolute", inset: 0 }}>
        <rect width={width} height={height} fill={color} fillOpacity="0.04" />
      </svg>
    );
  }

  const dataMin = Math.min(...clean);
  const dataMax = Math.max(...clean);
  const pad = 0.04;
  let chartMin = dataMin * (1 - pad);
  let chartMax = (avgCost - φ * chartMin) / (1 - φ);
  if (chartMax < dataMax * (1 + pad)) {
    chartMax = dataMax * (1 + pad);
    chartMin = Math.max(0, avgCost - (1 - φ) * (chartMax - avgCost) / φ);
  }

  const range = chartMax - chartMin || 1;
  const toX = (i: number) => (i / (clean.length - 1)) * width;
  const toY = (p: number) => ((chartMax - p) / range) * height;
  const avgY = toY(avgCost);
  const lastX = toX(clean.length - 1);
  const lastY = toY(clean[clean.length - 1]);

  const pts = clean.map((p, i) => `${toX(i).toFixed(1)},${toY(p).toFixed(1)}`);
  const linePath = `M ${pts.join(" L ")}`;
  const areaPath = `M ${toX(0).toFixed(1)},${height} L ${pts.join(" L ")} L ${lastX.toFixed(1)},${height} Z`;
  const gradId = `sg_${symbol.replace(/[^a-z0-9]/gi, "")}`;

  const avgText = fc(avgCost);
  const curText = currentPrice > 0 ? fc(currentPrice) : null;

  // Label padding from right edge
  const labelPad = 8;
  const fontSize = 11;

  return (
    <svg width={width} height={height} style={{ position: "absolute", inset: 0, display: "block" }}>
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.20" />
          <stop offset="100%" stopColor={color} stopOpacity="0.02" />
        </linearGradient>
      </defs>

      {/* Area fill */}
      <path d={areaPath} fill={`url(#${gradId})`} />
      {/* Price line */}
      <path d={linePath} fill="none" stroke={color} strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" />

      {/* Avg cost dashed line */}
      <line x1="0" y1={avgY.toFixed(1)} x2={width} y2={avgY.toFixed(1)}
        stroke="#94a3b8" strokeWidth="1" strokeDasharray="5,4" strokeOpacity="0.6" />
      {/* Avg cost value — right-aligned on the line, above it */}
      <text
        x={width - labelPad} y={(avgY - 5).toFixed(1)}
        textAnchor="end"
        fill="#64748b"
        fontSize={fontSize}
        fontFamily={FONT_NUM}
        fontWeight="500"
      >{avgText}</text>

      {/* Current price dot at end of line */}
      {curText && (
        <>
          <circle cx={lastX.toFixed(1)} cy={lastY.toFixed(1)} r="3" fill={color} />
          {/* Current price value — right of dot, avoid edge */}
          <text
            x={Math.min(lastX + 7, width - labelPad)} y={(lastY + fontSize / 3).toFixed(1)}
            textAnchor={lastX + 7 + 60 > width ? "end" : "start"}
            fill={color}
            fontSize={fontSize}
            fontFamily={FONT_NUM}
            fontWeight="600"
          >{curText}</text>
        </>
      )}
    </svg>
  );
}

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
    <div style={{ padding: "12px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", borderTop: "1px solid #f1f5f9", background: "#ffffff" }}>
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
  width: CARD_W,
  fontFamily: FONT_SANS,
  background: "#ffffff",
  overflow: "hidden",
  boxShadow: "0 2px 16px rgba(0,0,0,0.08)",
};
