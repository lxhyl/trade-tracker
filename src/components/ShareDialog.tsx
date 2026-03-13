"use client";

import { useState, useRef } from "react";
import { Holding, PortfolioSummary, calculatePortfolioSummary } from "@/lib/calculations";
import { SupportedCurrency, ExchangeRates } from "@/lib/currency";
import { ColorScheme } from "@/actions/settings";
import { Locale } from "@/lib/i18n";
import { useI18n } from "@/components/I18nProvider";
import { ShareCard } from "@/components/ShareCard";
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
  const [step, setStep] = useState<"select" | "preview">("select");
  const [selectedSymbols, setSelectedSymbols] = useState<Set<string>>(
    () => new Set(initialSymbol ? [initialSymbol] : holdings.map((h) => h.symbol))
  );
  const [showAvgCost, setShowAvgCost] = useState(true);
  const [showQuantity, setShowQuantity] = useState(true);
  const [capturing, setCapturing] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  if (!open) return null;

  const toggleSymbol = (symbol: string) => {
    setSelectedSymbols((prev) => {
      const next = new Set(prev);
      if (next.has(symbol)) {
        next.delete(symbol);
      } else {
        next.add(symbol);
      }
      return next;
    });
  };

  const selectAll = () => setSelectedSymbols(new Set(holdings.map((h) => h.symbol)));
  const deselectAll = () => setSelectedSymbols(new Set());

  const selectedHoldings = holdings.filter((h) => selectedSymbols.has(h.symbol));
  const partialSummary = calculatePortfolioSummary(selectedHoldings, []);

  const today = new Date().toISOString().slice(0, 10);

  const handleDownload = async () => {
    if (!cardRef.current) return;
    setCapturing(true);
    try {
      const { toPng } = await import("html-to-image");
      const dataUrl = await toPng(cardRef.current, {
        pixelRatio: 2,
        backgroundColor: "#ffffff",
      });
      const a = document.createElement("a");
      a.download = `portfolio-${today}.png`;
      a.href = dataUrl;
      a.click();
    } catch {
      // silently ignore
    } finally {
      setCapturing(false);
    }
  };

  return (
    <div
      style={{ position: "fixed", inset: 0, zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center" }}
      onClick={(e) => { if (e.target === e.currentTarget) onOpenChange(false); }}
    >
      {/* Backdrop */}
      <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)" }} />

      {/* Panel */}
      <div
        className="relative bg-background rounded-xl shadow-2xl flex flex-col"
        style={{ width: "min(480px, 95vw)", maxHeight: "85vh", zIndex: 51 }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b">
          <h2 className="text-base font-semibold">{t("share.title")}</h2>
          <button
            className="text-muted-foreground hover:text-foreground transition-colors"
            onClick={() => onOpenChange(false)}
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {step === "select" ? (
          <>
            {/* Selection step body */}
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
              {/* Holdings checklist */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium text-muted-foreground">{t("share.selectHoldings")}</p>
                  <div className="flex gap-3 text-xs">
                    <button className="text-primary hover:underline" onClick={selectAll}>
                      {t("share.selectAll")}
                    </button>
                    <button className="text-primary hover:underline" onClick={deselectAll}>
                      {t("share.deselectAll")}
                    </button>
                  </div>
                </div>
                <div className="space-y-1 rounded-lg border overflow-hidden">
                  {holdings.map((h) => (
                    <label
                      key={h.symbol}
                      className="flex items-center gap-3 px-4 py-2.5 cursor-pointer hover:bg-muted/50 transition-colors"
                    >
                      <input
                        type="checkbox"
                        className="h-4 w-4 accent-primary"
                        checked={selectedSymbols.has(h.symbol)}
                        onChange={() => toggleSymbol(h.symbol)}
                      />
                      <div className="flex-1 min-w-0">
                        <span className="text-sm font-semibold">{h.symbol}</span>
                        {h.name && (
                          <span className="text-xs text-muted-foreground ml-2 truncate">{h.name}</span>
                        )}
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Toggle options */}
              <div className="flex gap-2">
                <button
                  className={`flex-1 rounded-md border px-3 py-2 text-sm font-medium transition-colors ${
                    showAvgCost
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-background text-muted-foreground hover:bg-muted"
                  }`}
                  onClick={() => setShowAvgCost((v) => !v)}
                >
                  {t("share.showAvgCost")}
                </button>
                <button
                  className={`flex-1 rounded-md border px-3 py-2 text-sm font-medium transition-colors ${
                    showQuantity
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-background text-muted-foreground hover:bg-muted"
                  }`}
                  onClick={() => setShowQuantity((v) => !v)}
                >
                  {t("share.showQuantity")}
                </button>
              </div>
            </div>

            {/* Footer */}
            <div className="px-5 py-4 border-t">
              <Button
                className="w-full gap-2"
                disabled={selectedSymbols.size === 0}
                onClick={() => setStep("preview")}
              >
                <Image className="h-4 w-4" />
                {t("share.preview")}
              </Button>
              {selectedSymbols.size === 0 && (
                <p className="text-xs text-muted-foreground text-center mt-2">{t("share.noSelection")}</p>
              )}
            </div>
          </>
        ) : (
          <>
            {/* Preview step body */}
            <div className="flex-1 overflow-auto p-4">
              <div className="bg-slate-100 rounded-xl p-4 overflow-x-auto flex justify-center">
                <ShareCard
                  ref={cardRef}
                  holdings={selectedHoldings}
                  summary={partialSummary}
                  currency={currency}
                  rates={rates}
                  colorScheme={colorScheme}
                  showAvgCost={showAvgCost}
                  showQuantity={showQuantity}
                  date={today}
                  locale={locale}
                />
              </div>
            </div>

            {/* Footer */}
            <div className="px-5 py-4 border-t flex gap-3">
              <Button variant="outline" onClick={() => setStep("select")} className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                {t("share.back")}
              </Button>
              <Button className="flex-1 gap-2" onClick={handleDownload} disabled={capturing}>
                <Download className="h-4 w-4" />
                {capturing ? t("share.generating") : t("share.downloadPng")}
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
