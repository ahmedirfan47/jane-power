"use client";

import { useEffect } from "react";
import { Moon, Sun } from "lucide-react";
import { useThemeStore, type Theme } from "@/stores/theme";

export function ThemeToggle() {
  const { theme, setTheme, toggle } = useThemeStore();

  // adopt whatever the inline script already applied
  useEffect(() => {
    const current = (document.documentElement.getAttribute("data-theme") as Theme) ?? "dark";
    if (current !== theme) setTheme(current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <button
      onClick={toggle}
      title={theme === "dark" ? "Switch to light" : "Switch to dark"}
      aria-label="Toggle theme"
      className="flex size-6 items-center justify-center rounded-md border border-hair text-mute transition-colors hover:text-ink"
    >
      {theme === "dark" ? <Sun size={12} /> : <Moon size={12} />}
    </button>
  );
}