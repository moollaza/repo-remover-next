import { type Repository } from "@octokit/graphql-schema";
import { useCallback, useEffect, useReducer, useRef } from "react";
import { createPortal } from "react-dom";

import { useGitHubData } from "@/hooks/use-github-data";
import { analytics } from "@/utils/analytics";
import { debug } from "@/utils/debug";
import { createThrottledOctokit, processRepo } from "@/utils/github-utils";

interface ConfirmationModalProps {
  action: "archive" | "delete";
  isOpen: boolean;
  login: string;
  onClose: () => void;
  onConfirm: () => void;
  repos: Repository[];
}

type ModalAction =
  | { payload: { error: Error; repository?: Repository }; type: "ADD_ERROR" }
  | { payload: { increment: number; repo: string }; type: "UPDATE_PROGRESS" }
  | { payload: { login: string; username: string }; type: "SET_USERNAME" }
  | { type: "COMPLETE_PROCESSING" }
  | { type: "RESET" }
  | { type: "START_PROCESSING" };

// Define the state machine types
interface ModalState {
  confirming: boolean;
  currentRepo: string;
  errors: { error: Error; repository?: Repository }[];
  isCorrectUsername: boolean;
  mode: "confirmation" | "progress" | "result";
  progress: number;
  username: string;
}

interface RepoActionConfirmationProps
  extends Pick<ConfirmationModalProps, "action" | "onClose" | "repos"> {
  count: number;
  handleConfirm: () => void;
  isCorrectUsername: boolean;
  setUsername: React.Dispatch<React.SetStateAction<string>>;
  username: string;
}

interface RepoActionProgressProps {
  action: "archive" | "delete";
  count: number;
  currentRepo: string;
  onStop: () => void;
  progress: number;
}

interface RepoActionResultProps {
  action: "archive" | "delete";
  count: number;
  errors?: { error: Error; repository?: Repository }[];
  onClose: () => void;
}

const initialState: ModalState = {
  confirming: false,
  currentRepo: "",
  errors: [],
  isCorrectUsername: false,
  mode: "confirmation",
  progress: 0,
  username: "",
};

export default function ConfirmationModal({
  action,
  isOpen,
  login,
  onClose,
  onConfirm,
  repos,
}: ConfirmationModalProps) {
  const count = repos.length;

  // Get the PAT from the new provider
  const { mutate, pat } = useGitHubData();

  // Create an Octokit instance with the PAT
  const octokit = pat ? createThrottledOctokit(pat) : null;

  // Use reducer for state management
  const [state, dispatch] = useReducer(modalReducer, initialState);
  const abortRef = useRef(false);

  async function handleConfirm() {
    debug.log("handleConfirm called");

    if (!octokit || state.confirming) return;

    abortRef.current = false;
    dispatch({ type: "START_PROCESSING" });

    // Track bulk action submission
    if (action === "archive") {
      analytics.trackArchiveActionSubmitted(repos.length);
    } else {
      analytics.trackDeleteActionSubmitted(repos.length);
    }

    const startTime = Date.now();

    for (const repo of repos) {
      // Check abort flag before each repo
      if (abortRef.current) break;

      try {
        await processRepo(octokit, repo, action);
      } catch (error) {
        if (error instanceof Error) {
          debug.error(`Failed to ${action} the repo:`, error);
          dispatch({
            payload: { error, repository: repo },
            type: "ADD_ERROR",
          });

          // Detect authentication failure — stop the batch early
          // All remaining repos will also fail with the same expired token
          if (
            error.message.includes("401") ||
            error.message.includes("Bad credentials")
          ) {
            debug.error(
              "Authentication failed — stopping batch early. Token may have expired.",
            );
            break;
          }
        } else {
          debug.error("An unknown error occurred");
        }
      } finally {
        dispatch({
          payload: { increment: 1, repo: repo.name },
          type: "UPDATE_PROGRESS",
        });
        // Brief pause for visual feedback
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }

    // Minimum display time for UX
    const elapsedTime = Date.now() - startTime;
    if (elapsedTime < 2000) {
      await new Promise((resolve) => setTimeout(resolve, 2000 - elapsedTime));
    }

    dispatch({ type: "COMPLETE_PROCESSING" });
    setTimeout(() => {
      onConfirm();
    }, 100);
  }

  function handleStop() {
    abortRef.current = true;
  }

  function resetState() {
    dispatch({ type: "RESET" });
  }

  function handleOnClose() {
    // Refetch all GitHub data after operations are complete
    void mutate();

    // Close the modal
    onClose();

    // Reset the state
    resetState();
  }

  function handleSetUsername(value: React.SetStateAction<string>) {
    if (typeof value === "function") {
      // If it's a function that updates based on previous state
      const updater = value as (prevState: string) => string;
      const newValue = updater(state.username);
      dispatch({
        payload: { login, username: newValue },
        type: "SET_USERNAME",
      });
    } else {
      // If it's a direct value
      dispatch({ payload: { login, username: value }, type: "SET_USERNAME" });
    }
  }

  const isDismissable = state.mode === "confirmation";

  if (!isOpen) return null;

  return createPortal(
    <ModalOverlay
      isDismissable={isDismissable}
      onClose={isDismissable ? handleOnClose : undefined}
    >
      <div
        className="relative w-full max-w-xl max-h-[80vh] overflow-y-auto rounded-xl bg-background border border-divider shadow-2xl"
        data-testid={`confirmation-modal-${state.mode}`}
      >
        {state.mode === "confirmation" && (
          <RepoActionConfirmation
            action={action}
            count={count}
            handleConfirm={() => void handleConfirm()}
            isCorrectUsername={state.isCorrectUsername}
            onClose={handleOnClose}
            repos={repos}
            setUsername={handleSetUsername}
            username={state.username}
          />
        )}

        {state.mode === "progress" && (
          <RepoActionProgress
            action={action}
            count={count}
            currentRepo={state.currentRepo}
            onStop={handleStop}
            progress={state.progress}
          />
        )}

        {state.mode === "result" && (
          <RepoActionResult
            action={action}
            count={count}
            errors={state.errors}
            onClose={handleOnClose}
          />
        )}
      </div>
    </ModalOverlay>,
    document.body,
  );
}

/**
 * Modal overlay that handles backdrop click and Escape key dismissal.
 * Also prevents body scroll while open.
 */
function ModalOverlay({
  children,
  isDismissable,
  onClose,
}: {
  children: React.ReactNode;
  isDismissable: boolean;
  onClose?: () => void;
}) {
  const overlayRef = useRef<HTMLDivElement>(null);

  // Prevent body scroll while modal is open
  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, []);

  // Handle Escape key
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape" && isDismissable && onClose) {
        onClose();
      }
    },
    [isDismissable, onClose],
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  // Handle backdrop click
  function handleBackdropClick(e: React.MouseEvent<HTMLDivElement>) {
    if (e.target === overlayRef.current && isDismissable && onClose) {
      onClose();
    }
  }

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      data-testid="repo-confirmation-modal"
      onClick={handleBackdropClick}
    >
      {children}
    </div>
  );
}

