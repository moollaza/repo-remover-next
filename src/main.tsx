import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import * as Sentry from "@sentry/react";

import { App } from "./app";

import "./globals.css";

// Sentry initialization — privacy-first (ported from instrumentation-client.ts)
const SENTRY_DSN = import.meta.env.VITE_SENTRY_DSN;
if (SENTRY_DSN && import.meta.env.PROD) {
  const sanitizeTokens = (text: string): string => {
    return text
      .replace(/ghp_[a-zA-Z0-9]{36}/g, "[REDACTED_PAT]")
      .replace(/github_pat_[a-zA-Z0-9_]+/g, "[REDACTED_PAT]")
      .replace(/Bearer\s+[a-zA-Z0-9_.-]+/g, "Bearer [REDACTED]");
  };

  Sentry.init({
    dsn: SENTRY_DSN,
    enabled: import.meta.env.PROD,
    environment: import.meta.env.MODE,
    tracesSampleRate: 0.1,
    maxBreadcrumbs: 10,
    beforeSend(event) {
      if (event.user?.ip_address) {
        delete event.user.ip_address;
      }
      if (event.request?.headers) {
        delete event.request.headers.Authorization;
        delete event.request.headers.Cookie;
        delete event.request.headers["X-Auth-Token"];
      }
      if (event.message) {
        event.message = sanitizeTokens(event.message);
      }
      if (event.exception?.values) {
        event.exception.values.forEach((exception) => {
          if (exception.value) {
            exception.value = sanitizeTokens(exception.value);
          }
          if (exception.stacktrace?.frames) {
            exception.stacktrace.frames.forEach((frame) => {
              if (frame.vars) {
                Object.keys(frame.vars).forEach((key) => {
                  if (typeof frame.vars![key] === "string") {
                    frame.vars![key] = sanitizeTokens(frame.vars![key]);
                  }
                });
              }
            });
          }
        });
      }
      if (event.breadcrumbs) {
        event.breadcrumbs.forEach((breadcrumb) => {
          if (breadcrumb.message) {
            breadcrumb.message = sanitizeTokens(breadcrumb.message);
          }
          if (breadcrumb.data) {
            Object.keys(breadcrumb.data).forEach((key) => {
              if (typeof breadcrumb.data![key] === "string") {
                breadcrumb.data![key] = sanitizeTokens(breadcrumb.data![key]);
              }
            });
          }
        });
      }
      return event;
    },
  });
}

createRoot(document.getElementById("root")!).render(
  <BrowserRouter>
    <App />
  </BrowserRouter>,
);
