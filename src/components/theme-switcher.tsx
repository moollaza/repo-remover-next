/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-call */

"use client";

import { MoonIcon, SunIcon } from "@heroicons/react/16/solid";
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
        <SunIcon className="h-4 w-4" />
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
      {isDark ? (
        <SunIcon className="h-4 w-4" />
      ) : (
        <MoonIcon className="h-4 w-4" />
      )}
    </Button>
  );
};
