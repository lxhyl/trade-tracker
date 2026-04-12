import { db } from "@/lib/db";
import { appSettings } from "@/lib/schema";
import { eq, and } from "drizzle-orm";
import { SupportedCurrency } from "@/lib/currency";
import { Locale, LOCALES } from "@/lib/i18n";

export type ColorScheme = "us" | "cn";
export type StyleTheme = "sketchy" | "classic";

export interface AllSettings {
  currency: SupportedCurrency;
  language: Locale;
  colorScheme: ColorScheme;
  styleTheme: StyleTheme;
}

async function getSetting(userId: string, key: string): Promise<string | null> {
  const result = await db
    .select()
    .from(appSettings)
    .where(and(eq(appSettings.userId, userId), eq(appSettings.key, key)));
  return result[0]?.value ?? null;
}

async function setSetting(
  userId: string,
  key: string,
  value: string
): Promise<void> {
  await db
    .insert(appSettings)
    .values({
      userId,
      key,
      value,
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: [appSettings.userId, appSettings.key],
      set: { value, updatedAt: new Date() },
    });
}

export async function getAllSettings(userId: string): Promise<AllSettings> {
  const currency = await getSetting(userId, "displayCurrency");
  const language = await getSetting(userId, "displayLanguage");
  const colorScheme = await getSetting(userId, "colorScheme");
  const styleTheme = await getSetting(userId, "styleTheme");

  return {
    currency: (currency === "CNY" || currency === "HKD" || currency === "USD"
      ? currency
      : "USD") as SupportedCurrency,
    language: (language && LOCALES.includes(language as Locale)
      ? language
      : "en") as Locale,
    colorScheme: (colorScheme === "us" || colorScheme === "cn"
      ? colorScheme
      : "us") as ColorScheme,
    styleTheme: (styleTheme === "sketchy" || styleTheme === "classic"
      ? styleTheme
      : "sketchy") as StyleTheme,
  };
}

export async function updateSettings(
  userId: string,
  updates: Partial<Record<string, string>>
): Promise<AllSettings> {
  const keyMap: Record<string, string> = {
    currency: "displayCurrency",
    language: "displayLanguage",
    "color-scheme": "colorScheme",
    "style-theme": "styleTheme",
    // Also accept camelCase
    colorScheme: "colorScheme",
    styleTheme: "styleTheme",
  };

  for (const [key, value] of Object.entries(updates)) {
    const dbKey = keyMap[key];
    if (dbKey && value) {
      await setSetting(userId, dbKey, value);
    }
  }

  return getAllSettings(userId);
}
