import {
  Button,
  Input,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  Progress,
  Spacer,
} from "@heroui/react";
import { type Repository } from "@octokit/graphql-schema";
import { useMemo, useReducer, useRef } from "react";

import { useGitHubData } from "@/hooks/use-github-data";
import { analytics } from "@/utils/analytics";
import { debug } from "@/utils/debug";
import { createThrottledOctokit, processRepo } from "@/utils/github-utils";

interface ConfirmationModalProps {
  action: "archive" | "delete";
  isOpen: boolean;
  login: string;
  onClose: () => void;
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
  confirming: boolean;
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
  progress: number;
}

interface RepoActionResultProps {
  action: "archive" | "delete";
  count: number;
  errors?: { error: Error; repository?: Repository }[];
  onClose: () => void;
  processedCount: number;
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
  repos,
}: ConfirmationModalProps) {
  const count = repos.length;

  // Get the PAT from the new provider
  const { mutate, pat } = useGitHubData();

  // Memoize Octokit so rate-limit state persists across re-renders (BUG-011)
  const octokit = useMemo(
    () => (pat ? createThrottledOctokit(pat) : null),
    [pat],
  );

  // Use reducer for state management
  const [state, dispatch] = useReducer(modalReducer, initialState);

  // Ref guard prevents double-submit from stale closures (two clicks before re-render)
  const processingRef = useRef(false);

  async function handleConfirm() {
    debug.log("handleConfirm called");

    debug.log("State before confirmation:", state);

    if (!octokit) {
      debug.error("Octokit is not initialized or already processing");
      return;
    }

    // Synchronous ref check prevents stale-closure double-submit
    if (processingRef.current) {
      debug.warn("Already processing, ignoring confirmation");
      return;
    }
    processingRef.current = true;

    // Single dispatch to handle the full state transition
    dispatch({ type: "START_PROCESSING" });

    // Track bulk action submission
    if (action === "archive") {
      analytics.trackArchiveActionSubmitted(repos.length);
    } else {
      analytics.trackDeleteActionSubmitted(repos.length);
    }

    // Record the start time to ensure minimum progress display time
    const startTime = Date.now();

    for (const repo of repos) {
      try {
        await processRepo(octokit, repo, action);
      } catch (error) {
        if (error instanceof Error) {
          debug.error(`Failed to ${action} the repo:`, error);
          dispatch({
            payload: { error, repository: repo },
            type: "ADD_ERROR",
          });
        } else {
          debug.error("An unknown error occurred");
        }
      } finally {
        dispatch({
          payload: { increment: 1, repo: repo.name },
          type: "UPDATE_PROGRESS",
        });
        // Ensure each repo takes at least 1 second to process (for visual feedback)
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }

    // Ensure we show the progress screen for at least 3 seconds total
    // This helps with testing and provides better UX
    const elapsedTime = Date.now() - startTime;
    const minimumProgressTime = 3000; // 3 seconds

    if (elapsedTime < minimumProgressTime) {
      await new Promise((resolve) =>
        setTimeout(resolve, minimumProgressTime - elapsedTime),
      );
    }

    // Now complete the processing
    dispatch({ type: "COMPLETE_PROCESSING" });
  }

  function resetState() {
    processingRef.current = false;
    dispatch({ type: "RESET" });
  }

  function handleOnClose() {
    // Only refetch GitHub data if operations actually ran (BUG-013)
    if (state.mode === "result") {
      void mutate();
    }

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

  return (
    <Modal
      backdrop="blur"
      data-testid="repo-confirmation-modal"
      isDismissable={isDismissable}
      isOpen={isOpen}
      onClose={
        isDismissable
          ? handleOnClose
          : () => {
              /* noop*/
            }
      }
      scrollBehavior="inside"
      size="xl"
    >
      <ModalContent data-testid={`confirmation-modal-${state.mode}`}>
        <>
          {state.mode === "confirmation" && (
            <RepoActionConfirmation
              action={action}
              confirming={state.confirming}
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
              progress={state.progress}
            />
          )}

          {state.mode === "result" && (
            <RepoActionResult
              action={action}
              count={count}
              errors={state.errors}
              onClose={handleOnClose}
              processedCount={state.progress}
            />
          )}
        </>
      </ModalContent>
    </Modal>
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
  confirming,
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
      <ModalHeader data-testid="confirmation-modal-header">
        <h3>Confirm {action === "archive" ? "Archival" : "Deletion"}</h3>
      </ModalHeader>
      <ModalBody data-testid="confirmation-modal-body">
        <p>
          Are you sure you want to <b>{action}</b> the following {count}{" "}
          repositor{count > 1 ? "ies" : "y"}?
        </p>
        <ul className="list-disc list-inside">
          {repos.map((repo, index) => (
            <li key={index}>{repo.name}</li>
          ))}
        </ul>
        <Spacer y={1} />
        <strong>Please type your GitHub username to confirm:</strong>
        <Input
          autoCapitalize="none"
          autoComplete="off"
          autoCorrect="off"
          autoFocus
          data-testid="confirmation-modal-input"
          fullWidth
          id="username"
          name="username"
          onChange={(e) => setUsername(e.target.value)}
          placeholder="GitHub Username"
          type="text"
          value={username}
        />
      </ModalBody>
      <ModalFooter>
        <Button
          data-testid="confirmation-modal-cancel"
          onPress={onClose}
          variant="bordered"
        >
          Cancel
        </Button>
        <Button
          color={action === "archive" ? "warning" : "danger"}
          data-testid="confirmation-modal-confirm"
          isDisabled={!isCorrectUsername || confirming}
          name="confirm"
          onPress={() => {
            void handleConfirm();
          }}
        >
          I understand the consequences, {action} the repositor
          {count > 1 ? "ies" : "y"}
        </Button>
      </ModalFooter>
    </>
  );
}

function RepoActionProgress({
  action,
  count,
  currentRepo,
  progress,
}: RepoActionProgressProps) {
  return (
    <>
      <ModalHeader data-testid="progress-modal-header">
        <h3>{action === "archive" ? "Archiving" : "Deleting"} Repositories</h3>
      </ModalHeader>
      <ModalBody>
        <p>Current Repo: {currentRepo}</p>
        <p>Progress: {progress}</p>
        <Progress
          color="success"
          label={`${action === "archive" ? "Archiving" : "Deleting"} repositories...`}
          maxValue={count}
          minValue={0}
          value={progress}
        />
      </ModalBody>
    </>
  );
}

function RepoActionResult({
  action,
  count,
  errors,
  onClose,
  processedCount,
}: RepoActionResultProps) {
  const errorCount = errors ? errors.length : 0;
  const successCount = processedCount - errorCount;
  const skippedCount = count - processedCount;

  return (
    <>
      <ModalHeader data-testid="result-modal-header">
        <h3>{action === "archive" ? "Archival" : "Deletion"} Complete</h3>
      </ModalHeader>
      <ModalBody>
        <p>
          {successCount} out of {processedCount} repos{" "}
          {action === "archive" ? "archived" : "deleted"} successfully!
        </p>

        {skippedCount > 0 && (
          <p>
            {skippedCount} repo{skippedCount > 1 ? "s" : ""} skipped.
          </p>
        )}

        <Spacer y={1} />

        {/* Report Errors */}
        {errorCount > 0 && (
          <>
            <p>
              {errorCount} error{errorCount > 1 ? "s" : ""} occurred while{" "}
              {action === "archive" ? "archiving" : "deleting"} the following{" "}
              repositor{errorCount > 1 ? "ies" : "y"}:
            </p>
            <ul className="list-disc list-inside">
              {errors?.map(({ error, repository }, index) => (
                <li key={index}>
                  {repository ? repository.name : "Unknown Repository"}:{" "}
                  {error.message}
                </li>
              ))}
            </ul>
          </>
        )}
      </ModalBody>
      <ModalFooter>
        <Button
          data-testid="repo-action-result-close"
          onPress={onClose}
          variant="bordered"
        >
          Close
        </Button>
      </ModalFooter>
    </>
  );
}
