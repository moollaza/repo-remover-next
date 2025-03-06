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
import { Repository } from "@octokit/graphql-schema";
import { Octokit } from "@octokit/rest";
import { useEffect, useState } from "react";
import { useSWRConfig } from "swr";

import { useGitHubData } from "@/hooks/use-github-data";
import { processRepo } from "@/utils/github-utils";

interface ConfirmationModalProps {
  action: "archive" | "delete";
  isOpen: boolean;
  login: string;
  onClose: () => void;
  onConfirm: () => void;
  repos: Repository[];
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
  progress: number;
}

interface RepoActionResultProps {
  action: "archive" | "delete";
  count: number;
  errors?: { error: Error; repository?: Repository }[];
  onClose: () => void;
}

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
  const { pat } = useGitHubData();

  // Create an Octokit instance with the PAT
  const octokit = pat ? new Octokit({ auth: pat }) : null;
  const [actionInProgress, setActionInProgress] = useState(false);
  const [actionCompleted, setActionCompleted] = useState(false);
  const [errors, setErrors] = useState<
    { error: Error; repository?: Repository }[]
  >([]);
  const [username, setUsername] = useState("");
  const [isCorrectUsername, setIsCorrectUsername] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentRepo, setCurrentRepo] = useState("");

  const { mutate } = useSWRConfig();

  useEffect(() => {
    setIsCorrectUsername(username === login);
  }, [login, username]);

  async function handleConfirm() {
    if (!octokit) return;

    onConfirm();

    setActionInProgress(true);
    setProgress(0);

    for (const repo of repos) {
      setCurrentRepo(repo.name);

      try {
        await processRepo(octokit, repo, action);
      } catch (error) {
        if (error instanceof Error) {
          console.error(`Failed to ${action} the repo:`, error);
          setErrors([...errors, { error, repository: repo }]);
        } else {
          console.error("An unknown error occurred");
        }
      } finally {
        setProgress((prevProgress) => prevProgress + 1);
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }

    setActionInProgress(false);
    setActionCompleted(true);
  }

  function resetState() {
    setActionInProgress(false);
    setActionCompleted(false);
    setErrors([]);
    setProgress(0);
    setCurrentRepo("");
  }

  function handleOnClose() {
    resetState();
    onClose();
    // Refetch all GitHub data after operations are complete
    void mutate(undefined, { revalidate: true });
  }

  return (
    <Modal
      backdrop="blur"
      data-testid="repo-confirmation-modal"
      isOpen={isOpen}
      onClose={onClose}
      scrollBehavior="inside"
      size="xl"
    >
      <ModalContent>
        <>
          {actionInProgress && (
            <RepoActionProgress
              action={action}
              count={count}
              currentRepo={currentRepo}
              progress={progress}
            />
          )}

          {actionCompleted && (
            <RepoActionResult
              action={action}
              count={count}
              errors={errors}
              onClose={handleOnClose}
            />
          )}

          {!actionInProgress && !actionCompleted && (
            <RepoActionConfirmation
              action={action}
              count={count}
              handleConfirm={() => void handleConfirm()}
              isCorrectUsername={isCorrectUsername}
              onClose={handleOnClose}
              repos={repos}
              setUsername={setUsername}
              username={username}
            />
          )}
        </>
      </ModalContent>
    </Modal>
  );
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
      <ModalHeader>
        <h3>Confirm {action === "archive" ? "Archival" : "Deletion"}</h3>
      </ModalHeader>
      <ModalBody>
        <p>
          Are you sure you want to <b>{action}</b> the following {count}{" "}
          repositor{count > 1 ? "ies" : "y"}?
        </p>
        <ol className="list-disc list-inside">
          {repos.map((repo, index) => (
            <li key={index}>{repo.name}</li>
          ))}
        </ol>
        <Spacer y={1} />
        <strong>Please type your GitHub username to confirm:</strong>
        <Input
          autoCapitalize="none"
          autoComplete="off"
          autoCorrect="off"
          autoFocus
          fullWidth
          onChange={(e) => setUsername(e.target.value)}
          placeholder="GitHub Username"
          type="text"
          value={username}
        />
      </ModalBody>
      <ModalFooter>
        <Button onPress={onClose} variant="bordered">
          Cancel
        </Button>
        <Button
          color={action === "archive" ? "warning" : "danger"}
          isDisabled={!isCorrectUsername}
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
      <ModalHeader>
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
}: RepoActionResultProps) {
  const errorCount = errors ? errors.length : 0;

  return (
    <>
      <ModalHeader>
        <h3>{action === "archive" ? "Archival" : "Deletion"} Complete</h3>
      </ModalHeader>
      <ModalBody>
        <p>
          {count - errorCount} out of {count} repos{" "}
          {action === "archive" ? "archived" : "deleted"} successfully!
        </p>

        <Spacer y={1} />

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
      </ModalBody>
      <ModalFooter>
        <Button onPress={onClose} variant="bordered">
          Close
        </Button>
      </ModalFooter>
    </>
  );
}
