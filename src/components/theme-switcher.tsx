/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-call */

"use client";

import { Button } from "@heroui/react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export const ThemeSwitcher = () => {
  const [mounted, setMounted] = useState(false);
  const { setTheme, theme } = useTheme();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <Button 
        aria-label="Theme switcher loading" 
        isIconOnly 
        size="sm"
        variant="light"
      >
        <span className="text-lg">🌓</span>
      </Button>
    );
  }

  const isDark = theme === "dark";

  return (
    <Button
      aria-label={`Switch to ${isDark ? "light" : "dark"} theme`}
      isIconOnly
      onPress={() => setTheme(isDark ? "light" : "dark")}
      size="sm"
      variant="light"
    >
      <span className="text-lg">
        {isDark ? "☀️" : "🌙"}
      </span>
    </Button>
  );
};
