import type { Metadata } from "next";
import { Inter } from "next/font/google";
import clsx from "clsx";

import GitHubProvider from "@providers/github-provider";

import "@/globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "RepoRemover | Cleanup your GitHub repos with ease.",
  description:
    "Repo Remover makes it easy to archive and delete multiple GitHub repos at the same time. Free to use, and 100% open source.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <GitHubProvider>
      <html lang="en">
        <body
          className={clsx(
            inter.className,
            "antialiased min-h-screen flex flex-col",
          )}
        >
          <header className="p-4">{/* TODO */}</header>

          <main className="flex-grow p-4">{children}</main>

          <footer className="p-4">
            Repo Remover by <a href="https://zaahir.ca">Zaahir Moolla</a> |
            Copyright © 2024
          </footer>
        </body>
      </html>
    </GitHubProvider>
  );
}
