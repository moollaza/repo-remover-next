"use client";

import { useRouter } from "next/navigation";
import React from "react";

import GitHubTokenForm from "@/components/github-token-form";
import { useGitHubData } from "@/hooks/use-github-data";

export default function TokenFormSection() {
  const [value, setValue] = React.useState("");
  const { setPat } = useGitHubData();
  const router = useRouter();

  const handleSubmit = (token: string) => {
    setPat(token);
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