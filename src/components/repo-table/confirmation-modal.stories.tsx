import type { Meta, StoryObj } from "@storybook/react";

import { expect, fn, screen, userEvent } from "@storybook/test";
import { waitFor } from "@testing-library/dom";

import { GitHubDataDecorator } from "@/../.storybook/decorators";
import ConfirmationModal from "@/components/repo-table/confirmation-modal";
import { mockRepos } from "@/mocks/fixtures";

const fewRepos = mockRepos.slice(0, 2);

const meta: Meta<typeof ConfirmationModal> = {
  args: {
    action: "archive",
    isOpen: true,
    login: "testuser",
    onClose: fn(),
    onConfirm: fn(),
    repos: fewRepos,
  },
  component: ConfirmationModal,
  decorators: [GitHubDataDecorator],
  title: "Components/ConfirmationModal",
};

export default meta;

type Story = StoryObj<typeof ConfirmationModal>;

export const Archive: Story = {
  play: async ({ args }) => {
    // Click cancel button and assert onClose is called
    const cancelButton = screen.getByTestId("confirmation-modal-cancel");
    await userEvent.click(cancelButton);
    await waitFor(() => expect(args.onClose).toHaveBeenCalled());
  },
};

export const Delete: Story = {
  ...Archive,
  args: {
    action: "delete",
  },
};

export const SuccessfulArchive: Story = {
  play: async ({ step }) => {
    const usernameInput = await screen.findByTestId("confirmation-modal-input");

    await step("Enter username", async () => {
      await userEvent.type(usernameInput, "testuser", { delay: 100 });
    });

    await step("Click confirm button", async () => {
      const confirmButton = screen.getByTestId("confirmation-modal-confirm");
      await userEvent.click(confirmButton);
    });

    await step("Wait for progress screen", async () => {
      await waitFor(() =>
        expect(screen.getByTestId("progress-modal-header")).toBeInTheDocument(),
      );
    });

    await step("Wait for archival to complete", async () => {
      // wait for 3 seconds
      await new Promise((resolve) => setTimeout(resolve, 3000));

      await waitFor(() =>
        expect(
          screen.getByText((content) => content.includes("Archival Complete")),
        ).toBeInTheDocument(),
      );
      await expect(
        screen.getByText("2 out of 2 repos archived successfully!"),
      ).toBeInTheDocument();
    });
  },
};

export const SuccessfulDelete: Story = {
  args: {
    action: "delete",
  },
  play: async ({ step }) => {
    const usernameInput = await screen.findByTestId("confirmation-modal-input");

    await step("Enter username", async () => {
      await userEvent.type(usernameInput, "testuser", { delay: 100 });
    });

    await step("Click confirm button", async () => {
      const confirmButton = screen.getByTestId("confirmation-modal-confirm");

      // Assert that the confirm button is enabled
      await expect(confirmButton).toBeEnabled();

      // click the confirm button
      await userEvent.click(confirmButton);
    });

    await step("Wait for progress screen", async () => {
      await waitFor(() =>
        expect(screen.getByTestId("progress-modal-header")).toBeInTheDocument(),
      );
    });

    await step("Wait for deletion to complete", async () => {
      // wait for 3 seconds
      await new Promise((resolve) => setTimeout(resolve, 3000));

      await waitFor(() =>
        expect(
          screen.getByText((content) => content.includes("Deletion Complete")),
        ).toBeInTheDocument(),
      );
      await expect(
        screen.getByText("2 out of 2 repos deleted successfully!"),
      ).toBeInTheDocument();
    });
  },
};
