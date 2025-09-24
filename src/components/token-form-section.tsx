"use client";

import { useRouter } from "next/navigation";
import React from "react";

import GitHubTokenForm from "@/components/github-token-form";
import { useGitHubData } from "@/hooks/use-github-data";
import { analytics } from "@/utils/analytics";

export default function TokenFormSection() {
  // Pre-populate with dev token if available (development only)
  const devToken = process.env.NODE_ENV === 'development' ? process.env.NEXT_PUBLIC_GITHUB_DEV_TOKEN : undefined;
  const [value, setValue] = React.useState(devToken ?? "");
  const { setPat } = useGitHubData();
  const router = useRouter();

  const handleSubmit = (token: string) => {
    setPat(token);

    // Track successful token validation
    analytics.trackTokenValidated();

    router.push("/dashboard");
  };

  return (
    <div className="pt-10" id="github-token-form">
      <GitHubTokenForm
        onSubmit={handleSubmit}
        onValueChange={setValue}
        value={value}
      />
    </div>
  );
}