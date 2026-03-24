/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import * as Sentry from "@sentry/react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";

import { App } from "./app";
import { sentryBeforeSend } from "./utils/sentry-before-send";
import "./globals.css";

// Sentry initialization — privacy-first (ported from instrumentation-client.ts)
const SENTRY_DSN = import.meta.env.VITE_SENTRY_DSN;
if (SENTRY_DSN && import.meta.env.PROD) {
  Sentry.init({
    beforeSend: sentryBeforeSend,
    dsn: SENTRY_DSN,
    enabled: import.meta.env.PROD,
    environment: import.meta.env.MODE,
    maxBreadcrumbs: 10,
    tracesSampleRate: 0.1,
  });
}

createRoot(document.getElementById("root")!).render(
  <BrowserRouter>
    <App />
  </BrowserRouter>,
);
