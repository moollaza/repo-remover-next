import { type Repository } from "@octokit/graphql-schema";
import { useReducer } from "react";

import { useGitHubData } from "@/hooks/use-github-data";
import { analytics } from "@/utils/analytics";
import { debug } from "@/utils/debug";
import { createThrottledOctokit, processRepo } from "@/utils/github-utils";

// --- Exported types ---

export interface ModalState {
  confirming: boolean;
  currentRepo: string;
  errors: { error: Error; repository?: Repository }[];
  isCorrectUsername: boolean;
  mode: "confirmation" | "progress" | "result";
  progress: number;
  username: string;
}

// --- Internal types ---

type ModalAction =
  | { payload: { error: Error; repository?: Repository }; type: "ADD_ERROR" }
  | { payload: { increment: number; repo: string }; type: "UPDATE_PROGRESS" }
  | { payload: { login: string; username: string }; type: "SET_USERNAME" }
  | { type: "COMPLETE_PROCESSING" }
  | { type: "RESET" }
  | { type: "START_PROCESSING" };

interface UseConfirmationModalOptions {
  action: "archive" | "delete";
  isOpen: boolean;
  login: string;
  onClose: () => void;
  onConfirm: () => void;
  repos: Repository[];
}

interface UseConfirmationModalReturn {
  count: number;
  handleConfirm: () => void;
  handleOnClose: () => void;
  handleSetUsername: React.Dispatch<React.SetStateAction<string>>;
  handleStop: () => void;
  isDismissable: boolean;
  state: ModalState;
}

// --- Constants ---

const initialState: ModalState = {
  confirming: false,
  currentRepo: "",
  errors: [],
  isCorrectUsername: false,
  mode: "confirmation",
  progress: 0,
  username: "",
};

// --- Hook ---

export function useConfirmationModal({
  action,
  login,
  onClose,
  onConfirm,
  repos,
}: UseConfirmationModalOptions): UseConfirmationModalReturn {
  const count = repos.length;

  // Get the PAT from the new provider
  const { mutate, pat } = useGitHubData();

  // Create an Octokit instance with the PAT
  const octokit = pat ? createThrottledOctokit(pat) : null;

  // Use reducer for state management
  const [state, dispatch] = useReducer(modalReducer, initialState);

  async function handleConfirm() {
    debug.log("handleConfirm called");

    debug.log("State before confirmation:", state);

    if (!octokit) {
      debug.error("Octokit is not initialized or already processing");
      return;
    }

    if (state.confirming) {
      debug.warn("Already processing, ignoring confirmation");
      return;
    }

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
          console.error(`Failed to ${action} the repo:`, error);
          dispatch({
            payload: { error, repository: repo },
            type: "ADD_ERROR",
          });
        } else {
          console.error("An unknown error occurred");
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

    // Call the onConfirm callback after state is updated and with a slight delay
    setTimeout(() => {
      onConfirm();
    }, 100);
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

  function handleStop() {
    // Currently a no-op placeholder for future abort support
  }

  const isDismissable = state.mode === "confirmation";

  return {
    count,
    handleConfirm: () => void handleConfirm(),
    handleOnClose,
    handleSetUsername,
    handleStop,
    isDismissable,
    state,
  };
}

// --- Reducer ---

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
        confirming: true,
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
