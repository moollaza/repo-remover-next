// This file is used to register server and edge instrumentation
// It should be in the root of your project and not inside the app or pages directory
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

export async function register() {
  // Only load Sentry in production
  if (process.env.NODE_ENV === 'production' && process.env.NEXT_PUBLIC_SENTRY_DSN) {
    if (process.env.NEXT_RUNTIME === 'nodejs') {
      // Server-side instrumentation
      await import('./sentry.server.config');
    }

    if (process.env.NEXT_RUNTIME === 'edge') {
      // Edge runtime instrumentation (same as server for this use case)
      await import('./sentry.server.config');
    }
  }
}