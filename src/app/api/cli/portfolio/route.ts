import { NextRequest } from "next/server";
import { withCliAuth } from "@/lib/cli-auth";
import { listTransactions, getLatestPricesForUser } from "@/lib/services/transaction-service";
import { calculateHoldings } from "@/lib/calculations";
import { getExchangeRates } from "@/lib/exchange-rates";

export const GET = withCliAuth(async (_request: NextRequest, userId: string) => {
  const [txs, prices, rates] = await Promise.all([
    listTransactions(userId),
    getLatestPricesForUser(userId),
    getExchangeRates(),
  ]);

  const holdings = calculateHoldings(txs, prices, rates);

  const totalInvested = holdings.reduce((sum, h) => sum + h.totalCost, 0);
  const totalMarketValue = holdings.reduce((sum, h) => sum + h.currentValue, 0);
  const totalUnrealizedPnl = totalMarketValue - totalInvested;
  const totalUnrealizedPnlPct = totalInvested > 0
    ? (totalUnrealizedPnl / totalInvested) * 100
    : 0;

  return Response.json({
    totalInvested,
    totalMarketValue,
    totalUnrealizedPnl,
    totalUnrealizedPnlPct,
    holdings: holdings.map((h) => ({
      symbol: h.symbol,
      name: h.name,
      assetType: h.assetType,
      quantity: h.quantity,
      avgCost: h.avgCost,
      currentPrice: h.currentPrice,
      marketValue: h.currentValue,
      costBasis: h.totalCost,
      unrealizedPnl: h.unrealizedPnL,
      unrealizedPnlPct: h.unrealizedPnLPercent,
      currency: "USD",
    })),
  });
});
