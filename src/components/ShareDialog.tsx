"use client";

import { useState, useRef, useEffect } from "react";
import { Holding, PortfolioSummary, calculatePortfolioSummary } from "@/lib/calculations";
import { SupportedCurrency, ExchangeRates } from "@/lib/currency";
import { ColorScheme } from "@/actions/settings";
import { Locale } from "@/lib/i18n";
import { useI18n } from "@/components/I18nProvider";
import { ShareCard, PricePoint } from "@/components/ShareCard";
import { Button } from "@/components/ui/button";
import { X, Download, ArrowLeft, Image } from "lucide-react";

interface ShareDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  holdings: Holding[];
  summary: PortfolioSummary;
  currency: SupportedCurrency;
  rates: ExchangeRates;
  colorScheme: ColorScheme;
  locale: Locale;
  initialSymbol?: string | null;
}

export function ShareDialog({
  open,
  onOpenChange,
  holdings,
  currency,
  rates,
  colorScheme,
  locale,
  initialSymbol,
}: ShareDialogProps) {
  const { t } = useI18n();
  const isSingleMode = !!initialSymbol;

  const [step, setStep] = useState<"select" | "preview">("select");
  const [selectedSymbols, setSelectedSymbols] = useState<Set<string>>(
    () => new Set(initialSymbol ? [initialSymbol] : holdings.map((h) => h.symbol))
  );
  const [capturing, setCapturing] = useState(false);
  const [logoDataUrls, setLogoDataUrls] = useState<Record<string, string>>({});
  const [priceHistory, setPriceHistory] = useState<PricePoint[]>([]);
  const cardRef = useRef<HTMLDivElement>(null);

  // Pre-fetch logos + price history when dialog opens
  useEffect(() => {
    if (!open) return;
    const targets = isSingleMode
      ? holdings.filter((h) => h.symbol === initialSymbol)
      : holdings;
    let cancelled = false;

    (async () => {
      // Logos
      const urls: Record<string, string> = {};
      await Promise.all(
        targets.map(async (h) => {
          try {
            const res = await fetch(`/api/logo/${encodeURIComponent(h.symbol)}?type=${encodeURIComponent(h.assetType)}&proxy=1`);
            if (!res.ok) return;
            const blob = await res.blob();
            urls[h.symbol] = await new Promise<string>((resolve, reject) => {
              const reader = new FileReader();
              reader.onloadend = () => resolve(reader.result as string);
              reader.onerror = reject;
              reader.readAsDataURL(blob);
            });
          } catch { /* fallback to initials */ }
        })
      );
      if (!cancelled) setLogoDataUrls(urls);

      // Price history for single asset only
      if (isSingleMode && initialSymbol) {
        const h = holdings.find((h) => h.symbol === initialSymbol);
        if (h) {
          try {
            const res = await fetch(`/api/price-history/${encodeURIComponent(h.symbol)}?type=${encodeURIComponent(h.assetType)}`);
            if (res.ok) {
              const data = await res.json();
              if (!cancelled) setPriceHistory(data.prices ?? []);
            }
          } catch { /* no chart */ }
        }
      }
    })();

    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, initialSymbol]);

  if (!open) return null;

  const today = new Date().toISOString().slice(0, 10);

  const selectedHoldings = isSingleMode
    ? holdings.filter((h) => h.symbol === initialSymbol)
    : holdings.filter((h) => selectedSymbols.has(h.symbol));

  const partialSummary = calculatePortfolioSummary(selectedHoldings, []);
  const isIOS = typeof navigator !== "undefined" && /iPad|iPhone|iPod/.test(navigator.userAgent);

  const handleDownload = async () => {
    if (!cardRef.current) return;
    setCapturing(true);
    try {
      const { toPng } = await import("html-to-image");
      const dataUrl = await toPng(cardRef.current, { pixelRatio: 2, backgroundColor: "#ffffff" });
      if (isIOS) {
        const win = window.open();
        if (win) {
          win.document.write(`<img src="${dataUrl}" style="max-width:100%;display:block" /><p style="font-family:sans-serif;color:#64748b;font-size:14px;text-align:center;margin-top:12px">长按图片 → 存储到照片<br/>Long-press → Save to Photos</p>`);
          win.document.close();
        }
      } else {
        const a = document.createElement("a");
        a.download = `portfolio-${today}.png`;
        a.href = dataUrl;
        a.click();
      }
    } catch { /* ignore */ } finally {
      setCapturing(false);
    }
  };

  const cardPreview = (
    <div className="bg-slate-100 rounded-xl p-4 overflow-x-auto flex justify-center">
      <ShareCard
        ref={cardRef}
        holdings={selectedHoldings}
        summary={partialSummary}
        currency={currency}
        rates={rates}
        colorScheme={colorScheme}
        date={today}
        locale={locale}
        logoDataUrls={logoDataUrls}
        priceHistory={priceHistory}
      />
    </div>
  );

  const saveBtn = (
    <Button className="w-full gap-2" onClick={handleDownload} disabled={capturing}>
      <Download className="h-4 w-4" />
      {capturing ? t("share.generating") : isIOS ? t("share.openToSave") : t("share.downloadPng")}
    </Button>
  );

  return (
    <div
      style={{ position: "fixed", inset: 0, zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center" }}
      onClick={(e) => { if (e.target === e.currentTarget) onOpenChange(false); }}
    >
      <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)" }} />

      <div
        className="relative bg-background rounded-xl shadow-2xl flex flex-col"
        style={{ width: "min(520px, 95vw)", maxHeight: "90vh", zIndex: 51 }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b shrink-0">
          <h2 className="text-base font-semibold">{t("share.title")}</h2>
          <button className="text-muted-foreground hover:text-foreground transition-colors" onClick={() => onOpenChange(false)}>
            <X className="h-4 w-4" />
          </button>
        </div>

        {isSingleMode ? (
          // Single asset: direct preview + save
          <>
            <div className="flex-1 overflow-y-auto p-4">
              {cardPreview}
            </div>
            <div className="px-5 py-4 border-t shrink-0">
              {saveBtn}
            </div>
          </>
        ) : step === "select" ? (
          // Multi: select holdings
          <>
            <div className="flex-1 overflow-y-auto px-5 py-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-muted-foreground">{t("share.selectHoldings")}</p>
                <div className="flex gap-3 text-xs">
                  <button className="text-primary hover:underline" onClick={() => setSelectedSymbols(new Set(holdings.map(h => h.symbol)))}>{t("share.selectAll")}</button>
                  <button className="text-primary hover:underline" onClick={() => setSelectedSymbols(new Set())}>{t("share.deselectAll")}</button>
                </div>
              </div>
              <div className="space-y-1 rounded-lg border overflow-hidden">
                {holdings.map((h) => (
                  <label key={h.symbol} className="flex items-center gap-3 px-4 py-2.5 cursor-pointer hover:bg-muted/50 transition-colors">
                    <input
                      type="checkbox"
                      className="h-4 w-4 accent-primary"
                      checked={selectedSymbols.has(h.symbol)}
                      onChange={() => setSelectedSymbols(prev => {
                        const next = new Set(prev);
                        next.has(h.symbol) ? next.delete(h.symbol) : next.add(h.symbol);
                        return next;
                      })}
                    />
                    <div className="flex-1 min-w-0">
                      <span className="text-sm font-semibold">{h.symbol}</span>
                      {h.name && <span className="text-xs text-muted-foreground ml-2">{h.name}</span>}
                    </div>
                  </label>
                ))}
              </div>
            </div>
            <div className="px-5 py-4 border-t shrink-0">
              <Button className="w-full gap-2" disabled={selectedSymbols.size === 0} onClick={() => setStep("preview")}>
                <Image className="h-4 w-4" />
                {t("share.preview")}
              </Button>
            </div>
          </>
        ) : (
          // Multi: preview
          <>
            <div className="flex-1 overflow-auto p-4">{cardPreview}</div>
            <div className="px-5 py-4 border-t flex gap-3 shrink-0">
              <Button variant="outline" onClick={() => setStep("select")} className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                {t("share.back")}
              </Button>
              <div className="flex-1">{saveBtn}</div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
