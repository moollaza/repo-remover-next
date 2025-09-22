// This file configures the initialization of Sentry on the browser side.
// The config you add here will be used whenever a users loads a page in their browser.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

Sentry.init({
  // Privacy-first configuration
  beforeSend: (event) => {
    // Don't send if not in production
    if (process.env.NODE_ENV !== "production") {
      return null;
    }

    // Remove IP addresses for maximum privacy
    if (event.user?.ip_address) {
      delete event.user.ip_address;
    }

    // Remove sensitive headers
    if (event.request?.headers) {
      delete event.request.headers.Authorization;
      delete event.request.headers.Cookie;
      delete event.request.headers["X-Auth-Token"];
    }

    // Sanitize GitHub tokens from error messages and data
    const sanitizeTokens = (text: string): string => {
      return text
        .replace(/ghp_[a-zA-Z0-9]{36}/g, "[REDACTED_PAT]")
        .replace(/github_pat_[a-zA-Z0-9_]+/g, "[REDACTED_PAT]")
        .replace(/Bearer\s+[a-zA-Z0-9_.-]+/g, "Bearer [REDACTED]");
    };

    // Sanitize error messages
    if (event.message) {
      event.message = sanitizeTokens(event.message);
    }

    // Sanitize exception values
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

    // Sanitize breadcrumbs
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

  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Only enable in production
  enabled:
    process.env.NODE_ENV === "production" &&
    Boolean(process.env.NEXT_PUBLIC_SENTRY_DSN),

  environment: process.env.NODE_ENV,

  // Minimal integrations for privacy
  integrations: [
    // Disable session recording and replay
    // Only capture errors, not user behavior
  ],

  // Limit breadcrumbs to reduce data collection
  maxBreadcrumbs: 10,

  // Performance monitoring settings
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 0,
});
