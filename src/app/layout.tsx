import { config } from "@fortawesome/fontawesome-svg-core";
import clsx from "clsx";
import { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "@fortawesome/fontawesome-svg-core/styles.css";

import { Providers } from "@/providers/providers";
import { Header } from "@components/header";
import "@/globals.css";

config.autoAddCss = false;

const inter = Inter({ subsets: ["latin"] });

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
      <body
        className={clsx(
          inter.className,
          "min-h-screen bg-background font-sans antialiased",
        )}
      >
        <Providers themeProps={{ attribute: "class", defaultTheme: "light" }}>
          <div className="relative flex flex-col h-screen">
            <Header />
            {children}
          </div>
        </Providers>
      </body>
    </html>
  );
}
