// This file configures the initialization of Sentry for edge features (middleware, edge routes, and so on).
// The config you add here will be used whenever one of the edge features is loaded.
// Note that this config is unrelated to the Vercel Edge Runtime and is also applied to Node.js-based edge features.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  
  // Only enable in production
  enabled: process.env.NODE_ENV === 'production' && Boolean(process.env.NEXT_PUBLIC_SENTRY_DSN),
  
  environment: process.env.NODE_ENV,

  // Privacy-first configuration for server-side
  beforeSend: (event) => {
    // Don't send if not in production
    if (process.env.NODE_ENV !== 'production') {
      return null;
    }

    // Remove IP addresses for maximum privacy
    if (event.user?.ip_address) {
      delete event.user.ip_address;
    }

    // Remove sensitive headers
    if (event.request?.headers) {
      delete event.request.headers['authorization'];
      delete event.request.headers['cookie'];
      delete event.request.headers['x-auth-token'];
    }

    return event;
  },

  // Minimal performance monitoring
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 0,

});