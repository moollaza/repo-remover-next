import {
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownTrigger,
  Link,
  Navbar,
  NavbarBrand,
  NavbarContent,
  User,
} from "@heroui/react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
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
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        <a className="flex items-center gap-2" href="/">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-white font-bold text-sm">
            R
          </div>
          <span className="font-semibold text-lg">Repo Remover</span>
        </a>

        <nav className="hidden md:flex items-center gap-8">
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
              className="inline-flex items-center px-4 py-2 rounded-lg bg-primary text-white text-sm font-medium hover:opacity-90 transition-opacity"
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
 * Dashboard header — HeroUI Navbar with user dropdown.
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
  return (
    <Navbar
      className="border-b border-divider"
      classNames={{ wrapper: "mx-auto max-w-6xl px-4 sm:px-6 lg:px-8" }}
      data-testid="navbar"
      maxWidth="full"
      position="static"
    >
      <NavbarBrand>
        <Link className="font-extrabold text-inherit text-xl" href="/">
          Repo Remover
        </Link>
      </NavbarBrand>

      <NavbarContent justify="end">
        <LandingThemeSwitcher />
        {isDevelopment && <GenerateReposButton />}

        <Dropdown placement="bottom-end">
          <DropdownTrigger>
            <div className="cursor-pointer transition-opacity hover:opacity-80">
              <User
                avatarProps={{
                  showFallback: true,
                  src: user?.avatarUrl as string,
                }}
                description={
                  <Link
                    href={(user?.url as string) ?? "https://github.com"}
                    isExternal
                    size="sm"
                  >
                    {user?.login}
                  </Link>
                }
                name={user?.name}
              />
            </div>
          </DropdownTrigger>
          <DropdownMenu aria-label="Profile Actions" variant="flat">
            <DropdownItem className="h-14 gap-2" key="profile">
              <p className="font-semibold">Signed in as</p>
              <p className="font-semibold">{user?.name}</p>
            </DropdownItem>
            <DropdownItem color="danger" key="logout" onPress={handleLogout}>
              Log Out
            </DropdownItem>
          </DropdownMenu>
        </Dropdown>
      </NavbarContent>
    </Navbar>
  );
}

export default function Header() {
  const { pathname } = useLocation();
  const { isAuthenticated, user } = useGitHubData();

  const isDashboard = pathname === "/dashboard";
  const isDevelopment = import.meta.env.DEV;

  function handleLogout() {
    if (typeof localStorage !== "undefined") {
      localStorage.clear();
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
