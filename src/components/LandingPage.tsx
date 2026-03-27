"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  TrendingUp,
  BarChart3,
  Shield,
  Smartphone,
  PieChart,
  ArrowRight,
  ChevronRight,
  Zap,
  Globe,
} from "lucide-react";
import { useI18n } from "@/components/I18nProvider";
import { LandingLanguageToggle } from "@/components/LandingLanguageToggle";
import { LoginModal } from "@/components/LoginModal";
import { LandingDashboard } from "@/components/LandingDashboard";
import { LandingStyleThemeToggle } from "@/components/LandingStyleThemeToggle";
import { LandingColorSchemeToggle } from "@/components/LandingColorSchemeToggle";
import { ThemeToggle } from "@/components/ThemeToggle";
import { TranslationKey } from "@/lib/i18n";
import { Settings2 } from "lucide-react";

const FEATURE_ITEMS: { icon: typeof BarChart3; titleKey: TranslationKey; descKey: TranslationKey; iconColor: string }[] = [
  { icon: BarChart3,   titleKey: "landing.featureAnalyticsTitle",    descKey: "landing.featureAnalyticsDesc",    iconColor: "text-primary"              },
  { icon: PieChart,    titleKey: "landing.featureMultiAssetTitle",   descKey: "landing.featureMultiAssetDesc",   iconColor: "text-emerald-600"           },
  { icon: Globe,       titleKey: "landing.featureMultiCurrencyTitle",descKey: "landing.featureMultiCurrencyDesc",iconColor: "text-primary"              },
  { icon: Smartphone,  titleKey: "landing.featurePWATitle",          descKey: "landing.featurePWADesc",          iconColor: "text-amber-600"            },
  { icon: Shield,      titleKey: "landing.featureSecureTitle",       descKey: "landing.featureSecureDesc",       iconColor: "text-foreground"           },
  { icon: Zap,         titleKey: "landing.featureFastTitle",         descKey: "landing.featureFastDesc",         iconColor: "text-amber-600"            },
];

