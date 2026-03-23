import { getTransactions, getCurrentPrices } from "@/actions/transactions";
import { getDeposits } from "@/actions/deposits";
import { getDisplayCurrency, getDisplayLanguage, getColorScheme } from "@/actions/settings";
import { getExchangeRates } from "@/lib/exchange-rates";
import { calculateHoldings } from "@/lib/calculations";
import { TransactionList } from "@/components/TransactionList";
import { t } from "@/lib/i18n";

export const dynamic = "force-dynamic";

export default async function TransactionsPage() {
  const [transactions, deposits, currency, rates, locale, colorScheme, prices] = await Promise.all([
    getTransactions(),
    getDeposits(),
    getDisplayCurrency(),
    getExchangeRates(),
    getDisplayLanguage(),
    getColorScheme(),
    getCurrentPrices(),
  ]);

  // Build holdings to get avgCost + currentPrice per symbol
  const holdings = calculateHoldings(transactions, prices, rates);
  const holdingsMap: Record<string, { avgCost: number; currentPrice: number }> = {};
  for (const h of holdings) {
    holdingsMap[h.symbol] = { avgCost: h.avgCost, currentPrice: h.currentPrice };
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">{t(locale, "transactions.title")}</h1>
        <p className="text-muted-foreground">
          {t(locale, "transactions.subtitle")}
        </p>
      </div>

      <TransactionList
        transactions={transactions}
        deposits={deposits}
        currency={currency}
        rates={rates}
        colorScheme={colorScheme}
        locale={locale}
        holdingsMap={holdingsMap}
      />
    </div>
  );
}
