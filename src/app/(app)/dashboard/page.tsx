import { getTransactions, getLatestPrices } from "@/actions/transactions";
import { getDeposits } from "@/actions/deposits";
import { getDisplayCurrency } from "@/actions/settings";
import { getExchangeRates } from "@/lib/exchange-rates";
import {
  calculateHoldings,
  calculateDepositHoldings,
  calculatePortfolioSummary,
  calculateAllocationData,
} from "@/lib/calculations";
import { StatsCards } from "@/components/StatsCards";
import { AllocationPieChart } from "@/components/PieChart";
import { HoldingsTable } from "@/components/HoldingsTable";
import { DepositTable } from "@/components/DepositTable";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Sparkles, TrendingUp, Coins, BarChart3, PiggyBank } from "lucide-react";
import { getDisplayLanguage } from "@/actions/settings";
import { t } from "@/lib/i18n";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const [transactions, currentPrices, deposits, currency, rates, locale] = await Promise.all([
    getTransactions(),
    getLatestPrices(),
    getDeposits(),
    getDisplayCurrency(),
    getExchangeRates(),
    getDisplayLanguage(),
  ]);

  const holdings = calculateHoldings(transactions, currentPrices, rates);
  const depositHoldings = calculateDepositHoldings(deposits, rates);
  const summary = calculatePortfolioSummary(holdings, depositHoldings);
  const allocationData = calculateAllocationData(holdings, depositHoldings);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight bg-gradient-to-r from-gray-900 via-gray-700 to-gray-500 dark:from-gray-100 dark:via-gray-200 dark:to-gray-400 bg-clip-text text-transparent">
            {t(locale, "dashboard.title")}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {t(locale, "dashboard.subtitle")}
          </p>
        </div>
        <Link href="/transactions/new" className="shrink-0">
          <Button size="sm" className="md:h-10 md:px-5 gap-1.5 shadow-sm shadow-primary/20">
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">{t(locale, "dashboard.addTransaction")}</span>
            <span className="sm:hidden">{t(locale, "common.add")}</span>
          </Button>
        </Link>
      </div>

      {/* Stats Cards */}
      <StatsCards summary={summary} currency={currency} rates={rates} />

      {/* Holdings Table */}
      <HoldingsTable holdings={holdings} currency={currency} rates={rates} />

      {/* Charts Row */}
      <div className="grid gap-4 md:gap-6 lg:grid-cols-2">
        <AllocationPieChart data={allocationData} currency={currency} rates={rates} />

        {/* Quick Stats Card */}
        <Card className="overflow-hidden">
          <CardHeader className="border-b bg-muted/20">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-blue-500 text-white shadow-sm">
                <Sparkles className="h-5 w-5" />
              </div>
              <CardTitle>{t(locale, "dashboard.quickStats")}</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="pt-5 pb-5">
            <div className={`grid grid-cols-2 gap-2.5 md:gap-3 ${depositHoldings.length > 0 ? "md:grid-cols-3" : ""}`}>
              {[
                { count: holdings.length, label: t(locale, "dashboard.assets"), color: "blue", icon: BarChart3, from: "from-blue-500", to: "to-blue-600", bg: "bg-blue-50 dark:bg-blue-950/40", text: "text-blue-700 dark:text-blue-300", sub: "text-blue-500/70 dark:text-blue-400/70" },
                { count: transactions.length, label: t(locale, "dashboard.trades"), color: "indigo", icon: TrendingUp, from: "from-indigo-500", to: "to-violet-500", bg: "bg-indigo-50 dark:bg-indigo-950/40", text: "text-indigo-700 dark:text-indigo-300", sub: "text-indigo-500/70 dark:text-indigo-400/70" },
                { count: holdings.filter((h) => h.assetType === "crypto").length, label: t(locale, "dashboard.crypto"), color: "pink", icon: Coins, from: "from-pink-500", to: "to-rose-500", bg: "bg-pink-50 dark:bg-pink-950/40", text: "text-pink-700 dark:text-pink-300", sub: "text-pink-500/70 dark:text-pink-400/70" },
                { count: holdings.filter((h) => h.assetType === "stock").length, label: t(locale, "dashboard.stocks"), color: "cyan", icon: BarChart3, from: "from-cyan-500", to: "to-sky-500", bg: "bg-cyan-50 dark:bg-cyan-950/40", text: "text-cyan-700 dark:text-cyan-300", sub: "text-cyan-500/70 dark:text-cyan-400/70" },
                ...(depositHoldings.length > 0 ? [{ count: depositHoldings.length, label: t(locale, "dashboard.deposits"), color: "green", icon: PiggyBank, from: "from-emerald-500", to: "to-teal-500", bg: "bg-emerald-50 dark:bg-emerald-950/40", text: "text-emerald-700 dark:text-emerald-300", sub: "text-emerald-500/70 dark:text-emerald-400/70" }] : []),
              ].map((stat) => {
                const StatIcon = stat.icon;
                return (
                  <div key={stat.label} className={`flex items-center gap-3 p-3 rounded-xl ${stat.bg} border border-transparent hover:border-border/30 transition-colors`}>
                    <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br ${stat.from} ${stat.to} text-white shadow-sm`}>
                      <StatIcon className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <p className={`text-xl font-bold font-num leading-none ${stat.text}`}>{stat.count}</p>
                      <p className={`text-xs mt-0.5 font-medium ${stat.sub}`}>{stat.label}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Deposits Table */}
      <DepositTable holdings={depositHoldings} currency={currency} rates={rates} />
    </div>
  );
}
