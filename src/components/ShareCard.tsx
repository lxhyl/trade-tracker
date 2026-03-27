"use client";

import { forwardRef } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Holding, PortfolioSummary } from "@/lib/calculations";
import { SupportedCurrency, ExchangeRates } from "@/lib/currency";
import { ColorScheme } from "@/actions/settings";
import { Locale } from "@/lib/i18n";
import { createCurrencyFormatter, formatPercent } from "@/lib/utils";

export const SITE_URL = "https://tt.ozlab.xyz";
export const SITE_HOST = "tt.ozlab.xyz";
export const SITE_NAME = "TradeTracker";
export const FONT_SANS = "'DM Sans', system-ui, -apple-system, sans-serif";
export const FONT_NUM = "'JetBrains Mono', 'Fira Mono', monospace";
export const FONT_SKETCHY = "'Patrick Hand', cursive";
export const FONT_SKETCHY_HEADING = "'Caveat', cursive";

// ── Sketch palette ────────────────────────────────────────────
export const SKETCH_PAPER = "#faf6ed";
const SKETCH_BORDER = "#c8b894";
const SKETCH_INK = "#3b2f1e";
const SKETCH_MUTED = "#8b7e6a";
const SKETCH_CHART_BG = "#f4ede0";
const SKETCH_DIVIDER_COLOR = "rgba(200, 184, 148, 0.6)";
const SKETCH_ROW_BORDER = "rgba(200, 184, 148, 0.45)";

export const CARD_W = 480;
const CHART_H = 200;
const φ = 0.618; // golden ratio

export function getCardBase(isSketch?: boolean): React.CSSProperties {
  if (isSketch) {
    return {
      width: CARD_W,
      fontFamily: FONT_SKETCHY,
      overflow: "hidden",
      backgroundColor: SKETCH_PAPER,
      border: `2.5px solid ${SKETCH_BORDER}`,
      borderRadius: "4px 12px 8px 14px",
      boxShadow: `3px 4px 0 #d4c9ad`,
    };
  }
  return {
    width: CARD_W,
    fontFamily: FONT_SANS,
    background: "#ffffff",
    overflow: "hidden",
    boxShadow: "0 2px 16px rgba(0,0,0,0.08)",
  };
}

export interface PricePoint { t: number; p: number }

interface ShareCardProps {
  holdings: Holding[];
  summary: PortfolioSummary;
  currency: SupportedCurrency;
  rates: ExchangeRates;
  colorScheme: ColorScheme;
  isSketch?: boolean;
  // legacy props kept for multi-asset compat
  showAvgCost?: boolean;
  showQuantity?: boolean;
  showPnlAmount?: boolean;
  showCurrentPrice?: boolean;
  date: string;
  locale: Locale;
  logoDataUrls?: Record<string, string>;
  priceHistory?: PricePoint[];  // for single-asset chart
  loading?: boolean;
}

export const ShareCard = forwardRef<HTMLDivElement, ShareCardProps>(function ShareCard(
  { holdings, summary, currency, rates, colorScheme, isSketch, locale, logoDataUrls = {}, priceHistory = [], loading = false },
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
        isSketch={isSketch}
        locale={locale}
        logoDataUrl={logoDataUrls[holdings[0].symbol]}
        priceHistory={priceHistory}
        loading={loading}
      />
    );
  }

  // ── Multi-asset ──────────────────────────────────────────
  const isGain = summary.totalPnL >= 0;
  const returnColor = isGain ? gainColor : lossColor;
  const totalReturnLabel = locale === "zh" ? "总收益" : "Total Return";
  const sk = !!isSketch;
  const f = sk ? FONT_SKETCHY : FONT_SANS;
  const nf = sk ? FONT_SKETCHY : FONT_NUM;

  return (
    <div ref={ref} style={getCardBase(isSketch)}>
      <div style={{ padding: "20px 24px 16px" }}>
        <div style={{ color: sk ? SKETCH_MUTED : "#94a3b8", fontSize: sk ? 14 : 11, fontWeight: 600, letterSpacing: sk ? "0.01em" : "0.1em", textTransform: sk ? "none" : "uppercase", fontFamily: sk ? FONT_SKETCHY_HEADING : FONT_SANS, marginBottom: 8 }}>
          {totalReturnLabel}
        </div>
        <div style={{ color: returnColor, fontSize: 48, fontWeight: 700, lineHeight: 1, fontFamily: nf, letterSpacing: "-1px" }}>
          {isGain ? "+" : ""}{formatPercent(summary.totalPnLPercent)}
        </div>
      </div>
      {sk ? <SquiggleLine /> : <div style={{ height: 1, background: "#f1f5f9", margin: "0 24px" }} />}
      <div>
        {holdings.map((h, i) => {
          const hGain = h.unrealizedPnL >= 0;
          const hColor = hGain ? gainColor : lossColor;
          return (
            <div key={h.symbol} style={{ padding: "12px 24px", borderBottom: i < holdings.length - 1 ? `1px solid ${sk ? SKETCH_ROW_BORDER : "#f8fafc"}` : "none", display: "flex", alignItems: "center", gap: 10 }}>
              <LogoCircle symbol={h.symbol} assetType={h.assetType} size={32} dataUrl={logoDataUrls[h.symbol]} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: sk ? SKETCH_INK : "#0f172a", fontFamily: f }}>{h.symbol}</div>
                {h.name && <div style={{ fontSize: 11, color: sk ? SKETCH_MUTED : "#94a3b8", fontFamily: f, marginTop: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{h.name}</div>}
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ color: hColor, fontSize: 17, fontWeight: 700, fontFamily: nf }}>{hGain ? "+" : ""}{formatPercent(h.unrealizedPnLPercent)}</div>
              </div>
            </div>
          );
        })}
      </div>
      <Footer isSketch={isSketch} />
    </div>
  );
});

