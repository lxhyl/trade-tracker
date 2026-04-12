import { NextRequest } from "next/server";
import { withCliAuth, cliError } from "@/lib/cli-auth";
import { fetchCryptoPrices } from "@/lib/price-service";
import { detectAssetType, isKnownCrypto } from "@/lib/asset-detection";
import YahooFinance from "yahoo-finance2";

const yf = new YahooFinance({ suppressNotices: ["yahooSurvey"] });
const API_TIMEOUT_MS = 8000;

export const GET = withCliAuth(async (request: NextRequest, _userId: string) => {
  const symbol = request.nextUrl.searchParams.get("symbol")?.trim().toUpperCase();
  const type = request.nextUrl.searchParams.get("type")?.trim();

  if (!symbol) {
    return cliError("Missing symbol", 400);
  }

  try {
    const resolvedType = type || (await detectAssetType(symbol));

    if (resolvedType === "crypto") {
      const prices = await fetchCryptoPrices([symbol]);
      const price = prices.get(symbol) ?? null;
      return Response.json({ symbol, price, currency: "USD", detectedType: "crypto" });
    }

    if (resolvedType === "stock") {
      const quote = await Promise.race([
        yf.quote(symbol),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error("timeout")), API_TIMEOUT_MS)
        ),
      ]);
      if (quote.regularMarketPrice) {
        return Response.json({
          symbol,
          price: quote.regularMarketPrice,
          currency: quote.currency || "USD",
          detectedType: "stock",
        });
      }
      return Response.json({ symbol, price: null, currency: null, detectedType: "stock" });
    }

    if (!type && isKnownCrypto(symbol)) {
      const prices = await fetchCryptoPrices([symbol]);
      const price = prices.get(symbol) ?? null;
      return Response.json({ symbol, price, currency: "USD", detectedType: "crypto" });
    }

    return Response.json({ symbol, price: null, currency: null, detectedType: "unknown" });
  } catch (error) {
    console.error("Price lookup error:", error);
    return Response.json({ symbol, price: null, currency: null, detectedType: type || "unknown" });
  }
});
