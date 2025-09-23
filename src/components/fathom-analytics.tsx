"use client";

import { load, trackPageview } from "fathom-client";
import { usePathname, useSearchParams } from "next/navigation";
import { Suspense, useEffect } from "react";

export function FathomAnalytics() {
  return (
    <Suspense fallback={null}>
      <TrackPageView />
    </Suspense>
  );
}

function TrackPageView() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Initialize Fathom
  useEffect(() => {
    const siteId = process.env.NEXT_PUBLIC_FATHOM_SITE_ID;
    if (!siteId) {
      console.warn("Fathom Analytics: NEXT_PUBLIC_FATHOM_SITE_ID not found");
      return;
    }

    load(siteId, {
      auto: false, // We'll manually track page views
      excludedDomains: ["localhost", "127.0.0.1"], // Never track locally
      includedDomains: ["repo-remover.com"], // Only track on production domain
    });
  }, []);

  // Track page views on route changes
  useEffect(() => {
    if (!pathname) return;

    const url = pathname + (searchParams?.toString() ? `?${searchParams.toString()}` : "");
    
    trackPageview({
      referrer: document.referrer,
      url,
    });
  }, [pathname, searchParams]);

  return null;
}