"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Holding, PortfolioSummary } from "@/lib/calculations";
import { createCurrencyFormatter, formatNumber, formatPercent } from "@/lib/utils";
import { SupportedCurrency, ExchangeRates } from "@/lib/currency";
import { TrendingUp, TrendingDown, Wallet, Zap, Loader2, Check, AlertCircle, Share2 } from "lucide-react";
import { useI18n } from "@/components/I18nProvider";
import { usePnLColors } from "@/components/ColorSchemeProvider";
import { AssetLogo } from "@/components/AssetLogo";
import { ColorScheme } from "@/actions/settings";
import { ShareDialog } from "@/components/ShareDialog";

interface HoldingsTableProps {
  holdings: Holding[];
  summary: PortfolioSummary;
  currency: SupportedCurrency;
  rates: ExchangeRates;
  colorScheme: ColorScheme;
  readOnly?: boolean;
}

type RefreshStatus = "idle" | "loading" | "success" | "error";

export function HoldingsTable({ holdings, summary, currency, rates, colorScheme, readOnly }: HoldingsTableProps) {
  const fc = createCurrencyFormatter(currency, rates);
  const c = usePnLColors();
  const [refreshStatus, setRefreshStatus] = useState<RefreshStatus>("idle");
  const [refreshInfo, setRefreshInfo] = useState("");
  const router = useRouter();
  const { t, tInterpolate, locale } = useI18n();

  const [cooldown, setCooldown] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [shareInitialSymbol, setShareInitialSymbol] = useState<string | null>(null);

  const handleRefreshAllPrices = useCallback(async () => {
    setRefreshStatus("loading");
    setRefreshInfo("");
    try {
      const res = await fetch("/api/prices");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to fetch prices");

      setRefreshStatus("success");
      setRefreshInfo(tInterpolate("holdings.updatedPrices", { count: data.updated }));
      router.refresh();

      setCooldown(true);
      setTimeout(() => setCooldown(false), 30000);

      setTimeout(() => {
        setRefreshStatus("idle");
        setRefreshInfo("");
      }, 3000);
    } catch {
      setRefreshStatus("error");
      setRefreshInfo(t("holdings.fetchFailed"));
      setTimeout(() => {
        setRefreshStatus("idle");
        setRefreshInfo("");
      }, 3000);
    }
  }, [router, t, tInterpolate]);

  return (
    <>
    <Card className="overflow-hidden">
      <CardHeader className="border-b bg-muted/30 px-4 md:px-6">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 md:gap-3 min-w-0">
            <div className="flex h-8 w-8 md:h-10 md:w-10 shrink-0 items-center justify-center rounded-md bg-muted text-primary">
              <Wallet className="h-4 w-4 md:h-5 md:w-5" />
            </div>
            <CardTitle className="text-base md:text-lg truncate">{t("holdings.title")}</CardTitle>
          </div>
          {holdings.length > 0 && !readOnly && (
            <div className="flex items-center gap-2 shrink-0">
              {refreshInfo && (
                <span className={`text-xs md:text-sm hidden sm:inline ${
                  refreshStatus === "success" ? "text-emerald-600" :
                  refreshStatus === "error" ? "text-red-600" : "text-muted-foreground"
                }`}>
                  {refreshStatus === "success" && <Check className="inline h-3.5 w-3.5 mr-1" />}
                  {refreshStatus === "error" && <AlertCircle className="inline h-3.5 w-3.5 mr-1" />}
                  {refreshInfo}
                </span>
              )}
              <Button
                size="sm"
                variant="outline"
                onClick={handleRefreshAllPrices}
                disabled={refreshStatus === "loading" || cooldown}
                className="gap-1.5 text-xs md:text-sm"
              >
                {refreshStatus === "loading" ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Zap className="h-3.5 w-3.5" />
                )}
                <span className="hidden sm:inline">{refreshStatus === "loading" ? t("holdings.fetching") : t("holdings.refreshPrices")}</span>
                <span className="sm:hidden">{refreshStatus === "loading" ? "..." : t("holdings.refresh")}</span>
              </Button>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {holdings.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <p className="text-base text-muted-foreground mb-1">
              {t("holdings.empty")}
            </p>
            <p className="text-sm text-muted-foreground/80">
              {t("holdings.emptyHint")}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="label-caps">{t("holdings.asset")}</TableHead>
                <TableHead className="label-caps text-right">{t("holdings.quantity")}</TableHead>
                <TableHead className="label-caps text-right">{t("holdings.avgCost")}</TableHead>
                <TableHead className="label-caps text-right">{t("holdings.currentPrice")}</TableHead>
                <TableHead className="label-caps text-right">{t("holdings.value")}</TableHead>
                <TableHead className="label-caps text-right">{t("holdings.pnl")}</TableHead>
                <TableHead className="w-16" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {holdings.map((h) => (
                <TableRow key={h.symbol}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <AssetLogo symbol={h.symbol} assetType={h.assetType} />
                      <div>
                        <div className="font-semibold">{h.symbol}</div>
                        {h.name && (
                          <div className="text-xs text-muted-foreground">
                            {h.name}
                          </div>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-medium font-num">
                    {h.quantity > 0 ? formatNumber(h.quantity, 8) : "-"}
                  </TableCell>
                  <TableCell className="text-right font-num">
                    {h.avgCost > 0 ? fc(h.avgCost) : "-"}
                  </TableCell>
                  <TableCell className="text-right font-medium font-num">
                    {h.currentPrice > 0 ? fc(h.currentPrice) : "-"}
                  </TableCell>
                  <TableCell className="text-right font-semibold font-num">
                    {h.currentValue > 0 ? fc(h.currentValue) : "-"}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className={`inline-flex items-center justify-end gap-1.5 text-sm font-semibold font-num whitespace-nowrap ${
                      h.unrealizedPnL >= 0 ? c.gainText : c.lossText
                    }`}>
                      {h.unrealizedPnL >= 0 ? (
                        <TrendingUp className="h-3.5 w-3.5" />
                      ) : (
                        <TrendingDown className="h-3.5 w-3.5" />
                      )}
                      <span>{h.unrealizedPnL >= 0 ? "+" : "-"}{fc(Math.abs(h.unrealizedPnL))}</span>
                      <span className="text-xs opacity-75">
                        ({h.unrealizedPnLPercent >= 0 ? "+" : ""}{formatPercent(h.unrealizedPnLPercent)})
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="pr-2">
                    <div className="flex items-center justify-end gap-0.5">
                      {!readOnly && (
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7 text-destructive/70 hover:text-destructive hover:bg-destructive/10"
                          onClick={() => router.push(`/transactions/new?symbol=${encodeURIComponent(h.symbol)}&tradeType=sell`)}
                          title={t("form.sell")}
                        >
                          <TrendingDown className="h-3.5 w-3.5" />
                        </Button>
                      )}
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7 text-muted-foreground hover:text-foreground"
                        onClick={() => {
                          setShareInitialSymbol(h.symbol);
                          setShareOpen(true);
                        }}
                      >
                        <Share2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          </div>
        )}
      </CardContent>
    </Card>

    <ShareDialog
      open={shareOpen}
      onOpenChange={setShareOpen}
      holdings={holdings}
      summary={summary}
      currency={currency}
      rates={rates}
      colorScheme={colorScheme}
      locale={locale}
      initialSymbol={shareInitialSymbol}
    />
    </>
  );
}
