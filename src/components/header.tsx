import { AnimatePresence, motion } from "framer-motion";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useCallback, useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";

import { BrandLogo } from "@/components/brand-logo";
import { GenerateReposButton } from "@/components/generate-repos-button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useGitHubData } from "@/hooks/use-github-data";

const homeLinks = [
  { href: "#features", label: "Features" },
  { href: "#how-it-works", label: "How It Works" },
  { href: "#get-started", label: "Get Started" },
];

function LandingThemeSwitcher() {
  const [mounted, setMounted] = useState(false);
  const { setTheme, theme } = useTheme();

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = mounted && theme === "dark";

  return (
    <motion.button
      aria-label={`Switch to ${isDark ? "light" : "dark"} theme`}
      className="rounded-full p-2 hover:bg-default-100 transition-colors relative overflow-hidden"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      type="button"
      whileTap={{ scale: 0.85, rotate: isDark ? -90 : 90 }}
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={isDark ? "sun" : "moon"}
          initial={{ opacity: 0, rotate: -90, scale: 0.5 }}
          animate={{ opacity: 1, rotate: 0, scale: 1 }}
          exit={{ opacity: 0, rotate: 90, scale: 0.5 }}
          transition={{ duration: 0.2 }}
          className="block"
        >
          {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </motion.span>
      </AnimatePresence>
    </motion.button>
  );
}

/**
 * Landing page header — plain HTML matching the Figma design.
 * Taller, sticky with backdrop blur, logo icon, spacious nav.
 */
function LandingHeader({ isAuthenticated }: { isAuthenticated: boolean }) {
  return (
    <header
      className="w-full border-b border-divider bg-background/80 backdrop-blur-sm sticky top-0 z-50"
      data-testid="navbar"
    >
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between relative">
        <a href="/">
          <BrandLogo />
        </a>

        <nav className="hidden md:flex items-center gap-8 absolute left-1/2 -translate-x-1/2">
          {homeLinks.map((link) => (
            <motion.a
              className="text-default-500 hover:text-foreground transition-colors"
              href={link.href}
              key={link.href}
              onClick={(e) => {
                e.preventDefault();
                const target = document.querySelector(link.href);
                target?.scrollIntoView({ behavior: "smooth" });
              }}
              whileHover={{ y: -1 }}
              whileTap={{ scale: 0.95 }}
            >
              {link.label}
            </motion.a>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <LandingThemeSwitcher />
          {isAuthenticated && (
            <a
              className="inline-flex items-center px-4 py-2 rounded-lg bg-[var(--brand-blue)] text-white text-sm font-medium hover:opacity-90 transition-opacity"
              href="/dashboard"
            >
              Go to Dashboard
            </a>
          )}
        </div>
      </div>
    </header>
  );
}

/**
 * Dashboard header — plain Tailwind with user dropdown.
 */
function DashboardHeader({
  handleLogout,
  isDevelopment,
  user,
}: {
  handleLogout: () => void;
  isDevelopment: boolean;
  user: ReturnType<typeof useGitHubData>["user"];
}) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const closeDropdown = useCallback(() => {
    setDropdownOpen(false);
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        closeDropdown();
      }
    }

    if (dropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [dropdownOpen, closeDropdown]);

  // Close on Escape
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        closeDropdown();
      }
    }

    if (dropdownOpen) {
      document.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [dropdownOpen, closeDropdown]);

  return (
    <header
      className="w-full border-b border-divider bg-background/80 backdrop-blur-sm sticky top-0 z-50"
      data-testid="navbar"
    >
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Brand + dev tools */}
        <div className="flex items-center gap-3">
          <a href="/">
            <BrandLogo />
          </a>
          {isDevelopment && <GenerateReposButton />}
        </div>

        {/* Right side */}
        <div className="flex items-center gap-3">
          <LandingThemeSwitcher />

          {/* User dropdown */}
          <div className="relative" ref={dropdownRef}>
            <Button
              className="cursor-pointer transition-opacity hover:opacity-80 gap-3 h-auto px-2 py-1"
              onClick={() => setDropdownOpen((prev) => !prev)}
              variant="ghost"
            >
              {/* Avatar */}
              <Avatar className="h-8 w-8">
                <AvatarImage
                  src={user?.avatarUrl as string}
                  alt={`${user?.name ?? user?.login ?? "User"}'s avatar`}
                />
                <AvatarFallback>
                  {(user?.name ?? user?.login ?? "?").charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              {/* Name + link */}
              <div className="text-left hidden sm:block leading-tight">
                <div className="text-sm font-medium text-foreground">
                  {user?.name}
                </div>
                <a
                  className="text-xs text-[var(--brand-link)] hover:underline leading-none"
                  href={(user?.url as string) ?? "https://github.com"}
                  onClick={(e) => e.stopPropagation()}
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  {user?.login}
                </a>
              </div>
            </Button>

            {/* Dropdown menu */}
            {dropdownOpen && (
              <div className="absolute right-0 mt-2 w-48 rounded-lg border border-divider bg-content1 shadow-lg z-50">
                <div className="px-4 py-3 border-b border-divider">
                  <p className="text-sm font-semibold text-foreground">
                    Signed in as
                  </p>
                  <p className="text-sm font-semibold text-foreground">
                    {user?.name}
                  </p>
                </div>
                <Button
                  className="w-full justify-start px-4 py-2 text-danger hover:bg-danger-50 dark:hover:bg-danger-900/20 rounded-t-none rounded-b-lg transition-colors"
                  onClick={() => {
                    closeDropdown();
                    handleLogout();
                  }}
                  variant="ghost"
                >
                  Log Out
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

export default function Header() {
  const { pathname } = useLocation();
  const { isAuthenticated, logout, user } = useGitHubData();

  const isDashboard = pathname === "/dashboard";
  const hasDemoParam = new URLSearchParams(window.location.search).has("demo");
  const isDevelopment = import.meta.env.DEV || hasDemoParam;

  function handleLogout() {
    logout();
    // Force full reload to clear SWR cache and React state
    window.location.href = "/";
  }

  if (isDashboard) {
    return (
      <DashboardHeader
        handleLogout={handleLogout}
        isDevelopment={isDevelopment}
        user={user}
      />
    );
  }

  return <LandingHeader isAuthenticated={isAuthenticated} />;
}
