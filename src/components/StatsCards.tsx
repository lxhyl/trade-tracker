"use client";

import { PortfolioSummary } from "@/lib/calculations";
import { createCurrencyFormatter, formatPercent } from "@/lib/utils";
import { SupportedCurrency, ExchangeRates } from "@/lib/currency";
import { useI18n } from "@/components/I18nProvider";
import { usePnLColors } from "@/components/ColorSchemeProvider";

interface StatsCardsProps {
  summary: PortfolioSummary;
  currency: SupportedCurrency;
  rates: ExchangeRates;
}

export function StatsCards({ summary, currency, rates }: StatsCardsProps) {
  const fc = createCurrencyFormatter(currency, rates);
  const { t } = useI18n();
  const c = usePnLColors();

  const unrealizedPositive = summary.totalUnrealizedPnL >= 0;
  const realizedPositive = summary.totalRealizedPnL >= 0;
  const pnlPercent = `${summary.totalPnLPercent >= 0 ? "+" : ""}${formatPercent(summary.totalPnLPercent)}`;

  return (
    <div>
      {/* Tier 1 — Hero strip */}
      <div className="flex flex-wrap gap-8 pb-6 mb-6 border-b">
        <div className="animate-fade-in" style={{ animationDelay: "0ms" }}>
          <div className="label-caps mb-1">{t("stats.currentValue")}</div>
          <div className="text-4xl font-bold font-num text-foreground">
            {fc(summary.totalCurrentValue)}
          </div>
        </div>
        <div className="animate-fade-in" style={{ animationDelay: "40ms" }}>
          <div className="label-caps mb-1">{t("stats.unrealizedPnL")}</div>
          <div className={`text-3xl font-bold font-num ${unrealizedPositive ? c.gainText : c.lossText}`}>
            {unrealizedPositive ? "+" : ""}{fc(summary.totalUnrealizedPnL)}
            <span className="text-xl font-semibold ml-2">{pnlPercent}</span>
          </div>
        </div>
      </div>

      {/* Tier 2 — Secondary stats */}
      <div className="flex flex-wrap gap-6 md:gap-8">
        <div className="animate-fade-in" style={{ animationDelay: "80ms" }}>
          <div className="label-caps mb-1">{t("stats.totalInvested")}</div>
          <div className="text-sm font-semibold font-num text-foreground">
            {fc(summary.totalInvested)}
          </div>
        </div>

        <div className="border-l pl-6 animate-fade-in" style={{ animationDelay: "120ms" }}>
          <div className="label-caps mb-1">{t("stats.realizedPnL")}</div>
          <div className={`text-sm font-semibold font-num ${realizedPositive ? c.gainText : c.lossText}`}>
            {realizedPositive ? "+" : ""}{fc(summary.totalRealizedPnL)}
          </div>
        </div>

        {summary.totalDepositInterest > 0 && (
          <div className="border-l pl-6 animate-fade-in" style={{ animationDelay: "160ms" }}>
            <div className="label-caps mb-1">{t("stats.totalIncome")}</div>
            <div className="text-sm font-semibold font-num text-amber-600 dark:text-amber-400">
              +{fc(summary.totalDepositInterest)}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
