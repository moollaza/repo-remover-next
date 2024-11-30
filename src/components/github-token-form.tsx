"use client";

import { Button, Checkbox, Input } from "@nextui-org/react";
import clsx from "clsx";
import { useRouter } from "next/navigation";
import { useEffect, useReducer, useState } from "react";

import { useGitHub } from "@/providers/github-provider";

type State = "idle" | "invalid" | "validated";
type Action = { type: "validate"; isValid: boolean } | { type: "reset" };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "validate":
      return action.isValid ? "validated" : "invalid";
    case "reset":
      return "idle";
    default:
      throw new Error();
  }
}

export default function GitHubTokenForm({ className }: { className?: string }) {
  const { setPat, remember, setRemember } = useGitHub();
  const [value, setValue] = useState("");
  const [state, dispatch] = useReducer(reducer, "idle");
  const router = useRouter();

  function checkTokenFormat(token: string) {
    return token?.length >= 40 && /^[a-z0-9_]+$/i.test(token);
  }

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (state === "validated") {
      setPat(value);
      void router.push("/dashboard");
    }
  }

  useEffect(() => {
    if (value === "") {
      dispatch({ type: "reset" });
    } else {
      const isValid = checkTokenFormat(value);
      dispatch({ type: "validate", isValid });
    }
  }, [value]);

  return (
    <form
      onSubmit={onSubmit}
      className={clsx("flex flex-col gap-10", className)}
    >
      <div className="flex flex-col gap-4">
        <Input
          required
          isClearable
          name="personal-access-token"
          type="text"
          label="Please enter your Personal Access Token"
          maxLength={40}
          minLength={40}
          autoComplete="off"
          value={value}
          color={state === "validated" ? "success" : undefined}
          isInvalid={state === "invalid"}
          errorMessage={state === "invalid" ? "Invalid token format" : ""}
          onClear={() => setValue("")}
          className={"w-1/2"}
          onChange={(e) => setValue(e.target.value)}
        />

        <Checkbox isSelected={remember} onValueChange={setRemember}>
          Remember me (token is stored locally, on your device)
        </Checkbox>
      </div>

      <Button
        type="submit"
        isDisabled={state !== "validated" || value === ""}
        color="primary"
        className="w-20"
      >
        Submit
      </Button>
    </form>
  );
}