// ── Single asset card ────────────────────────────────────────

interface SingleAssetCardProps {
  holding: Holding;
  fc: (v: number) => string;
  gainColor: string;
  lossColor: string;
  isSketch?: boolean;
  locale: Locale;
  logoDataUrl?: string;
  priceHistory: PricePoint[];
  loading?: boolean;
}

const SingleAssetCard = forwardRef<HTMLDivElement, SingleAssetCardProps>(function SingleAssetCard(
  { holding: h, fc, gainColor, lossColor, isSketch, locale, logoDataUrl, priceHistory, loading = false },
  ref
) {
  const isGain = h.unrealizedPnL >= 0;
  const color = isGain ? gainColor : lossColor;
  const sk = !!isSketch;
  const f = sk ? FONT_SKETCHY : FONT_SANS;
  const nf = sk ? FONT_SKETCHY : FONT_NUM;
  const chartBg = sk ? SKETCH_CHART_BG : "#fafafa";
  const overlayRgba = sk ? "250,246,237" : "250,250,250";

  return (
    <div ref={ref} style={getCardBase(isSketch)}>
      {/* Asset identity */}
      <div style={{ padding: "20px 24px 12px", display: "flex", alignItems: "center", gap: 14 }}>
        <LogoCircle symbol={h.symbol} assetType={h.assetType} size={44} dataUrl={logoDataUrl} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ color: sk ? SKETCH_INK : "#0f172a", fontSize: sk ? 20 : 17, fontWeight: 700, fontFamily: sk ? FONT_SKETCHY_HEADING : FONT_SANS, letterSpacing: "-0.2px" }}>{h.symbol}</div>
          {h.name && <div style={{ color: sk ? SKETCH_MUTED : "#94a3b8", fontSize: 12, fontFamily: f, marginTop: 3 }}>{h.name}</div>}
        </div>
      </div>

      {sk && <SquiggleLine />}

      {/* Chart area */}
      <div style={{ position: "relative", height: CHART_H, background: chartBg, overflow: "hidden", ...(sk ? { margin: "0 16px", borderRadius: 6, border: `1.5px solid ${SKETCH_ROW_BORDER}` } : {}) }}>
        <div style={{ position: "absolute", inset: 0, zIndex: 1, background: `linear-gradient(to top, rgba(${overlayRgba},0.72) 20%, transparent 100%)` }} />
        <Sparkline
          priceHistory={priceHistory}
          avgCost={h.avgCost}
          firstBuyDate={h.firstBuyDate}
          currentPrice={h.currentPrice}
          fc={fc}
          color={color}
          width={sk ? CARD_W - 35 : CARD_W}
          height={CHART_H}
          symbol={h.symbol}
          locale={locale}
          isSketch={sk}
        />

        {loading && (
          <div style={{
            position: "absolute", inset: 0, zIndex: 2,
            background: `rgba(${overlayRgba},0.85)`,
            backdropFilter: "blur(3px)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <SpinnerIcon />
          </div>
        )}

        {/* P&L % */}
        <div style={{ position: "absolute", bottom: 18, left: sk ? 16 : 24, zIndex: 3 }}>
          <div style={{ color, fontSize: sk ? 56 : 64, fontWeight: 700, lineHeight: 1, fontFamily: sk ? FONT_SKETCHY_HEADING : nf, letterSpacing: "-2px" }}>
            {isGain ? "+" : ""}{formatPercent(h.unrealizedPnLPercent)}
          </div>
        </div>
      </div>

      <div style={{ height: sk ? 8 : 0 }} />
      <Footer isSketch={isSketch} />
    </div>
  );
});

// ── Sparkline ────────────────────────────────────────────────

