import { config } from "@fortawesome/fontawesome-svg-core";
import { Navigate, Route, Routes } from "react-router-dom";
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
          <main>
            <Routes>
              {/* Home is full-width — sections handle their own max-width */}
              <Route element={<Home />} path="/" />
              {/* Dashboard is constrained */}
              <Route
                element={
                  <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
                    <Dashboard />
                  </div>
                }
                path="/dashboard"
              />
              <Route element={<Navigate replace to="/" />} path="*" />
            </Routes>
          </main>
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
