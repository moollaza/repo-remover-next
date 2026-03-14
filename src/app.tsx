import { Navigate, Route, Routes } from "react-router-dom";

import { config } from "@fortawesome/fontawesome-svg-core";
import "@fortawesome/fontawesome-svg-core/styles.css";

import { ErrorBoundary } from "@/components/error-boundary";
import { FathomAnalytics } from "@/components/fathom-analytics";
import Footer from "@/components/footer";
import Header from "@/components/header";
import { Providers } from "@/providers/providers";
import { Dashboard } from "@/routes/dashboard";
import { Home } from "@/routes/home";

config.autoAddCss = false;

export function App() {
  return (
    <Providers themeProps={{ attribute: "class", defaultTheme: "light" }}>
      <ErrorBoundary>
        <FathomAnalytics />
        <div className="min-h-full">
          <div className="border-b border-divider">
            <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
              <Header />
            </div>
          </div>
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <main>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </main>
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
