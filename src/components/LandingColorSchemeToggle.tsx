"use client";

import { TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { useI18n } from "@/components/I18nProvider";
import { useColorScheme, useSetColorScheme } from "@/components/ColorSchemeProvider";
import { ColorScheme } from "@/actions/settings";
import { TranslationKey } from "@/lib/i18n";

const SCHEMES: {
  key: ColorScheme;
  labelKey: TranslationKey;
  descKey: TranslationKey;
  gainColor: string;
  lossColor: string;
}[] = [
  { key: "us", labelKey: "settings.colorSchemeUS", descKey: "settings.colorSchemeUSDesc", gainColor: "text-green-500", lossColor: "text-red-500" },
  { key: "cn", labelKey: "settings.colorSchemeCN", descKey: "settings.colorSchemeCNDesc", gainColor: "text-red-500", lossColor: "text-green-500" },
];

/** Client-only color scheme toggle — no server action, for use on the landing page. */
export function LandingColorSchemeToggle() {
  const current = useColorScheme();
  const setScheme = useSetColorScheme();
  const { t } = useI18n();

  return (
    <div className="space-y-3">
      <div>
        <p className="text-sm font-medium">{t("settings.colorScheme")}</p>
        <p className="text-xs text-muted-foreground">{t("settings.colorSchemeDesc")}</p>
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        {SCHEMES.map(({ key, labelKey, descKey, gainColor, lossColor }) => {
          const isActive = current === key;
          return (
            <button
              key={key}
              onClick={() => setScheme?.(key)}
              className={cn(
                "flex items-center gap-3 rounded-lg border p-3 text-left transition-all cursor-pointer",
                isActive
                  ? "border-primary bg-primary/5 dark:bg-primary/10"
                  : "border-transparent hover:bg-muted/50"
              )}
            >
              <div className={cn(
                "flex h-8 w-8 shrink-0 items-center justify-center rounded-md gap-0",
                isActive ? "bg-primary/10" : "bg-muted"
              )}>
                <TrendingUp className={`h-3.5 w-3.5 ${gainColor}`} />
                <TrendingDown className={`h-3.5 w-3.5 ${lossColor}`} />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium leading-tight">{t(labelKey)}</p>
                <p className="text-xs text-muted-foreground leading-tight">{t(descKey)}</p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
