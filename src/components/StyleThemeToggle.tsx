"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Layers } from "lucide-react";
import { cn } from "@/lib/utils";
import { useI18n } from "@/components/I18nProvider";
import { useStyleTheme, StyleTheme } from "@/components/StyleThemeProvider";
import { setStyleTheme } from "@/actions/settings";

const STYLES: { key: StyleTheme; labelKey: string; descKey: string; icon: typeof Pencil }[] = [
  { key: "sketchy", labelKey: "settings.styleSketchy", descKey: "settings.styleSketchyDesc", icon: Pencil },
  { key: "classic", labelKey: "settings.styleClassic", descKey: "settings.styleClassicDesc", icon: Layers },
];

export function StyleThemeToggle() {
  const { styleTheme, setStyleTheme: setLocal } = useStyleTheme();
  const { t } = useI18n();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleSelect(theme: StyleTheme) {
    setLocal(theme);
    startTransition(async () => {
      await setStyleTheme(theme);
      router.refresh();
    });
  }

  return (
    <div className="space-y-3">
      <div>
        <p className="text-sm font-medium">{t("settings.styleTheme" as any)}</p>
        <p className="text-xs text-muted-foreground">{t("settings.styleThemeDesc" as any)}</p>
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        {STYLES.map(({ key, labelKey, descKey, icon: Icon }) => {
          const isActive = styleTheme === key;
          return (
            <button
              key={key}
              onClick={() => handleSelect(key)}
              disabled={isPending}
              className={cn(
                "flex items-center gap-3 rounded-lg border p-3 text-left transition-all cursor-pointer",
                isActive
                  ? "border-primary bg-primary/5 dark:bg-primary/10"
                  : "border-transparent hover:bg-muted/50"
              )}
            >
              <div
                className={cn(
                  "flex h-8 w-8 shrink-0 items-center justify-center rounded-md",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                )}
              >
                <Icon className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium leading-tight">{t(labelKey as any)}</p>
                <p className="text-xs text-muted-foreground leading-tight">{t(descKey as any)}</p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
