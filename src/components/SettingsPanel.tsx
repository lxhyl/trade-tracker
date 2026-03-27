"use client";

import { useEffect } from "react";
import { X } from "lucide-react";
import { useI18n } from "@/components/I18nProvider";
import { ThemeToggle } from "@/components/ThemeToggle";
import { StyleThemeToggle } from "@/components/StyleThemeToggle";
import { ColorSchemeSettings } from "@/components/ColorSchemeSettings";
import { LanguageSettings } from "@/components/LanguageSettings";
import { CurrencySettings } from "@/components/CurrencySettings";
import { AccountSection } from "@/components/AccountSection";
import { Card, CardContent } from "@/components/ui/card";
import { SupportedCurrency, ExchangeRates } from "@/lib/currency";

interface SettingsPanelProps {
  open: boolean;
  onClose: () => void;
  authenticated: boolean;
  currency?: SupportedCurrency;
  rates?: ExchangeRates;
}

export function SettingsPanel({
  open,
  onClose,
  authenticated,
  currency,
  rates,
}: SettingsPanelProps) {
  const { t, locale } = useI18n();

  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [open, onClose]);

  // Lock body scroll when open
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-50 bg-black/40 backdrop-blur-sm transition-opacity duration-300 ${
          open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Centered modal */}
      <div
        className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-all duration-200 ${
          open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
      >
        <div
          role="dialog"
          aria-modal="true"
          aria-label={t("settings.title")}
          className={`relative w-full max-w-md bg-background rounded-2xl shadow-2xl flex flex-col max-h-[85vh] transition-all duration-200 ${
            open ? "scale-100 translate-y-0" : "scale-95 translate-y-2"
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="shrink-0 border-b px-5 py-4 flex items-center justify-between">
            <span className="font-semibold text-base">{t("settings.title")}</span>
            <button
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-muted transition-colors"
              aria-label="Close settings"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Scrollable content */}
          <div className="flex-1 overflow-y-auto p-5 space-y-6">
            <section className="space-y-2">
              <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-1">
                {t("settings.preferences")}
              </h2>
              <Card>
                <CardContent className="p-5 space-y-6 divide-y divide-border">
                  <LanguageSettings locale={locale} />
                  {authenticated && currency && rates && (
                    <div className="pt-6">
                      <CurrencySettings currency={currency} rates={rates} />
                    </div>
                  )}
                  <div className="pt-6">
                    <ColorSchemeSettings authenticated={authenticated} />
                  </div>
                  <div className="pt-6">
                    <StyleThemeToggle authenticated={authenticated} />
                  </div>
                  <div className="pt-6">
                    <ThemeToggle />
                  </div>
                </CardContent>
              </Card>
            </section>

            <section className="space-y-2">
              <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-1">
                {t("settings.account")}
              </h2>
              <AccountSection />
            </section>
          </div>
        </div>
      </div>
    </>
  );
}
