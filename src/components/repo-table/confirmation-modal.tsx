import {
  Button,
  Input,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  Spacer,
} from "@nextui-org/react";
import { Repository } from "@octokit/graphql-schema";
import { useEffect, useState } from "react";

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
  const [username, setUsername] = useState<string>("");
  const [isCorrectUsername, setIsCorrectUsername] = useState<boolean>(false);

  useEffect(() => {
    if (login && username && username === login) {
      setIsCorrectUsername(true);
    } else {
      setIsCorrectUsername(false);
    }
  }, [login, username]);

  const handleConfirm = () => {
    onConfirm();

    // TODO: Do deletion with progress here?

    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl">
      <ModalContent>
        {(onClose) => (
          <>
            <ModalHeader>
              <h3>Confirm {action === "archive" ? "Archival" : "Deletion"}</h3>
            </ModalHeader>
            <ModalBody className="text-small">
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
                onPress={handleConfirm}
              >
                I understand the consequences, {action} the repositor
                {count > 1 ? "ies" : "y"}
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
}

export default ConfirmationModal;
