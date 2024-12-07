"use client";

import { Button, Checkbox, Input } from "@nextui-org/react";
import clsx from "clsx";
import { useRouter } from "next/navigation";
import { useEffect, useReducer, useState } from "react";

import { useGitHub } from "@/providers/github-provider";

type Action = { isValid: boolean; type: "validate"; } | { type: "reset" };
type State = "idle" | "invalid" | "validated";

export default function GitHubTokenForm({ className }: { className?: string }) {
  const { remember, setPat, setRemember } = useGitHub();
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
      dispatch({ isValid, type: "validate" });
    }
  }, [value]);

  return (
    <form
      className={clsx("flex flex-col gap-10", className)}
      onSubmit={onSubmit}
    >
      <div className="flex flex-col gap-4">
        <Input
          autoComplete="off"
          className={"w-1/2"}
          color={state === "validated" ? "success" : undefined}
          errorMessage={state === "invalid" ? "Invalid token format" : ""}
          isClearable
          isInvalid={state === "invalid"}
          label="Please enter your Personal Access Token"
          maxLength={40}
          minLength={40}
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
        isDisabled={state !== "validated" || value === ""}
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
      return "idle";
    case "validate":
      return action.isValid ? "validated" : "invalid";
    default:
      throw new Error();
  }
}
