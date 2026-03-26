import type { Metadata, Viewport } from "next";
import { DM_Sans, JetBrains_Mono, Caveat, Patrick_Hand } from "next/font/google";
import "./globals.css";
import { ServiceWorkerRegister } from "@/components/ServiceWorkerRegister";
import { SplashScreen } from "@/components/SplashScreen";
import { ThemeProvider } from "@/components/ThemeProvider";
import { StyleThemeProvider } from "@/components/StyleThemeProvider";
import { ToastProvider } from "@/components/Toast";
import { I18nProvider } from "@/components/I18nProvider";
import { ColorSchemeProvider } from "@/components/ColorSchemeProvider";
import { SketchyDrawingLayer } from "@/components/SketchyDrawingLayer";
import { getLocaleFromCookie } from "@/actions/settings";
import { getColorScheme } from "@/actions/settings";

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
});

const caveat = Caveat({
  subsets: ["latin"],
  variable: "--font-sketchy-heading",
});

const patrickHand = Patrick_Hand({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-sketchy-body",
});

export const metadata: Metadata = {
  title: "TradeTracker - Personal Trading Record",
  description: "Track your stock and cryptocurrency trades with comprehensive analysis",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "TradeTracker",
  },
  icons: {
    icon: "/icons/icon-192.png",
    apple: "/icons/icon-192.png",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: "#2563eb",
  viewportFit: "cover",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [locale, colorScheme] = await Promise.all([
    getLocaleFromCookie(),
    getColorScheme(),
  ]);

  return (
    <html lang={locale} suppressHydrationWarning>
      <head>
        {/* Apply sketchy class before paint to prevent FOUC - default is sketchy */}
        <script dangerouslySetInnerHTML={{ __html: `try{var st=localStorage.getItem('styleTheme');if(st!=='classic')document.documentElement.classList.add('sketchy');}catch(e){}` }} />
        {/* Inline critical CSS for instant splash screen - prevents black screen on PWA cold start */}
        <style
          dangerouslySetInnerHTML={{
            __html: `
              #app-splash {
                position: fixed;
                inset: 0;
                z-index: 9999;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                background: linear-gradient(160deg, #f8fafc, #fff, #f0fdf4);
                transition: opacity 0.3s;
              }
              #app-splash .splash-icon {
                width: 56px;
                height: 56px;
                border-radius: 16px;
                background: linear-gradient(135deg, #2563eb, #0d9488);
                display: flex;
                align-items: center;
                justify-content: center;
                margin-bottom: 16px;
                box-shadow: 0 4px 14px rgba(37,99,235,0.25);
              }
              #app-splash .splash-icon svg {
                width: 28px;
                height: 28px;
                color: white;
              }
              #app-splash .splash-title {
                font-size: 22px;
                font-weight: 700;
                background: linear-gradient(90deg, #2563eb, #0d9488);
                -webkit-background-clip: text;
                -webkit-text-fill-color: transparent;
                background-clip: text;
                font-family: 'DM Sans', system-ui, -apple-system, sans-serif;
              }
              #app-splash .splash-bar {
                width: 48px;
                height: 3px;
                border-radius: 3px;
                background: #e2e8f0;
                margin-top: 24px;
                overflow: hidden;
              }
              #app-splash .splash-bar::after {
                content: '';
                display: block;
                width: 50%;
                height: 100%;
                border-radius: 3px;
                background: linear-gradient(90deg, #2563eb, #0d9488);
                animation: splashProgress 1.2s ease-in-out infinite;
              }
              @keyframes splashProgress {
                0% { transform: translateX(-100%); }
                100% { transform: translateX(200%); }
              }
            `,
          }}
        />
      </head>
      <body className={`${dmSans.variable} ${jetbrainsMono.variable} ${caveat.variable} ${patrickHand.variable} font-sans`}>
        <ThemeProvider>
          <StyleThemeProvider>
          <I18nProvider locale={locale}>
            <ColorSchemeProvider scheme={colorScheme}>
            <ToastProvider>
              <SplashScreen />
              <div className="min-h-screen bg-background">
                {children}
              </div>
              <SketchyDrawingLayer />
              {/* SVG filter for hand-drawn chart lines in sketchy theme */}
              <svg width="0" height="0" style={{ position: 'absolute' }}>
                <defs>
                  <filter id="sketchy-filter">
                    <feTurbulence type="turbulence" baseFrequency="0.02 0.06" numOctaves="3" seed="2" result="turbulence" />
                    <feDisplacementMap in="SourceGraphic" in2="turbulence" scale="2.5" xChannelSelector="R" yChannelSelector="G" />
                  </filter>
                </defs>
              </svg>
              <ServiceWorkerRegister />
            </ToastProvider>
            </ColorSchemeProvider>
          </I18nProvider>
          </StyleThemeProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
