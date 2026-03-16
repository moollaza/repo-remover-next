import type { Meta, StoryObj } from "@storybook/react";

import { fn } from "@storybook/test";

import { GitHubDataDecorator } from "@/../.storybook/decorators";
import ConfirmationModal from "@/components/repo-table/confirmation-modal";
import { mockRepos } from "@/mocks/static-fixtures";

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

export const Archive: Story = {};

export const Delete: Story = {
  args: {
    action: "delete",
  },
};

// Visual states for progress and result modals can be added later if needed
// These complex interaction flows are fully covered by Playwright E2E tests

