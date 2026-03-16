import { Moon as MoonIcon, Sun as SunIcon } from "lucide-react";
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
      <button
        aria-label="Theme switcher loading"
        className="inline-flex items-center justify-center rounded-lg p-2 text-default-500 hover:bg-default-100 transition-colors"
        type="button"
      >
        <SunIcon className="h-4 w-4" />
      </button>
    );
  }

  const isDark = theme === "dark";

  return (
    <button
      aria-label={`Switch to ${isDark ? "light" : "dark"} theme`}
      className="inline-flex items-center justify-center rounded-lg p-2 text-default-500 hover:bg-default-100 transition-colors"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      type="button"
    >
      {isDark ? (
        <SunIcon className="h-4 w-4" />
      ) : (
        <MoonIcon className="h-4 w-4" />
      )}
    </button>
  );
};