/**
 * Reducer function for managing modal state transitions.
 * Handles the following state transitions:
 * - ADD_ERROR: Adds an error to the errors array
 * - COMPLETE_PROCESSING: Changes mode to result when processing is complete
 * - RESET: Returns to initial state
 * - SET_USERNAME: Updates username and validates against login
 * - START_PROCESSING: Initializes the progress mode with empty errors
 * - UPDATE_PROGRESS: Updates progress counter and current repo
 *
 * @param state - Current modal state
 * @param action - Action to perform on the state
 * @returns Updated modal state
 */

function modalReducer(state: ModalState, action: ModalAction): ModalState {
  switch (action.type) {
    case "ADD_ERROR":
      return {
        ...state,
        errors: [...state.errors, action.payload],
      };
    case "COMPLETE_PROCESSING":
      return {
        ...state,
        confirming: false,
        mode: "result",
      };
    case "RESET":
      return initialState;
    case "SET_USERNAME":
      return {
        ...state,
        isCorrectUsername: action.payload.username === action.payload.login,
        username: action.payload.username,
      };
    case "START_PROCESSING":
      return {
        ...state,
        confirming: true, // Already includes the confirming flag
        errors: [],
        mode: "progress",
        progress: 0,
      };
    case "UPDATE_PROGRESS":
      return {
        ...state,
        currentRepo: action.payload.repo,
        progress: state.progress + action.payload.increment,
      };
    default:
      return state;
  }
}