// ── Language settings block (used in the customize section) ─
function LanguageSettingsBlock() {
  const { locale, t } = useI18n();
  const router = useRouter();

  const LANGS = [
    { key: "en" as const, label: "English", icon: "A" },
    { key: "zh" as const, label: "中文", icon: "中" },
  ];

  function setLocale(lang: string) {
    document.cookie = `locale=${lang};path=/;max-age=${60 * 60 * 24 * 365};samesite=lax`;
    router.refresh();
  }

  return (
    <div className="space-y-3">
      <div>
        <p className="text-sm font-medium">{t("settings.language")}</p>
        <p className="text-xs text-muted-foreground">{t("settings.languageDesc")}</p>
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        {LANGS.map(({ key, label, icon }) => {
          const isActive = locale === key;
          return (
            <button
              key={key}
              onClick={() => setLocale(key)}
              className={cn(
                "flex items-center gap-3 rounded-lg border p-3 text-left transition-all cursor-pointer",
                isActive
                  ? "border-primary bg-primary/5 dark:bg-primary/10"
                  : "border-transparent hover:bg-muted/50"
              )}
            >
              <div className={cn(
                "flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-sm font-bold",
                isActive ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
              )}>
                {icon}
              </div>
              <p className="text-sm font-medium">{label}</p>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ── Landing page ───────────────────────────────────────────
export function LandingPage() {
  const { t } = useI18n();
  const [loginOpen, setLoginOpen] = useState(false);

  return (
    <div className="min-h-screen overflow-x-hidden">
      <LoginModal open={loginOpen} onClose={() => setLoginOpen(false)} />

      {/* Top nav bar */}
      <header className="sticky top-0 z-50 border-b bg-background">
        <div className="container mx-auto flex h-12 items-center justify-between px-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <TrendingUp className="h-4 w-4" />
            </div>
            <span className="text-lg font-bold text-foreground">TradeTracker</span>
          </div>
          <div className="flex items-center gap-3">
            <LandingLanguageToggle />
            <button
              onClick={() => setLoginOpen(true)}
              className="flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm transition-all hover:bg-primary/90 active:scale-95"
            >
              {t("common.getStarted")}
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </header>

      {/* ── Hero Section ─────────────────────────────── */}
      <section className="relative py-20 md:py-28">
        <div className="container mx-auto px-4 relative">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <div className="label-caps inline-flex items-center gap-2 mb-6 animate-fade-in">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-amber-500" />
              {t("landing.tagline")}
            </div>
            <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-6 animate-fade-in" style={{ animationDelay: "0.1s" }}>
              {t("landing.heroTitle1")}{" "}
              <span className="text-primary">{t("landing.heroTitle2")}</span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-8 animate-fade-in" style={{ animationDelay: "0.2s" }}>
              {t("landing.heroDesc")}
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center animate-fade-in" style={{ animationDelay: "0.3s" }}>
              <button
                onClick={() => setLoginOpen(true)}
                className="inline-flex items-center justify-center gap-2 rounded-md bg-primary px-8 py-3.5 text-base font-semibold text-primary-foreground shadow-sm transition-all hover:bg-primary/90 active:scale-95"
              >
                {t("common.getStarted")}
                <ArrowRight className="h-4 w-4" />
              </button>
              <a
                href="#features"
                className="inline-flex items-center justify-center gap-2 rounded-md border border-border px-8 py-3.5 text-base font-semibold text-foreground transition-all hover:bg-secondary/50"
              >
                {t("common.learnMore")}
                <ChevronRight className="h-4 w-4" />
              </a>
            </div>
          </div>

          {/* Real dashboard preview */}
          <div className="animate-fade-in rounded-lg border shadow-xl overflow-hidden" style={{ animationDelay: "0.4s" }}>
            <div className="p-4 md:p-8 bg-background">
              <LandingDashboard onLogin={() => setLoginOpen(true)} />
            </div>
          </div>
        </div>
      </section>

      {/* ── Features Section ─────────────────────────── */}
      <section id="features" className="py-20 md:py-28 border-t bg-secondary/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-4">
              {t("landing.featuresTitle1")}{" "}
              <span className="text-primary">{t("landing.featuresTitle2")}</span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              {t("landing.featuresSubtitle")}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 max-w-5xl mx-auto">
            {FEATURE_ITEMS.map((f, i) => {
              const Icon = f.icon;
              return (
                <div
                  key={f.titleKey}
                  className="group rounded-lg border bg-card p-6 transition-all hover:shadow-md animate-fade-in"
                  style={{ animationDelay: `${i * 0.04}s` }}
                >
                  <div className={`inline-flex h-10 w-10 items-center justify-center rounded-md bg-muted mb-4 ${f.iconColor}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="text-base font-semibold mb-1.5">{t(f.titleKey)}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{t(f.descKey)}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Customize Section ────────────────────────── */}
      <section className="py-20 md:py-28 border-t">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-12">
              <div className="inline-flex items-center justify-center h-12 w-12 rounded-xl bg-primary/10 text-primary mb-4">
                <Settings2 className="h-6 w-6" />
              </div>
              <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-3">
                {t("landing.customizeTitle")}
              </h2>
              <p className="text-lg text-muted-foreground">
                {t("landing.customizeDesc")}
              </p>
            </div>

            <div className="grid gap-6 sm:grid-cols-2">
              <div className="rounded-xl border bg-card p-5 shadow-sm">
                <ThemeToggle />
              </div>
              <div className="rounded-xl border bg-card p-5 shadow-sm">
                <LandingStyleThemeToggle />
              </div>
              <div className="rounded-xl border bg-card p-5 shadow-sm">
                <LandingColorSchemeToggle />
              </div>
              <div className="rounded-xl border bg-card p-5 shadow-sm">
                <LanguageSettingsBlock />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA Section ──────────────────────────────── */}
      <section className="py-20 md:py-28 border-t">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-2xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-4">
              {t("landing.ctaTitle")}
            </h2>
            <p className="text-lg text-muted-foreground mb-8">
              {t("landing.ctaDesc")}
            </p>
            <button
              onClick={() => setLoginOpen(true)}
              className="inline-flex items-center justify-center gap-2 rounded-md bg-primary px-8 py-4 text-base font-semibold text-primary-foreground shadow-sm transition-all hover:bg-primary/90 active:scale-95"
            >
              {t("common.getStarted")}
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────── */}
      <footer className="border-t py-8">
        <div className="container mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <TrendingUp className="h-3.5 w-3.5" />
            </div>
            <span className="font-semibold text-foreground">TradeTracker</span>
          </div>
          <p>{t("landing.footer")}</p>
        </div>
      </footer>
    </div>
  );
}
