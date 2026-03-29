import { RequestError } from "@octokit/request-error";
import clsx from "clsx";
import { useEffect, useState } from "react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { checkTokenScopes, SCOPE_DESCRIPTIONS } from "@/utils/github-api";
import {
  createThrottledOctokit,
  isValidGitHubToken,
} from "@/utils/github-utils";

interface GitHubTokenFormProps {
  className?: string;
  onSubmit: (token: string, remember: boolean) => void;
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
  const [remember, setRemember] = useState(true);
  const [lastValidatedToken, setLastValidatedToken] = useState<null | string>(
    null,
  );
  const [showToken, setShowToken] = useState(false);
  const [scopeWarnings, setScopeWarnings] = useState<string[]>([]);

  // Handle value change
  const handleChange = (newValue: string) => {
    onValueChange(newValue);
    if (error) setError(null);
    if (!newValue) {
      setIsTokenValid(false);
      setUsername(null);
      setLastValidatedToken(null);
      setScopeWarnings([]);
    }
  };

  useEffect(() => {
    let isMounted = true;

    const validateToken = async () => {
      if (!value) {
        setIsTokenValid(false);
        setUsername(null);
        setLastValidatedToken(null);
        return;
      }

      if (!isValidGitHubToken(value) || value === lastValidatedToken) {
        return;
      }

      setIsValidating(true);
      setError(null);

      try {
        const octokit = createThrottledOctokit(value);
        const [{ data: userData }, scopeResult] = await Promise.all([
          octokit.users.getAuthenticated(),
          checkTokenScopes(octokit),
        ]);

        if (isMounted) {
          setIsTokenValid(true);
          setUsername(userData.login);
          setLastValidatedToken(value);

          // Show scope warnings (non-blocking — token is still valid)
          const warnings = scopeResult.missingScopes
            .map((scope) => SCOPE_DESCRIPTIONS[scope])
            .filter(Boolean);
          setScopeWarnings(warnings);
        }
      } catch (err) {
        if (isMounted) {
          setIsTokenValid(false);
          setUsername(null);

          // Differentiate 401 (bad token) from server/network errors
          const status = err instanceof RequestError ? err.status : undefined;

          if (status === 401) {
            setError("Invalid or expired token");
          } else if (status !== undefined && status >= 500) {
            setError("GitHub API is unavailable — please try again later");
          } else {
            setError(
              "GitHub API is unavailable — please check your connection",
            );
          }

          setLastValidatedToken(value);
        }
      } finally {
        if (isMounted) {
          setIsValidating(false);
        }
      }
    };

    const timeoutId = setTimeout(() => {
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

    onSubmit(value, remember);
  }

  // Input state based on validation
  const showValidationError =
    Boolean(error) || (Boolean(value) && !isValidGitHubToken(value));
  const validationMessage =
    error ??
    (!isValidGitHubToken(value) && value
      ? "Invalid GitHub token format"
      : null);

  // Determine description based on state
  let inputDescription =
    "Token should start with 'ghp_' or other GitHub prefixes";

  if (isValidating) {
    inputDescription = "Validating token...";
  } else if (isTokenValid && username) {
    inputDescription = `Token is valid. Welcome ${username}, click submit to continue!`;
  }

  // Border/ring color based on state
  const inputBorderClass = showValidationError
    ? "border-danger focus:ring-danger"
    : isTokenValid && username
      ? "border-success focus:ring-success"
      : "border-default-300 focus:ring-primary";

  // Description text color based on state
  const descriptionColorClass =
    isTokenValid && username ? "text-success" : "text-default-400";

  return (
    <form
      className={clsx("flex flex-col gap-10", className)}
      data-testid="github-token-form"
      onSubmit={(e) => {
        handleSubmit(e);
      }}
    >
      <div className="flex flex-col gap-4">
        {/* Token input */}
        <div className="flex flex-col gap-1.5">
          <Label className="text-foreground" htmlFor="personal-access-token">
            Please enter your Personal Access Token
          </Label>
          <div className="relative">
            <Input
              autoComplete="off"
              className={clsx(
                "h-auto bg-default-100 py-2.5 pl-3 text-sm text-foreground",
                value ? "pr-16" : "pr-3",
                "placeholder:text-default-400",
                inputBorderClass,
              )}
              data-testid="github-token-input"
              id="personal-access-token"
              name="personal-access-token"
              onChange={(e) => {
                handleChange(e.target.value);
              }}
              required
              type={showToken ? "text" : "password"}
              value={value}
            />
            {/* Toggle visibility + Clear buttons */}
            {value && (
              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-0.5">
                <Button
                  aria-label={showToken ? "Hide token" : "Show token"}
                  className="text-default-400 hover:text-default-600 transition-colors p-1"
                  onClick={() => {
                    setShowToken((prev) => !prev);
                  }}
                  type="button"
                  variant="ghost"
                  size="icon"
                >
                  {showToken ? (
                    <svg
                      className="h-4 w-4"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={2}
                      viewBox="0 0 24 24"
                    >
                      <path
                        d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <line
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        x1="1"
                        x2="23"
                        y1="1"
                        y2="23"
                      />
                    </svg>
                  ) : (
                    <svg
                      className="h-4 w-4"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={2}
                      viewBox="0 0 24 24"
                    >
                      <path
                        d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <circle
                        cx="12"
                        cy="12"
                        r="3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  )}
                </Button>
                <Button
                  aria-label="Clear token"
                  className="text-default-400 hover:text-default-600 transition-colors p-1"
                  onClick={() => {
                    handleChange("");
                  }}
                  type="button"
                  variant="ghost"
                  size="icon"
                >
                  <svg
                    className="h-4 w-4"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                    viewBox="0 0 24 24"
                  >
                    <path
                      d="M6 18L18 6M6 6l12 12"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </Button>
              </div>
            )}
          </div>
          {/* Validation error */}
          {showValidationError && validationMessage && (
            <p className="text-xs text-danger">{validationMessage}</p>
          )}
          {/* Description */}
          <p className={clsx("text-xs", descriptionColorClass)}>
            {inputDescription}
          </p>
        </div>

        {/* Scope warnings — shown when token is valid but missing recommended scopes */}
        {scopeWarnings.length > 0 && (
          <Alert variant="warning" data-testid="scope-warnings">
            <AlertTitle>Token is missing recommended scopes:</AlertTitle>
            <AlertDescription>
              <ul className="mt-1 list-inside list-disc space-y-0.5 text-xs">
                {scopeWarnings.map((warning) => (
                  <li key={warning}>{warning}</li>
                ))}
              </ul>
              <a
                className="mt-2 inline-block text-xs font-medium underline hover:no-underline"
                href="https://github.com/settings/tokens"
                rel="noopener noreferrer"
                target="_blank"
              >
                Update token scopes on GitHub &rarr;
              </a>
            </AlertDescription>
          </Alert>
        )}

        <Label className="cursor-pointer">
          <input
            checked={remember}
            className="h-4 w-4 rounded border-default-300 text-primary focus:ring-primary"
            data-testid="github-token-remember"
            onChange={(e) => {
              setRemember(e.target.checked);
            }}
            type="checkbox"
          />
          <span className="text-foreground">
            Remember me (token is stored locally, on your device)
          </span>
        </Label>
      </div>

      <Button
        className={clsx(
          "w-full px-4 py-2.5",
          !isTokenValid || isValidating
            ? "bg-primary/50 text-white/70 cursor-not-allowed"
            : "bg-primary text-white hover:bg-primary/90",
        )}
        data-testid="github-token-submit"
        disabled={!isTokenValid || isValidating}
        type="submit"
      >
        {isValidating ? (
          <span className="inline-flex items-center gap-2">
            <svg
              className="h-4 w-4 animate-spin"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                fill="currentColor"
              />
            </svg>
            Validating...
          </span>
        ) : (
          "Submit"
        )}
      </Button>
    </form>
  );
}
