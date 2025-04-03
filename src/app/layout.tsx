// src/app/layout.tsx
import { Metadata, Viewport } from "next";

import LayoutContent, { bodyClasses } from "./layout-content";

export const viewport: Viewport = {
  themeColor: [
    { color: "white", media: "(prefers-color-scheme: light)" },
    { color: "black", media: "(prefers-color-scheme: dark)" },
  ],
};

export const metadata: Metadata = {
  description:
    "Repo Remover makes it easy to archive and delete multiple GitHub repos at the same time. Free to use, and 100% open source.",
  title: "Repo Remover | Cleanup your GitHub repos with ease.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={bodyClasses}>
        <LayoutContent>{children}</LayoutContent>
      </body>
    </html>
  );
}
