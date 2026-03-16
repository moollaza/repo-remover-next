import * as Fathom from "fathom-client";
import { useEffect } from "react";
import { useLocation } from "react-router-dom";

export function FathomAnalytics() {
  const location = useLocation();

  useEffect(() => {
    const siteId = import.meta.env.VITE_FATHOM_SITE_ID;
    if (!siteId) {
      if (import.meta.env.DEV) {
        console.warn("Fathom Analytics: VITE_FATHOM_SITE_ID not set");
      }
      return;
    }

    Fathom.load(siteId, {
      auto: false,
      excludedDomains: ["localhost", "127.0.0.1"],
      includedDomains: ["reporemover.xyz"],
    });
  }, []);

  useEffect(() => {
    const url = location.pathname + location.search;
    Fathom.trackPageview({
      url,
      referrer: document.referrer,
    });
  }, [location.pathname, location.search]);

  return null;
}
