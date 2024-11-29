import clsx from "clsx";
import { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";

import { Providers } from "./providers";

import "@/globals.css";

// Font Awesome
import { config } from "@fortawesome/fontawesome-svg-core";
import "@fortawesome/fontawesome-svg-core/styles.css";
config.autoAddCss = false;

const inter = Inter({ subsets: ["latin"] });

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "white" },
    { media: "(prefers-color-scheme: dark)", color: "black" },
  ],
};

export const metadata: Metadata = {
  title: "Repo Remover | Cleanup your GitHub repos with ease.",
  description:
    "Repo Remover makes it easy to archive and delete multiple GitHub repos at the same time. Free to use, and 100% open source.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html suppressHydrationWarning lang="en">
      <body
        className={clsx(
          inter.className,
          "min-h-screen bg-background font-sans antialiased",
        )}
      >
        <Providers themeProps={{ attribute: "class", defaultTheme: "light" }}>
          <div className="relative flex flex-col h-screen">{children}</div>
        </Providers>
      </body>
    </html>
  );
}
