import {
  Button,
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownTrigger,
  Link,
  Navbar,
  NavbarBrand,
  NavbarContent,
  NavbarItem,
  User,
} from "@heroui/react";
import { useLocation } from "react-router-dom";

import { GenerateReposButton } from "@/components/generate-repos-button";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { useGitHubData } from "@/hooks/use-github-data";

const homeLinks = [
  { href: "#features", label: "Features" },
  { href: "#how-it-works", label: "How It Works" },
  { href: "#get-started", label: "Get Started" },
];

export default function Header() {
  const { pathname } = useLocation();
  const { isAuthenticated, logout, user } = useGitHubData();

  const isDashboard = pathname === "/dashboard";
  const isDevelopment = import.meta.env.DEV;

  function handleLogout() {
    logout();
    // Force a full reload to clear SWR cache and React state
    window.location.href = "/";
  }

  return (
    <Navbar
      classNames={{
        wrapper: "px-0",
      }}
      data-testid="navbar"
      maxWidth="full"
      position="static"
    >
      <NavbarBrand>
        <Link className="font-extrabold text-inherit text-xl" href="/">
          Repo Remover
        </Link>
      </NavbarBrand>

      {!isDashboard && (
        <NavbarContent className="hidden sm:flex gap-4" justify="center">
          {homeLinks.map((link) => (
            <NavbarItem key={link.href}>
              <Link
                className="hover:text-primary"
                color="foreground"
                href={link.href}
                onClick={(e) => e.preventDefault()}
                onPress={() => {
                  const target = document.querySelector(link.href);
                  if (target) {
                    target.scrollIntoView({ behavior: "smooth" });
                  }
                }}
              >
                {link.label}
              </Link>
            </NavbarItem>
          ))}
        </NavbarContent>
      )}

      <NavbarContent justify="end">
        <ThemeSwitcher />

        {isDashboard ? (
          <>
            {isDevelopment && <GenerateReposButton />}

            <Dropdown placement="bottom-end">
              <DropdownTrigger>
                <button
                  aria-label={`User menu for ${user?.name ?? user?.login ?? "User"}`}
                  className="cursor-pointer transition-opacity hover:opacity-80 appearance-none bg-transparent border-none p-0"
                  type="button"
                >
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
                </button>
              </DropdownTrigger>
              <DropdownMenu aria-label="Profile Actions" variant="flat">
                <DropdownItem className="h-14 gap-2" key="profile">
                  <p className="font-semibold">Signed in as</p>
                  <p className="font-semibold">{user?.name}</p>
                </DropdownItem>
                <DropdownItem
                  color="danger"
                  key="logout"
                  onPress={handleLogout}
                >
                  Log Out
                </DropdownItem>
              </DropdownMenu>
            </Dropdown>
          </>
        ) : (
          isAuthenticated && (
            <Button as={Link} color="primary" href="/dashboard" variant="flat">
              Go to Dashboard
            </Button>
          )
        )}
      </NavbarContent>
    </Navbar>
  );
}
