import React from "react";
import { useNavigate } from "react-router-dom";

import GitHubTokenForm from "@/components/github-token-form";
import { useGitHubData } from "@/hooks/use-github-data";

export default function TokenFormSection() {
  // Pre-populate with dev token if available (development only)
  const devToken: string | undefined = import.meta.env.DEV
    ? (import.meta.env.VITE_GITHUB_DEV_TOKEN as string | undefined)
    : undefined;
  const [value, setValue] = React.useState<string>(devToken ?? "");
  const { setPat } = useGitHubData();
  const navigate = useNavigate();

  const handleSubmit = (token: string) => {
    setPat(token);
    void navigate("/dashboard");
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
