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

  try {
    const result = await (yf as unknown as {
      historical: (symbol: string, opts: object) => Promise<{ date: Date; close: number }[]>;
    }).historical(yahooSymbol, {
      period1: (() => { const d = new Date(); d.setDate(d.getDate() - 90); return d; })(),
      period2: new Date(),
      interval: "1d",
    });

    const prices = result
      .filter((r) => r.close != null)
      .map((r) => ({ t: r.date.getTime(), p: r.close }));

    return NextResponse.json({ prices });
  } catch {
    return NextResponse.json({ prices: [] });
  }
}
