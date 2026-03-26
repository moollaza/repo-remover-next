import { type ErrorEvent } from "@sentry/react";

import { sanitizeTokens } from "./sanitize-tokens";

/** Scrub GitHub tokens and PII from Sentry events before transmission. */
export function sentryBeforeSend(event: ErrorEvent): ErrorEvent {
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
}
