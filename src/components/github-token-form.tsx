"use client";

import { Button, Checkbox, Input } from "@heroui/react";
import clsx from "clsx";
import { useRouter } from "next/navigation";
import { useEffect, useReducer, useState } from "react";

import { useGitHubData } from "@/providers/github-data-provider";

type Action =
  | { error: string; type: "validate_error" }
  | { type: "reset" }
  | { type: "validate_start" }
  | { type: "validate_success" };

interface State {
  error: null | string;
  isValidated: boolean;
  isValidating: boolean;
}

export default function GitHubTokenForm({ className }: { className?: string }) {
  const {
    isError,
    isLoading: isProviderValidating,
    login,
    pat,
    setLogin,
    setPat,
  } = useGitHubData();

  // For backward compatibility
  const validateToken = async (token: string) => {
    setPat(token);
    return true;
  };

  const remember = true; // Always remember in the new implementation
  const setRemember = () => {}; // No-op, always remembers
  const providerError = isError ? "Error validating token" : null;
  const [value, setValue] = useState("");
  const [state, dispatch] = useReducer(reducer, {
    error: null,
    isValidated: false,
    isValidating: false,
  });
  const router = useRouter();

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    // If not validated, trigger validation
    if (!state.isValidated) {
      await validateToken(value);
      return;
    }

    // If validated, set PAT and navigate
    if (state.isValidated) {
      setPat(value);
      void router.push("/dashboard");
    }
  }

  useEffect(() => {
    let isSubscribed = true;

    async function validate() {
      if (value === "") {
        dispatch({ type: "reset" });
        return;
      }

      dispatch({ type: "validate_start" });
      const isValid = await validateToken(value);

      if (!isSubscribed) return;

      if (isValid) {
        dispatch({ type: "validate_success" });
      } else {
        dispatch({
          error: providerError ?? "Failed to validate token",
          type: "validate_error",
        });
      }
    }

    void validate();

    return () => {
      isSubscribed = false;
    };
  }, [value, validateToken, providerError]);

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
          color={state.isValidated ? "success" : undefined}
          errorMessage={state.error}
          isClearable
          isInvalid={Boolean(state.error)}
          label="Please enter your Personal Access Token"
          name="personal-access-token"
          onChange={(e) => setValue(e.target.value)}
          onClear={() => setValue("")}
          required
          type="text"
          value={value}
        />

        <Checkbox isSelected={remember} onValueChange={setRemember}>
          Remember me (token is stored locally, on your device)
        </Checkbox>
      </div>

      <Button
        className="w-20"
        color="primary"
        isDisabled={!state.isValidated || value === ""}
        isLoading={state.isValidating || isProviderValidating}
        type="submit"
      >
        Submit
      </Button>
    </form>
  );
}

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "reset":
      return { error: null, isValidated: false, isValidating: false };
    case "validate_error":
      return {
        error: action.error,
        isValidated: false,
        isValidating: false,
      };
    case "validate_start":
      return { ...state, error: null, isValidating: true };
    case "validate_success":
      return { error: null, isValidated: true, isValidating: false };
    default:
      throw new Error("Unknown action type");
  }
}
