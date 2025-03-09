import { config } from "@fortawesome/fontawesome-svg-core";
import clsx from "clsx";
import { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "@fortawesome/fontawesome-svg-core/styles.css";

import { Providers } from "@/providers/providers";
import Footer from "@components/footer";
import Header from "@components/header";
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
          "h-full bg-background font-sans antialiased",
        )}
      >
        <Providers themeProps={{ attribute: "class", defaultTheme: "light" }}>
          <div className="min-h-full">
            <div className="border-b border-gray-200">
              <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
                <Header />
              </div>
            </div>
            <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
              <main>{children}</main>
            </div>

            <div className="px-4 sm:px-6 lg:px-8 bg-gray-100">
              <Footer />
            </div>
          </div>
        </Providers>
      </body>
    </html>
  );
}
