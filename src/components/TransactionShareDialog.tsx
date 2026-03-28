"use client";

import { useState, useRef, useEffect } from "react";
import { SupportedCurrency, ExchangeRates } from "@/lib/currency";
import { ColorScheme } from "@/actions/settings";
import { Locale } from "@/lib/i18n";
import { useI18n } from "@/components/I18nProvider";
import { useStyleTheme } from "@/components/StyleThemeProvider";
import { TransactionShareCard, TxShareData } from "@/components/TransactionShareCard";
import { useToast } from "@/components/Toast";
import { CARD_W, SKETCH_PAPER } from "@/components/ShareCard";
import { exportElementAsPng, isShareCancelledError, supportsNativeImageShare } from "@/lib/share-image";
import { Button } from "@/components/ui/button";
import { X, Download } from "lucide-react";

interface TransactionShareDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tx: TxShareData | null;
  currency: SupportedCurrency;
  rates: ExchangeRates;
  colorScheme: ColorScheme;
  locale: Locale;
}

export function TransactionShareDialog({
  open,
  onOpenChange,
  tx,
  currency,
  rates,
  colorScheme,
  locale,
}: TransactionShareDialogProps) {
  const { t } = useI18n();
  const { styleTheme } = useStyleTheme();
  const { toast } = useToast();
  const isSketch = styleTheme === "sketchy";
  const cardRef = useRef<HTMLDivElement>(null);
  const previewContainerRef = useRef<HTMLDivElement>(null);
  const [capturing, setCapturing] = useState(false);
  const [logoDataUrl, setLogoDataUrl] = useState<string | undefined>(undefined);
  const [loading, setLoading] = useState(false);
  const [cardScale, setCardScale] = useState(1);
  const [cardNaturalH, setCardNaturalH] = useState(0);
  const nativeShareSupported = supportsNativeImageShare();

  // Fetch logo when dialog opens
  useEffect(() => {
    if (!open || !tx) return;
    setLogoDataUrl(undefined);
    setLoading(true);
    let cancelled = false;

    (async () => {
      try {
        const res = await fetch(`/api/logo/${encodeURIComponent(tx.symbol)}?type=${encodeURIComponent(tx.assetType)}&proxy=1`);
        if (res.ok && !cancelled) {
          const blob = await res.blob();
          const dataUrl = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
          });
          if (!cancelled) setLogoDataUrl(dataUrl);
        }
      } catch { /* fallback to initials */ }
      finally { if (!cancelled) setLoading(false); }
    })();

    return () => { cancelled = true; };
  }, [open, tx?.symbol, tx?.assetType]); // eslint-disable-line react-hooks/exhaustive-deps

  // Scale card to fit available width
  useEffect(() => {
    const container = previewContainerRef.current;
    if (!container) return;
    const update = () => {
      const available = container.clientWidth - 32;
      setCardScale(Math.min(1, available / CARD_W));
      if (cardRef.current) setCardNaturalH(cardRef.current.offsetHeight);
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(container);
    return () => ro.disconnect();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, logoDataUrl]);

  if (!open || !tx) return null;

  const today = new Date().toISOString().slice(0, 10);

  const handleDownload = async () => {
    if (!cardRef.current) return;
    setCapturing(true);
    try {
      const filename = `trade-${tx.symbol}-${today}.png`;
      const result = await exportElementAsPng({
        element: cardRef.current,
        filename,
        backgroundColor: isSketch ? SKETCH_PAPER : "#ffffff",
        skipFonts: true,
      });
      toast(t(result === "shared" ? "share.completed" : "share.downloadStarted"), "success");
    } catch (err) {
      if (isShareCancelledError(err)) {
        toast(t("share.cancelled"), "info");
      } else {
        console.error(err);
        toast(t("share.exportFailed"), "error");
      }
    } finally {
      setCapturing(false);
    }
  };

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
          <h2 className="text-base font-semibold">{t("share.transactionTitle")}</h2>
          <button className="text-muted-foreground hover:text-foreground transition-colors" onClick={() => onOpenChange(false)}>
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Card preview */}
        <div className="flex-1 overflow-y-auto p-4">
          <div ref={previewContainerRef} className="bg-slate-100 rounded-xl p-4">
            <div style={{
              width: CARD_W * cardScale,
              height: cardNaturalH ? cardNaturalH * cardScale : undefined,
              margin: "0 auto",
              overflow: "hidden",
            }}>
              <div style={{ transform: `scale(${cardScale})`, transformOrigin: "top left", width: CARD_W }}>
                <TransactionShareCard
                  ref={cardRef}
                  tx={tx}
                  currency={currency}
                  rates={rates}
                  colorScheme={colorScheme}
                  isSketch={isSketch}
                  locale={locale}
                  logoDataUrl={loading ? undefined : logoDataUrl}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Save button */}
        <div className="px-5 py-4 border-t shrink-0">
          <div>
            <Button className="w-full gap-2" onClick={handleDownload} disabled={capturing || loading}>
              <Download className="h-4 w-4" />
              {capturing ? t("share.generating") : t("share.downloadPng")}
            </Button>
            {nativeShareSupported && (
              <p className="mt-2 text-xs text-muted-foreground text-center">
                {t("share.nativeHint")}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
