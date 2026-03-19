/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import * as Sentry from "@sentry/react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";

import { App } from "./app";
import { sanitizeTokens } from "./utils/sanitize-tokens";
import "./globals.css";

// Sentry initialization — privacy-first (ported from instrumentation-client.ts)
const SENTRY_DSN = import.meta.env.VITE_SENTRY_DSN;
if (SENTRY_DSN && import.meta.env.PROD) {
  Sentry.init({
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
