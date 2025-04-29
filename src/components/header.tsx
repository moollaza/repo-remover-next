"use client";

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
import { usePathname } from "next/navigation";

import { GenerateReposButton } from "@/components/generate-repos-button";
import { useGitHubData } from "@/hooks/use-github-data";

const homeLinks = [
  { href: "#features", label: "Features" },
  { href: "#how-it-works", label: "How It Works" },
  { href: "#get-started", label: "Get Started" },
];

export default function Header() {
  const pathname = usePathname();
  const { login, pat, user } = useGitHubData();

  const isDashboard = pathname === "/dashboard";
  const isDevelopment = process.env.NODE_ENV === "development";

  // Clear the localStorage and redirect to the homepage
  function handleLogout() {
    if (typeof localStorage !== "undefined") {
      localStorage.clear();
      // Force a reload to clear the cache
      window.location.href = "/";
    }
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
        {isDashboard ? (
          <>
            {isDevelopment && <GenerateReposButton />}

            <Dropdown placement="bottom-end">
              <DropdownTrigger>
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
          pat &&
          login && (
            <Button as={Link} color="primary" href="/dashboard" variant="flat">
              Go to Dashboard
            </Button>
          )
        )}
      </NavbarContent>
    </Navbar>
  );
}