function Sparkline({ priceHistory, avgCost, firstBuyDate, currentPrice, fc, color, width, height, symbol, locale: _locale, isSketch }: {
  priceHistory: PricePoint[]; avgCost: number; firstBuyDate: Date; currentPrice: number;
  fc: (v: number) => string; color: string; width: number; height: number; symbol: string; locale: Locale; isSketch?: boolean;
}) {
  const clean = priceHistory.filter(p => p.p > 0 && isFinite(p.p));
  if (clean.length < 3) {
    return (
      <svg width={width} height={height} style={{ position: "absolute", inset: 0 }}>
        <rect width={width} height={height} fill={color} fillOpacity="0.04" />
      </svg>
    );
  }

  const prices = clean.map(p => p.p);
  const dataMin = Math.min(...prices);
  const dataMax = Math.max(...prices);
  const pad = 0.04;
  let chartMin = dataMin * (1 - pad);
  let chartMax = (avgCost - φ * chartMin) / (1 - φ);
  if (chartMax < dataMax * (1 + pad)) {
    chartMax = dataMax * (1 + pad);
    chartMin = Math.max(0, avgCost - (1 - φ) * (chartMax - avgCost) / φ);
  }

  const range = chartMax - chartMin || 1;
  const xPadL = 12;
  const xPadR = 72;
  const toX = (i: number) => xPadL + (i / (clean.length - 1)) * (width - xPadL - xPadR);
  const toY = (p: number) => ((chartMax - p) / range) * height;

  const buyTs = firstBuyDate instanceof Date ? firstBuyDate.getTime() : new Date(firstBuyDate).getTime();
  const firstTs = clean[0].t;
  const lastTs = clean[clean.length - 1].t;
  let buyIdx: number;
  if (buyTs <= firstTs) {
    buyIdx = 0;
  } else if (buyTs >= lastTs) {
    buyIdx = clean.length - 1;
  } else {
    buyIdx = clean.reduce((best, pt, i) =>
      Math.abs(pt.t - buyTs) < Math.abs(clean[best].t - buyTs) ? i : best, 0
    );
  }

  const buyY = toY(avgCost);

  let markerX = toX(buyIdx);
  let bestDist = Infinity;
  for (let i = 0; i < clean.length - 1; i++) {
    const p1 = clean[i].p;
    const p2 = clean[i + 1].p;
    if ((p1 - avgCost) * (p2 - avgCost) <= 0) {
      const t = p2 === p1 ? 0 : (avgCost - p1) / (p2 - p1);
      const crossX = toX(i) + t * (toX(i + 1) - toX(i));
      const dist = Math.abs(i + t - buyIdx);
      if (dist < bestDist) { bestDist = dist; markerX = crossX; }
    }
  }

  const lastIdx = clean.length - 1;
  const lastX = toX(lastIdx);
  const lastPrice = clean[lastIdx].p;
  const lastY = toY(lastPrice);

  const pts = clean.map((p, i) => `${toX(i).toFixed(1)},${toY(p.p).toFixed(1)}`);
  const linePath = `M ${pts.join(" L ")}`;
  const areaPath = `M ${toX(0).toFixed(1)},${height} L ${pts.join(" L ")} L ${lastX.toFixed(1)},${height} Z`;
  const gradId = `sg_${symbol.replace(/[^a-z0-9]/gi, "")}`;

  const avgText = fc(avgCost);
  const curText = lastPrice > 0 ? fc(lastPrice) : null;
  const fs = 11;
  const labelFont = isSketch ? FONT_SKETCHY : FONT_NUM;
  const labelBg = isSketch ? SKETCH_CHART_BG : "white";
  const strokeW = isSketch ? 2.5 : 1.5;

  const curLabelX = lastX + 8;
  const curLabelAnchor = "start";

  return (
    <svg width={width} height={height} style={{ position: "absolute", inset: 0, display: "block" }}>
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={isSketch ? 0.15 : 0.25} />
          <stop offset="100%" stopColor={color} stopOpacity={isSketch ? 0.08 : 0.18} />
        </linearGradient>
      </defs>

      {/* Area + line */}
      <path d={areaPath} fill={`url(#${gradId})`} />
      <path d={linePath} fill="none" stroke={color} strokeWidth={strokeW} strokeLinejoin="round" strokeLinecap="round" />

      {/* Avg cost dashed horizontal line */}
      <line x1="0" y1={buyY.toFixed(1)} x2={width} y2={buyY.toFixed(1)}
        stroke={isSketch ? SKETCH_MUTED : "#64748b"} strokeWidth="1" strokeDasharray={isSketch ? "6,5" : "5,4"} strokeOpacity="0.6" />

      {/* Buy marker */}
      <line
        x1={markerX.toFixed(1)} y1={(height - 14).toFixed(1)}
        x2={markerX.toFixed(1)} y2={buyY.toFixed(1)}
        stroke={isSketch ? SKETCH_MUTED : "#94a3b8"} strokeWidth="1" strokeDasharray="2,3" strokeOpacity="0.5"
      />
      <circle cx={markerX.toFixed(1)} cy={buyY.toFixed(1)} r={isSketch ? 4 : 3} fill={isSketch ? SKETCH_MUTED : "#64748b"} fillOpacity="0.85" />
      {(() => {
        const labelW = avgText.length * 7 + 10;
        const rawLx = markerX - labelW / 2;
        const lx = Math.max(2, Math.min(rawLx, width - labelW - 2));
        const ly = buyY - 20;
        return (
          <>
            <rect x={lx.toFixed(1)} y={ly.toFixed(1)} width={labelW} height={15}
              rx="3" fill={labelBg} fillOpacity="0.88" />
            <text
              x={(lx + labelW / 2).toFixed(1)} y={(ly + 11).toFixed(1)}
              textAnchor="middle" dominantBaseline="auto"
              fill={isSketch ? SKETCH_INK : "#475569"} fontSize={fs} fontFamily={labelFont} fontWeight="600"
            >{avgText}</text>
          </>
        );
      })()}
      <polygon
        points={`${markerX},${height - 20} ${markerX - 5},${height - 12} ${markerX + 5},${height - 12}`}
        fill={isSketch ? SKETCH_MUTED : "#64748b"} fillOpacity="0.8"
      />

      {curText && (
        <>
          <circle cx={lastX.toFixed(1)} cy={lastY.toFixed(1)} r={isSketch ? 4.5 : 3.5} fill={color} />
          <text
            x={curLabelX.toFixed(1)} y={lastY.toFixed(1)}
            textAnchor={curLabelAnchor} dominantBaseline="central"
            fill={color} fontSize={fs} fontFamily={labelFont} fontWeight="700"
          >{curText}</text>
        </>
      )}
    </svg>
  );
}

