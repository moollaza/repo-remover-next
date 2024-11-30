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
} from "@nextui-org/react";
import { usePathname } from "next/navigation";

import { GenerateReposButton } from "@/components/generate-repos-button";
import useGitHubData from "@/hooks/use-github-data";
import { useGitHub } from "@/providers/github-provider";

const homeLinks = [
  { href: "#features", label: "Features" },
  { href: "#how-it-works", label: "How It Works" },
  { href: "#get-started", label: "Get Started" },
];

export function Header() {
  const pathname = usePathname();
  const { pat, login } = useGitHub();
  const { user } = useGitHubData();

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
    <Navbar isBordered position="static" maxWidth="xl">
      <NavbarBrand>
        <Link href="/" className="font-extrabold text-inherit text-xl">
          Repo Remover
        </Link>
      </NavbarBrand>

      {!isDashboard && (
        <NavbarContent className="hidden sm:flex gap-4" justify="center">
          {homeLinks.map((link) => (
            <NavbarItem key={link.href}>
              <Link
                color="foreground"
                href={link.href}
                className="hover:text-primary"
                onClick={(e) => {
                  e.preventDefault();
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
                  name={user?.name}
                  description={
                    <Link
                      href={`https://github.com/${user?.login}`}
                      size="sm"
                      isExternal
                    >
                      {user?.login}
                    </Link>
                  }
                  avatarProps={{
                    src: user?.avatarUrl as string,
                    showFallback: true,
                  }}
                />
              </DropdownTrigger>
              <DropdownMenu aria-label="Profile Actions" variant="flat">
                <DropdownItem key="profile" className="h-14 gap-2">
                  <p className="font-semibold">Signed in as</p>
                  <p className="font-semibold">{user?.name}</p>
                </DropdownItem>
                <DropdownItem
                  key="logout"
                  color="danger"
                  onClick={handleLogout}
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
