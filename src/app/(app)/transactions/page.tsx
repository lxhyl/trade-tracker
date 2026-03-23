import { getTransactions } from "@/actions/transactions";
import { getDeposits } from "@/actions/deposits";
import { getDisplayCurrency, getDisplayLanguage, getColorScheme } from "@/actions/settings";
import { getExchangeRates } from "@/lib/exchange-rates";
import { TransactionList } from "@/components/TransactionList";
import { t } from "@/lib/i18n";

export const dynamic = "force-dynamic";

export default async function TransactionsPage() {
  const [transactions, deposits, currency, rates, locale, colorScheme] = await Promise.all([
    getTransactions(),
    getDeposits(),
    getDisplayCurrency(),
    getExchangeRates(),
    getDisplayLanguage(),
    getColorScheme(),
  ]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">{t(locale, "transactions.title")}</h1>
        <p className="text-muted-foreground">
          {t(locale, "transactions.subtitle")}
        </p>
      </div>

      <TransactionList transactions={transactions} deposits={deposits} currency={currency} rates={rates} colorScheme={colorScheme} locale={locale} />
    </div>
  );
}