// ── Shared ────────────────────────────────────────────────────

export function LogoCircle({ symbol, assetType, size, dataUrl }: {
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

// ── Squiggly hand-drawn divider ───────────────────────────────

export function SquiggleLine({ color = SKETCH_BORDER, pad = 24, width: w }: { color?: string; pad?: number; width?: number }) {
  const inner = (w ?? CARD_W) - pad * 2;
  const step = 20;
  const segs = Math.ceil(inner / step);
  let d = "M 0 4";
  for (let i = 0; i < segs; i++) {
    const cx = i * step + step / 2;
    const cy = i % 2 === 0 ? 1 : 7;
    const ex = Math.min((i + 1) * step, inner);
    d += ` Q ${cx} ${cy} ${ex} 4`;
  }
  return (
    <div style={{ padding: `4px ${pad}px` }}>
      <svg width={inner} height="8" style={{ display: "block", overflow: "visible" }}>
        <path d={d} stroke={color} strokeWidth="1.5" fill="none" strokeLinecap="round" />
      </svg>
    </div>
  );
}

export function Footer({ isSketch }: { isSketch?: boolean }) {
  const sk = !!isSketch;
  return (
    <div style={{ padding: "12px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", borderTop: sk ? `2px dashed ${SKETCH_BORDER}` : "1px solid #f1f5f9", background: "transparent" }}>
      <div style={{ background: sk ? SKETCH_PAPER : "#ffffff", padding: 3, borderRadius: 4, border: `1px solid ${sk ? SKETCH_BORDER : "#e2e8f0"}`, lineHeight: 0, flexShrink: 0 }}>
        <QRCodeSVG value={SITE_URL} size={40} marginSize={0} fgColor={sk ? SKETCH_INK : "#0f172a"} />
      </div>
      <div style={{ textAlign: "right" }}>
        <div style={{ fontSize: sk ? 15 : 13, fontWeight: 700, color: sk ? SKETCH_INK : "#0f172a", fontFamily: sk ? FONT_SKETCHY_HEADING : FONT_SANS }}>{SITE_NAME}</div>
        <div style={{ fontSize: sk ? 12 : 11, color: sk ? SKETCH_MUTED : "#94a3b8", marginTop: 2, fontFamily: sk ? FONT_SKETCHY : FONT_SANS }}>{SITE_HOST}</div>
      </div>
    </div>
  );
}

export const cardBase: React.CSSProperties = getCardBase(false);

// Inline spinner
function SpinnerIcon() {
  return (
    <>
      <style>{`@keyframes _tt_spin{to{transform:rotate(360deg)}}`}</style>
      <svg
        width="22" height="22" viewBox="0 0 24 24" fill="none"
        stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
        style={{ animation: "_tt_spin 1s linear infinite" }}
      >
        <path d="M21 12a9 9 0 1 1-6.219-8.56" />
      </svg>
    </>
  );
}
