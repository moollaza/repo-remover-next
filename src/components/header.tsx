import { Moon, Sun, Trash2 } from "lucide-react";
import { useTheme } from "next-themes";
import { useCallback, useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";

import { GenerateReposButton } from "@/components/generate-repos-button";
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
    <button
      aria-label={`Switch to ${isDark ? "light" : "dark"} theme`}
      className="rounded-full p-2 hover:bg-default-100 transition-colors"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      type="button"
    >
      {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
    </button>
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
        <a className="flex items-center gap-2" href="/">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <Trash2 className="h-4 w-4 text-white" />
          </div>
          <span className="font-semibold text-lg">Repo Remover</span>
        </a>

        <nav className="hidden md:flex items-center gap-8 absolute left-1/2 -translate-x-1/2">
          {homeLinks.map((link) => (
            <a
              className="text-default-500 hover:text-foreground transition-colors"
              href={link.href}
              key={link.href}
              onClick={(e) => {
                e.preventDefault();
                const target = document.querySelector(link.href);
                target?.scrollIntoView({ behavior: "smooth" });
              }}
            >
              {link.label}
            </a>
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
          <a className="flex items-center gap-2" href="/">
            <div className="w-8 h-8 bg-[var(--brand-blue)] rounded-lg flex items-center justify-center">
              <Trash2 className="h-4 w-4 text-white" />
            </div>
            <span className="font-semibold text-lg">Repo Remover</span>
          </a>
          {isDevelopment && <GenerateReposButton />}
        </div>

        {/* Right side */}
        <div className="flex items-center gap-3">
          <LandingThemeSwitcher />

          {/* User dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              className="cursor-pointer transition-opacity hover:opacity-80 flex items-center gap-3"
              onClick={() => setDropdownOpen((prev) => !prev)}
              type="button"
            >
              {/* Avatar */}
              {user?.avatarUrl ? (
                <img
                  alt={`${user?.name ?? user?.login ?? "User"}'s avatar`}
                  className="w-8 h-8 rounded-full object-cover"
                  src={user.avatarUrl as string}
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-default-200 flex items-center justify-center text-default-500 text-sm font-medium">
                  {(user?.name ?? user?.login ?? "?").charAt(0).toUpperCase()}
                </div>
              )}
              {/* Name + link */}
              <div className="text-left hidden sm:block">
                <div className="text-sm font-medium text-foreground">
                  {user?.name}
                </div>
                <a
                  className="text-xs text-[var(--brand-link)] hover:underline"
                  href={(user?.url as string) ?? "https://github.com"}
                  onClick={(e) => e.stopPropagation()}
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  {user?.login}
                </a>
              </div>
            </button>

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
                <button
                  className="w-full text-left px-4 py-2 text-sm text-danger hover:bg-danger-50 dark:hover:bg-danger-900/20 rounded-b-lg transition-colors"
                  onClick={() => {
                    closeDropdown();
                    handleLogout();
                  }}
                  type="button"
                >
                  Log Out
                </button>
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
  const { isAuthenticated, user } = useGitHubData();

  const isDashboard = pathname === "/dashboard";
  const isDevelopment = import.meta.env.DEV;

  function handleLogout() {
    if (typeof localStorage !== "undefined") {
      // Only clear auth data — preserve theme and other preferences
      localStorage.removeItem("secure_pat");
      localStorage.removeItem("secure_login");
      window.location.href = "/";
    }
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
