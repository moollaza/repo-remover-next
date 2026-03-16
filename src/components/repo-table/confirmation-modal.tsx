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

import {
  type ModalState,
  useConfirmationModal,
} from "@/hooks/use-confirmation-modal";

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
  errors?: ModalState["errors"];
  onClose: () => void;
}

export default function ConfirmationModal(props: ConfirmationModalProps) {
  const { action, isOpen, repos } = props;
  const {
    count,
    handleConfirm,
    handleOnClose,
    handleSetUsername,
    isDismissable,
    state,
  } = useConfirmationModal(props);

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
              count={count}
              handleConfirm={handleConfirm}
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
      <ModalHeader data-testid="confirmation-modal-header">
        <h3>Confirm {action === "archive" ? "Archival" : "Deletion"}</h3>
      </ModalHeader>
      <ModalBody data-testid="confirmation-modal-body">
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
          isDisabled={!isCorrectUsername}
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
}: RepoActionResultProps) {
  const errorCount = errors ? errors.length : 0;

  return (
    <>
      <ModalHeader data-testid="result-modal-header">
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
