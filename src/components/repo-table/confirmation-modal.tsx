import {
  Button,
  Input,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  Spacer,
  Progress,
} from "@nextui-org/react";
import { Repository } from "@octokit/graphql-schema";
import { useEffect, useState, useCallback, useRef } from "react";

import { useGitHub } from "@providers/github-provider";
import { archiveRepos, deleteRepos } from "@utils/github-utils";

interface ConfirmationModalProps {
  action: "archive" | "delete";
  repos: Repository[];
  login: string;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

function ConfirmationModal({
  action,
  login,
  repos,
  isOpen,
  onClose,
  onConfirm,
}: ConfirmationModalProps) {
  const count = repos.length;

  const [loading, setLoading] = useState<boolean>(false);
  const [username, setUsername] = useState<string>("");
  const [isCorrectUsername, setIsCorrectUsername] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const currentRepoRef = useRef<string>("");
  const { octokit } = useGitHub();

  useEffect(() => {
    if (login && username && username === login) {
      setIsCorrectUsername(true);
    } else {
      setIsCorrectUsername(false);
    }
  }, [login, username]);

  const handleConfirm = useCallback(async () => {
    if (!octokit) return;

    onConfirm();

    console.log("Handling confirm...");

    setLoading(true);
    setProgress(0);

    try {
      if (action === "archive") {
        await archiveRepos(octokit, repos, () => {
          setProgress((prevProgress) => {
            const newProgress = prevProgress + 1;
            currentRepoRef.current = repos[newProgress]?.name;
            console.log({ prevProgress, newProgress, currentRepoRef });
            return newProgress;
          });
        });
      } else {
        await deleteRepos(octokit, repos, () => {
          setProgress((prevProgress) => {
            const newProgress = prevProgress + 1;
            currentRepoRef.current = repos[newProgress]?.name;
            return newProgress;
          });
        });
      }
    } catch (error) {
      console.error("Failed to complete the operation:", error);
    } finally {
      setLoading(false);
      onClose();
    }
  }, [octokit, action, repos, onConfirm, onClose]);

  function ActionInProgress({ action }: { action: "archive" | "delete" }) {
    return (
      <>
        <ModalHeader>
          <h3>
            {action === "archive" ? "Archiving" : "Deleting"} Repositories
          </h3>
        </ModalHeader>
        <ModalBody>
          <p>Current Repo: {currentRepoRef.current}</p>
          <p>Progress: {progress}</p>
          <Progress
            label={`${action === "archive" ? "Archiving" : "Deleting"} repositories...`}
            value={progress}
            color="success"
            minValue={0}
            maxValue={repos.length}
          />
        </ModalBody>
      </>
    );
  }

  type ConfirmActionProps = Pick<
    ConfirmationModalProps,
    "action" | "repos" | "login" | "isOpen" | "onConfirm" | "onClose"
  >;

  function ConfirmAction({ action, repos, onClose }: ConfirmActionProps) {
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

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="xl"
      scrollBehavior="inside"
      backdrop="blur"
    >
      <ModalContent>
        {loading ? (
          <ActionInProgress action={action} />
        ) : (
          <ConfirmAction
            action={action}
            repos={repos}
            onClose={onClose}
            login={login}
            isOpen={false}
            onConfirm={onConfirm}
          />
        )}
      </ModalContent>
    </Modal>
  );
}

export default ConfirmationModal;
