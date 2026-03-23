import { getDisplayCurrency, getDisplayLanguage } from "@/actions/settings";
import { getExchangeRates } from "@/lib/exchange-rates";
import { TransactionForm } from "@/components/TransactionForm";
import { t } from "@/lib/i18n";

export const dynamic = "force-dynamic";

export default async function NewTransactionPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string; tradeType?: string; symbol?: string }>;
}) {
  const [currency, rates, locale, params] = await Promise.all([
    getDisplayCurrency(),
    getExchangeRates(),
    getDisplayLanguage(),
    searchParams,
  ]);

  const initialAssetType = params.type === "deposit" ? "deposit" : undefined;
  const initialTradeType = params.tradeType === "sell" ? "sell" : undefined;
  const initialSymbol = params.symbol || undefined;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-foreground">
          {t(locale, "form.addTitle")}
        </h1>
        <p className="text-muted-foreground mt-1">
          {t(locale, "form.addSubtitle")}
        </p>
      </div>

      <div className="max-w-2xl mx-auto">
        <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
          <TransactionForm
            currency={currency}
            rates={rates}
            initialAssetType={initialAssetType}
            initialTradeType={initialTradeType}
            initialSymbol={initialSymbol}
          />
        </div>
      </div>
    </div>
  );
}
