import { config } from "@fortawesome/fontawesome-svg-core";
import "@fortawesome/fontawesome-svg-core/styles.css";
import clsx from "clsx";
import { Inter } from "next/font/google";

import { Providers } from "@/providers/providers";
import Footer from "@components/footer";
import Header from "@components/header";
import "@/globals.css";

config.autoAddCss = false;

const inter = Inter({ subsets: ["latin"] });

// Export the body classes for reuse in Storybook
export const bodyClasses = clsx(
  inter.className,
  "h-full bg-background font-sans antialiased",
);

export default function LayoutContent({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <Providers themeProps={{ attribute: "class", defaultTheme: "light" }}>
      <div className="min-h-full">
        {/* Layout content */}
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
  );
}
