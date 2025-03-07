"use client";

import { Button, Checkbox, Input, type InputProps } from "@heroui/react";
import clsx from "clsx";
import { useEffect, useState } from "react";

import {
  createThrottledOctokit,
  isValidGitHubToken,
} from "@/utils/github-utils";

interface GitHubTokenFormProps {
  className?: string;
  onSubmit: (token: string) => void;
  onValueChange: (value: string) => void;
  value: string;
}

export default function GitHubTokenForm({
  className,
  onSubmit,
  onValueChange,
  value,
}: GitHubTokenFormProps) {
  const [error, setError] = useState<null | string>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [isTokenValid, setIsTokenValid] = useState(false);
  const [username, setUsername] = useState<null | string>(null);
  const [lastValidatedToken, setLastValidatedToken] = useState<null | string>(
    null,
  );

  // Handle value change
  const handleChange = (newValue: string) => {
    onValueChange(newValue);
    if (error) setError(null);
  };

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    let isMounted = true;

    const validateToken = async () => {
      if (
        !value ||
        !isValidGitHubToken(value) ||
        value === lastValidatedToken
      ) {
        return;
      }

      setIsValidating(true);
      setError(null);

      try {
        const octokit = createThrottledOctokit(value);
        const { data: userData } = await octokit.users.getAuthenticated();

        if (isMounted) {
          setIsTokenValid(true);
          setUsername(userData.login);
          setLastValidatedToken(value);
        }
      } catch (err) {
        if (isMounted) {
          setIsTokenValid(false);
          setUsername(null);
          setError("Invalid or expired token");
          setLastValidatedToken(value);
        }
      } finally {
        if (isMounted) {
          setIsValidating(false);
        }
      }
    };

    timeoutId = setTimeout(() => {
      void validateToken();
    }, 500);

    return () => {
      isMounted = false;
      clearTimeout(timeoutId);
    };
  }, [value, lastValidatedToken]);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!value || !isTokenValid) return;

    onSubmit(value);
  }

  // Input state based on validation
  const showValidationError =
    Boolean(error) || (Boolean(value) && !isValidGitHubToken(value));
  const validationMessage =
    error ??
    (!isValidGitHubToken(value) && value
      ? "Invalid GitHub token format"
      : null);

  // Determine input color and description based on state
  let inputColor: InputProps["color"] = undefined;
  let inputDescription =
    "Token should start with 'ghp_' or other GitHub prefixes";

  if (isValidating) {
    inputDescription = "Validating token...";
  } else if (isTokenValid && username) {
    inputColor = "success";
    inputDescription = `Token is valid. Welcome ${username}, click submit to continue!`;
  } else if (showValidationError) {
    inputColor = "danger";
  }

  return (
    <form
      className={clsx("flex flex-col gap-10", className)}
      onSubmit={(e) => {
        handleSubmit(e);
      }}
    >
      <div className="flex flex-col gap-4">
        <Input
          autoComplete="off"
          className={"w-1/2"}
          color={inputColor}
          description={inputDescription}
          errorMessage={validationMessage}
          isClearable
          isInvalid={showValidationError}
          label="Please enter your Personal Access Token"
          name="personal-access-token"
          onChange={(e) => {
            handleChange(e.target.value);
          }}
          onClear={() => {
            handleChange("");
          }}
          required
          type="text"
          value={value}
        />

        {/* TODO: Set to false */}
        <Checkbox isSelected={true}>
          Remember me (token is stored locally, on your device)
        </Checkbox>
      </div>

      <Button
        className="w-20"
        color="primary"
        isDisabled={!isTokenValid || isValidating}
        isLoading={isValidating}
        type="submit"
      >
        Submit
      </Button>
    </form>
  );
}