function RepoActionConfirmation({
  action,
  count,
  handleConfirm,
  isCorrectUsername,
  onClose,
  repos,
  setUsername,
  username,
}: RepoActionConfirmationProps) {
  return (
    <>
      <div
        className="px-6 py-4 border-b border-divider"
        data-testid="confirmation-modal-header"
      >
        <h3 className="text-lg font-semibold text-foreground">
          Confirm {action === "archive" ? "Archival" : "Deletion"}
        </h3>
      </div>
      <div
        className="px-6 py-4 text-foreground"
        data-testid="confirmation-modal-body"
      >
        <p>
          Are you sure you want to <b>{action}</b> the following {count}{" "}
          repositor{count > 1 ? "ies" : "y"}?
        </p>
        <ol className="list-disc list-inside">
          {repos.map((repo, index) => (
            <li key={index}>{repo.name}</li>
          ))}
        </ol>
        <div className="mt-4" />
        <strong>Please type your GitHub username to confirm:</strong>
        <input
          autoCapitalize="none"
          autoComplete="off"
          autoCorrect="off"
          autoFocus
          className="mt-2 w-full rounded-lg border border-divider bg-content2 px-3 py-2 text-foreground placeholder:text-default-400 outline-none focus:ring-2 focus:ring-primary"
          data-testid="confirmation-modal-input"
          id="username"
          name="username"
          onChange={(e) => setUsername(e.target.value)}
          placeholder="GitHub Username"
          type="text"
          value={username}
        />
      </div>
      <div className="flex justify-end gap-2 px-6 py-4 border-t border-divider">
        <button
          className="rounded-lg border border-divider bg-transparent px-4 py-2 text-sm font-medium text-foreground hover:bg-default-100 transition-colors"
          data-testid="confirmation-modal-cancel"
          onClick={onClose}
          type="button"
        >
          Cancel
        </button>
        <button
          className={`rounded-lg px-4 py-2 text-sm font-medium text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
            action === "archive"
              ? "bg-amber-500 hover:bg-amber-600"
              : "bg-red-500 hover:bg-red-600"
          }`}
          data-testid="confirmation-modal-confirm"
          disabled={!isCorrectUsername}
          name="confirm"
          onClick={() => {
            void handleConfirm();
          }}
          type="button"
        >
          I understand the consequences, {action} the repositor
          {count > 1 ? "ies" : "y"}
        </button>
      </div>
    </>
  );
}

function RepoActionProgress({
  action,
  count,
  currentRepo,
  onStop,
  progress,
}: RepoActionProgressProps) {
  const percentage = count > 0 ? Math.round((progress / count) * 100) : 0;
  const actionVerb = action === "archive" ? "Archiving" : "Deleting";

  return (
    <>
      <div
        className="px-6 py-4 border-b border-divider"
        data-testid="progress-modal-header"
      >
        <h3 className="text-lg font-semibold text-foreground">
          {actionVerb} Repositories
        </h3>
      </div>
      <div className="px-6 py-6 text-foreground space-y-5">
        <div className="flex items-center justify-between text-sm">
          <span className="text-default-500">
            {actionVerb}{" "}
            <span className="font-medium text-foreground">{currentRepo}</span>
          </span>
          <span className="font-medium tabular-nums">
            {progress} / {count}
          </span>
        </div>

        <div>
          <div className="h-2.5 w-full overflow-hidden rounded-full bg-default-200">
            <div
              className="h-full rounded-full bg-[var(--brand-blue)] transition-all duration-300"
              style={{ width: `${percentage}%` }}
            />
          </div>
          <p className="mt-2 text-xs text-default-400 text-right">
            {percentage}%
          </p>
        </div>
      </div>
      <div className="flex justify-end px-6 py-4 border-t border-divider">
        <button
          className="rounded-lg border border-divider bg-transparent px-4 py-2 text-sm font-medium text-foreground hover:bg-default-100 transition-colors"
          onClick={onStop}
          type="button"
        >
          Stop
        </button>
      </div>
    </>
  );
}

function RepoActionResult({
  action,
  count,
  errors,
  onClose,
}: RepoActionResultProps) {
  const errorCount = errors ? errors.length : 0;

  return (
    <>
      <div
        className="px-6 py-4 border-b border-divider"
        data-testid="result-modal-header"
      >
        <h3 className="text-lg font-semibold text-foreground">
          {action === "archive" ? "Archival" : "Deletion"} Complete
        </h3>
      </div>
      <div className="px-6 py-4 text-foreground">
        <p>
          {count - errorCount} out of {count} repos{" "}
          {action === "archive" ? "archived" : "deleted"} successfully!
        </p>

        <div className="mt-4" />

        {/* Report Errors */}
        {errorCount > 0 && (
          <>
            <p>
              {errorCount} error{errorCount > 1 ? "s" : ""} occurred while{" "}
              {action === "archive" ? "archiving" : "deleting"} the following{" "}
              repositor{errorCount > 1 ? "ies" : "y"}:
            </p>
            <ol className="list-disc list-inside">
              {errors?.map(({ error, repository }, index) => (
                <li key={index}>
                  {repository ? repository.name : "Unknown Repository"}:{" "}
                  {error.message}
                </li>
              ))}
            </ol>
          </>
        )}
      </div>
      <div className="flex justify-end gap-2 px-6 py-4 border-t border-divider">
        <button
          className="rounded-lg border border-divider bg-transparent px-4 py-2 text-sm font-medium text-foreground hover:bg-default-100 transition-colors"
          data-testid="repo-action-result-close"
          onClick={onClose}
          type="button"
        >
          Close
        </button>
      </div>
    </>
  );
}
