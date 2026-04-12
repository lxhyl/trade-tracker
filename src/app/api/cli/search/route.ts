import { NextRequest } from "next/server";
import { withCliAuth } from "@/lib/cli-auth";
import YahooFinance from "yahoo-finance2";

const yf = new YahooFinance({ suppressNotices: ["yahooSurvey"] });

export const GET = withCliAuth(async (request: NextRequest, _userId: string) => {
  const query = request.nextUrl.searchParams.get("q")?.trim();
  if (!query || query.length < 1) {
    return Response.json([]);
  }

  try {
    const result = await Promise.race([
      yf.search(query, { quotesCount: 8, newsCount: 0 }),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("Search timeout")), 5000)
      ),
    ]);

    const quotes = (result.quotes || [])
      .filter((q) => {
        const type = (q as Record<string, unknown>).quoteType as string | undefined;
        return type === "EQUITY" || type === "ETF";
      })
      .slice(0, 6)
      .map((q) => {
        const rec = q as Record<string, unknown>;
        return {
          symbol: rec.symbol as string,
          name: (rec.shortname || rec.longname || "") as string,
          exchange: (rec.exchDisp || rec.exchange || "") as string,
          type: rec.quoteType as string,
        };
      });

    return Response.json(quotes);
  } catch (error) {
    console.error("Symbol search error:", error);
    return Response.json([]);
  }
});
