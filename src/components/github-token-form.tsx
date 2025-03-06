"use client";

import { Button, Checkbox, Input } from "@heroui/react";
import clsx from "clsx";
import { useRouter } from "next/navigation";
import { useEffect, useReducer, useState } from "react";

import { useGitHubData } from "@/hooks/use-github-data";

// No need for complex state types anymore

export default function GitHubTokenForm({ className }: { className?: string }) {
  const {
    isError,
    isLoading: isProviderValidating,
    login,
    pat,
    setLogin,
    setPat,
  } = useGitHubData();

  // Simplified implementation that doesn't rely on complex validation logic
  const [value, setValue] = useState("");
  const [error, setError] = useState<null | string>(null);
  const router = useRouter();

  // Handle form submission
  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!value) return;

    try {
      // Set the PAT which will trigger validation in the provider
      setPat(value);

      // If there's an error, it will be set in the provider
      if (isError) {
        setError("Failed to validate token");
        return;
      }

      // If no error, navigate to dashboard
      router.push("/dashboard");
    } catch (err) {
      setError("Failed to validate token");
    }
  }

  return (
    <form
      className={clsx("flex flex-col gap-10", className)}
      onSubmit={(e) => {
        void onSubmit(e);
      }}
    >
      <div className="flex flex-col gap-4">
        <Input
          autoComplete="off"
          className={"w-1/2"}
          errorMessage={error}
          isClearable
          isInvalid={Boolean(error)}
          label="Please enter your Personal Access Token"
          name="personal-access-token"
          onChange={(e) => setValue(e.target.value)}
          onClear={() => setValue("")}
          required
          type="text"
          value={value}
        />

        <Checkbox isSelected={true}>
          Remember me (token is stored locally, on your device)
        </Checkbox>
      </div>

      <Button
        className="w-20"
        color="primary"
        isDisabled={value === ""}
        isLoading={isProviderValidating}
        type="submit"
      >
        Submit
      </Button>
    </form>
  );
}
