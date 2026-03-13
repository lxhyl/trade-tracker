export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import YahooFinance from "yahoo-finance2";

const yf = new YahooFinance({ suppressNotices: ["yahooSurvey"] });

export async function GET(
  request: NextRequest,
  { params }: { params: { symbol: string } }
) {
  const symbol = params.symbol.toUpperCase();
  const assetType = request.nextUrl.searchParams.get("type") ?? "stock";

  // For crypto, yahoo uses BTC-USD style tickers
  const yahooSymbol = assetType === "crypto" ? `${symbol}-USD` : symbol;

  const period1 = new Date();
  period1.setDate(period1.getDate() - 90);

  // Determine native currency for the exchange
  const upperSymbol = symbol.toUpperCase();
  let nativeCurrency = "USD";
  if (upperSymbol.endsWith(".SS") || upperSymbol.endsWith(".SZ")) {
    nativeCurrency = "CNY";
  } else if (upperSymbol.endsWith(".HK")) {
    nativeCurrency = "HKD";
  }

  try {
    const result = await yf.chart(yahooSymbol, {
      period1,
      period2: new Date(),
      interval: "1d",
    });

    const prices = (result.quotes ?? [])
      .filter((q) => q.close != null && q.date)
      .map((q) => ({ t: new Date(q.date!).getTime(), p: q.close! }));

    return NextResponse.json({ prices, nativeCurrency });
  } catch (err) {
    console.error(`[price-history] ${yahooSymbol}:`, err);
    return NextResponse.json({ prices: [], nativeCurrency });
  }
}
