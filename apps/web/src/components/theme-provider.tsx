"use client";

import { createContext, useContext, useSyncExternalStore } from "react";

type Theme = "light" | "dark";

const ThemeContext = createContext<{
  theme: Theme;
  toggle: () => void;
}>({ theme: "dark", toggle: () => {} });

export function useTheme() {
  return useContext(ThemeContext);
}

function preferredTheme(): Theme {
  try {
    const stored = window.localStorage.getItem("theme");
    if (stored === "light" || stored === "dark") return stored;
  } catch {
    // Private browsing can disable storage; system preference still works.
  }
  return window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
}

function applyTheme(theme: Theme) {
  document.documentElement.classList.toggle("light", theme === "light");
  document.documentElement.classList.toggle("dark", theme === "dark");
}

function getTheme(): Theme {
  return document.documentElement.classList.contains("light") ? "light" : "dark";
}

function subscribe(onChange: () => void) {
  const syncPreference = () => applyTheme(preferredTheme());
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
  const media = window.matchMedia("(prefers-color-scheme: light)");
  media.addEventListener("change", syncPreference);
  window.addEventListener("storage", syncPreference);
  syncPreference();
  return () => {
    observer.disconnect();
    media.removeEventListener("change", syncPreference);
    window.removeEventListener("storage", syncPreference);
  };
}

function toggleTheme() {
  const theme = getTheme() === "dark" ? "light" : "dark";
  applyTheme(theme);
  try {
    window.localStorage.setItem("theme", theme);
  } catch {
    // A storage failure must not stop the theme toggle.
  }
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const theme = useSyncExternalStore(subscribe, getTheme, () => "dark" as const);

  return (
    <ThemeContext.Provider value={{ theme, toggle: toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}
