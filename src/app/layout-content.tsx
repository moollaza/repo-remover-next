import { config } from "@fortawesome/fontawesome-svg-core";
import "@fortawesome/fontawesome-svg-core/styles.css";
import clsx from "clsx";
import { Inter } from "next/font/google";

import { ErrorBoundary } from "@/components/error-boundary";
import Footer from "@/components/footer";
import Header from "@/components/header";
import { Providers } from "@/providers/providers";
import "@/globals.css";

config.autoAddCss = false;

const inter = Inter({ subsets: ["latin"] });

// Export the body classes for reuse in Storybook
export const bodyClasses = clsx(
  inter.className,
  "h-full bg-background text-foreground font-sans antialiased",
);

export default function LayoutContent({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <Providers themeProps={{ attribute: "class", defaultTheme: "light" }}>
      <ErrorBoundary>
        <div className="min-h-full">
          {/* Layout content */}
          <div className="border-b border-divider">
            <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
              <Header />
            </div>
          </div>
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <main>{children}</main>
          </div>
          <div className="bg-content1">
            <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
              <Footer />
            </div>
          </div>
        </div>
      </ErrorBoundary>
    </Providers>
  );
}
