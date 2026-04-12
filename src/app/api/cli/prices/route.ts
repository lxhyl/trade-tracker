import { NextRequest } from "next/server";
import { withCliAuth } from "@/lib/cli-auth";
import { db } from "@/lib/db";
import { transactions, currentPrices, priceHistory } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { fetchAllPrices } from "@/lib/price-service";

export const GET = withCliAuth(async (_request: NextRequest, userId: string) => {
  try {
    const allTx = await db
      .select()
      .from(transactions)
      .where(eq(transactions.userId, userId));

    const assetMap = new Map<string, string>();
    for (const tx of allTx) {
      if (!assetMap.has(tx.symbol)) {
        assetMap.set(tx.symbol, tx.assetType);
      }
    }

    const marketAssets = Array.from(assetMap.entries())
      .filter(([_, assetType]) => assetType === "crypto" || assetType === "stock")
      .map(([symbol, assetType]) => ({ symbol, assetType }));

    if (marketAssets.length === 0) {
      return Response.json({ updated: 0, prices: [] });
    }

    const priceResults = await fetchAllPrices(marketAssets);
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    for (const { symbol, price, source } of priceResults) {
      await db
        .insert(currentPrices)
        .values({ symbol, price: price.toString() })
        .onConflictDoUpdate({
          target: currentPrices.symbol,
          set: { price: price.toString(), updatedAt: new Date() },
        });

      await db
        .insert(priceHistory)
        .values({
          symbol,
          date: today,
          price: price.toString(),
          source: source || "api",
        })
        .onConflictDoNothing();
    }

    return Response.json({
      updated: priceResults.length,
      prices: priceResults.map((p) => ({
        symbol: p.symbol,
        price: p.price,
        source: p.source,
      })),
    });
  } catch (error) {
    console.error("Price refresh error:", error);
    return Response.json({ error: "Failed to refresh prices" }, { status: 500 });
  }
});
