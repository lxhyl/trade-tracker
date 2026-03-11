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
import { Holding } from "@/lib/calculations";
import { createCurrencyFormatter, formatNumber, formatPercent } from "@/lib/utils";
import { SupportedCurrency, ExchangeRates } from "@/lib/currency";
import { TrendingUp, TrendingDown, Wallet, Zap, Loader2, Check, AlertCircle } from "lucide-react";
import { useI18n } from "@/components/I18nProvider";
import { usePnLColors } from "@/components/ColorSchemeProvider";
import { AssetLogo } from "@/components/AssetLogo";

interface HoldingsTableProps {
  holdings: Holding[];
  currency: SupportedCurrency;
  rates: ExchangeRates;
  readOnly?: boolean;
}

type RefreshStatus = "idle" | "loading" | "success" | "error";

export function HoldingsTable({ holdings, currency, rates, readOnly }: HoldingsTableProps) {
  const fc = createCurrencyFormatter(currency, rates);
  const c = usePnLColors();
  const [refreshStatus, setRefreshStatus] = useState<RefreshStatus>("idle");
  const [refreshInfo, setRefreshInfo] = useState("");
  const router = useRouter();
  const { t, tInterpolate } = useI18n();

  const [cooldown, setCooldown] = useState(false);

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
    <Card className="overflow-hidden">
      <CardHeader className="border-b bg-muted/20 px-4 md:px-6">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 md:gap-3 min-w-0">
            <div className="flex h-8 w-8 md:h-10 md:w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-cyan-500 text-white">
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
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted mb-4">
              <Wallet className="h-8 w-8 text-muted-foreground" />
            </div>
            <p className="text-lg font-medium text-muted-foreground">
              {t("holdings.empty")}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              {t("holdings.emptyHint")}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent border-b-2">
                <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground/70">{t("holdings.asset")}</TableHead>
                <TableHead className="text-right text-xs font-semibold uppercase tracking-wide text-muted-foreground/70">{t("holdings.quantity")}</TableHead>
                <TableHead className="text-right text-xs font-semibold uppercase tracking-wide text-muted-foreground/70">{t("holdings.avgCost")}</TableHead>
                <TableHead className="text-right text-xs font-semibold uppercase tracking-wide text-muted-foreground/70">{t("holdings.currentPrice")}</TableHead>
                <TableHead className="text-right text-xs font-semibold uppercase tracking-wide text-muted-foreground/70">{t("holdings.value")}</TableHead>
                <TableHead className="text-right text-xs font-semibold uppercase tracking-wide text-muted-foreground/70">{t("holdings.pnl")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {holdings.map((h, idx) => (
                <TableRow key={h.symbol} className={`transition-colors hover:bg-muted/40 ${idx % 2 === 1 ? "bg-muted/10" : ""}`}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <AssetLogo symbol={h.symbol} assetType={h.assetType} />
                      <div>
                        <div className="font-semibold tracking-tight">{h.symbol}</div>
                        {h.name && (
                          <div className="text-xs text-muted-foreground max-w-[120px] truncate">
                            {h.name}
                          </div>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-medium font-num text-sm">
                    {h.quantity > 0 ? formatNumber(h.quantity, 8) : <span className="text-muted-foreground/40">—</span>}
                  </TableCell>
                  <TableCell className="text-right font-num text-sm text-muted-foreground">
                    {h.avgCost > 0 ? fc(h.avgCost) : <span className="text-muted-foreground/40">—</span>}
                  </TableCell>
                  <TableCell className="text-right font-medium font-num text-sm">
                    {h.currentPrice > 0 ? fc(h.currentPrice) : <span className="text-muted-foreground/40">—</span>}
                  </TableCell>
                  <TableCell className="text-right font-semibold font-num">
                    {h.currentValue > 0 ? fc(h.currentValue) : <span className="text-muted-foreground/40">—</span>}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className={`inline-flex flex-col items-end gap-0.5`}>
                      <div className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold font-num whitespace-nowrap ${
                        h.unrealizedPnL >= 0 ? c.gainPill : c.lossPill
                      }`}>
                        {h.unrealizedPnL >= 0 ? (
                          <TrendingUp className="h-3 w-3" />
                        ) : (
                          <TrendingDown className="h-3 w-3" />
                        )}
                        <span>{h.unrealizedPnL >= 0 ? "+" : "-"}{fc(Math.abs(h.unrealizedPnL))}</span>
                      </div>
                      <span className={`text-xs font-num opacity-60 ${h.unrealizedPnL >= 0 ? c.gainText : c.lossText}`}>
                        {h.unrealizedPnLPercent >= 0 ? "+" : ""}{formatPercent(h.unrealizedPnLPercent)}
                      </span>
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
  );
}
