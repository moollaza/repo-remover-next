// Fathom Analytics utilities for privacy-first usage tracking
// Only active in production with proper environment variables
// Sentry handles error tracking separately

import * as Fathom from 'fathom-client';

// Configuration constants
const IS_PRODUCTION = process.env.NODE_ENV === 'production';
const FATHOM_SITE_ID = process.env.NEXT_PUBLIC_FATHOM_SITE_ID;

// Initialize Fathom in production only
let fathomInitialized = false;

const initializeFathom = () => {
  if (!IS_PRODUCTION || !FATHOM_SITE_ID || fathomInitialized) {
    return;
  }

  try {
    Fathom.load(FATHOM_SITE_ID, {
      // Privacy-first settings
      excludedDomains: ['localhost', '127.0.0.1'], // Never track locally
      includedDomains: ['repo-remover.com'], // Only track on production domain
      spa: 'auto', // Single page app tracking
    });
    fathomInitialized = true;
  } catch (error) {
    console.warn('Failed to initialize Fathom Analytics:', error);
  }
};

// Analytics interface (Fathom only - Sentry handles errors automatically)
export const analytics = {
  /**
   * Initialize analytics (call once in app root)
   */
  init: () => {
    initializeFathom();
  },

  /**
   * Track page views (automatic with Fathom in SPA mode)
   */
  pageView: (url?: string) => {
    if (!IS_PRODUCTION || !fathomInitialized) {
      return; // No-op in development
    }

    try {
      Fathom.trackPageview({ url });
    } catch (error) {
      console.warn('Failed to track page view:', error);
    }
  },

  /**
   * Track custom events using Fathom goals (use sparingly to respect privacy)
   */
  track: (eventName: string, value?: number) => {
    if (!IS_PRODUCTION || !fathomInitialized) {
      return; // No-op in development
    }

    try {
      // Map common events to Fathom goals (production goal IDs from existing setup)
      const eventMap: Record<string, string> = {
        'get_started_click': 'RYC0QQCP',
        'repos_archived': 'WW8IOKY2', 
        'repos_deleted': 'XNGNSEXJ',
        'token_validated': 'TOKEN_VALID',
      };

      const goalId = eventMap[eventName];
      if (goalId) {
        // Use goal ID directly for production goals, or environment variable for new goals
        if (['RYC0QQCP', 'WW8IOKY2', 'XNGNSEXJ'].includes(goalId)) {
          Fathom.trackGoal(goalId, value ?? 0);
        } else if (process.env[`NEXT_PUBLIC_FATHOM_${goalId}`]) {
          Fathom.trackGoal(process.env[`NEXT_PUBLIC_FATHOM_${goalId}`]!, value ?? 0);
        }
      }
    } catch (error) {
      console.warn('Failed to track event:', error);
    }
  },
};

// Development helpers
if (!IS_PRODUCTION) {
  // Override console methods to show what would be tracked
  const originalTrack = analytics.track;
  analytics.track = (eventName: string, value?: number) => {
    console.log(`[DEV] Would track event: ${eventName}`, value ? `(value: ${value})` : '');
    return originalTrack(eventName, value);
  };

  const originalPageView = analytics.pageView;
  analytics.pageView = (url?: string) => {
    console.log(`[DEV] Would track page view:`, url ?? 'current page');
    return originalPageView(url);
  };
}

export default analytics;