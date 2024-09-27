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
} from "@nextui-org/react";
import { Repository } from "@octokit/graphql-schema";
import { useEffect, useState } from "react";

import { useGitHub } from "@providers/github-provider";
import { processRepo } from "@utils/github-utils";

interface ConfirmationModalProps {
  action: "archive" | "delete";
  repos: Repository[];
  login: string;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export default function ConfirmationModal({
  action,
  login,
  repos,
  isOpen,
  onClose,
  onConfirm,
}: ConfirmationModalProps) {
  const count = repos.length;

  const { octokit } = useGitHub();
  const [actionInProgress, setActionInProgress] = useState(false);
  const [actionCompleted, setActionCompleted] = useState(false);
  const [errors, setErrors] = useState<
    { repository?: Repository; error: Error }[]
  >([]);
  const [username, setUsername] = useState("");
  const [isCorrectUsername, setIsCorrectUsername] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentRepo, setCurrentRepo] = useState("");

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
          setErrors([...errors, { repository: repo, error }]);
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
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="xl"
      scrollBehavior="inside"
      backdrop="blur"
    >
      <ModalContent>
        <>
          {actionInProgress && (
            <RepoActionProgress
              action={action}
              progress={progress}
              count={count}
              currentRepo={currentRepo}
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
              repos={repos}
              count={count}
              username={username}
              setUsername={setUsername}
              isCorrectUsername={isCorrectUsername}
              handleConfirm={() => void handleConfirm()}
              onClose={handleOnClose}
            />
          )}
        </>
      </ModalContent>
    </Modal>
  );
}

interface RepoActionProgressProps {
  action: "archive" | "delete";
  progress: number;
  count: number;
  currentRepo: string;
}

function RepoActionProgress({
  action,
  progress,
  count,
  currentRepo,
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
          label={`${action === "archive" ? "Archiving" : "Deleting"} repositories...`}
          value={progress}
          minValue={0}
          maxValue={count}
          color="success"
        />
      </ModalBody>
    </>
  );
}

interface RepoActionResultProps {
  action: "archive" | "delete";
  count: number;
  errors?: { repository?: Repository; error: Error }[];
  onClose: () => void;
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
              {errors?.map(({ repository, error }, index) => (
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
        <Button variant="bordered" onPress={onClose}>
          Close
        </Button>
      </ModalFooter>
    </>
  );
}

interface RepoActionConfirmationProps
  extends Pick<ConfirmationModalProps, "action" | "repos" | "onClose"> {
  count: number;
  username: string;
  setUsername: React.Dispatch<React.SetStateAction<string>>;
  isCorrectUsername: boolean;
  handleConfirm: () => void;
}

function RepoActionConfirmation({
  action,
  repos,
  onClose,
  count,
  username,
  setUsername,
  isCorrectUsername,
  handleConfirm,
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
          type="text"
          autoFocus
          autoCapitalize="none"
          autoCorrect="off"
          autoComplete="off"
          fullWidth
          placeholder="GitHub Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
      </ModalBody>
      <ModalFooter>
        <Button variant="bordered" onPress={onClose}>
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
