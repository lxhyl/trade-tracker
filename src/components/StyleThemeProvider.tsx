"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";

export type StyleTheme = "sketchy" | "classic";

interface StyleThemeContextValue {
  styleTheme: StyleTheme;
  setStyleTheme: (theme: StyleTheme) => void;
}

const StyleThemeContext = createContext<StyleThemeContextValue>({
  styleTheme: "sketchy",
  setStyleTheme: () => {},
});

export function useStyleTheme() {
  return useContext(StyleThemeContext);
}

export function StyleThemeProvider({ children }: { children: React.ReactNode }) {
  const [styleTheme, setStyleThemeState] = useState<StyleTheme>("sketchy");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("styleTheme") as StyleTheme | null;
    const resolved: StyleTheme = stored === "classic" ? "classic" : "sketchy";
    setStyleThemeState(resolved);
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    document.documentElement.classList.toggle("sketchy", styleTheme === "sketchy");
    localStorage.setItem("styleTheme", styleTheme);
  }, [styleTheme, mounted]);

  const setStyleTheme = useCallback((theme: StyleTheme) => {
    setStyleThemeState(theme);
  }, []);

  return (
    <StyleThemeContext.Provider value={{ styleTheme, setStyleTheme }}>
      {children}
    </StyleThemeContext.Provider>
  );
}
