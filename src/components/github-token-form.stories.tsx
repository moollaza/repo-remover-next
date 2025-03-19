import type { Meta, StoryObj } from "@storybook/react";

import { expect, fn, userEvent, waitFor, within } from "@storybook/test";
import { http, HttpResponse } from "msw";
import React, { useState } from "react";

import GitHubTokenForm from "@/components/github-token-form";
import { GitHubDataProvider } from "@/providers/github-data-provider";

const VALID_TOKEN = "ghp_1234567890abcdef1234567890abcdef1234";
const INVALID_TOKEN = "invalid-token-value";

// Props for the wrapper component
interface WrapperProps {
  initialValue?: string;
  onSubmit?: (token: string) => void;
}

// Create a wrapper component to handle state for the controlled component
const GitHubTokenFormWrapper: React.FC<WrapperProps> = ({
  initialValue = "",
  onSubmit = fn<(token: string) => void>(),
}) => {
  const [value, setValue] = useState(initialValue);
  return (
    <GitHubTokenForm
      onSubmit={onSubmit}
      onValueChange={setValue}
      value={value}
    />
  );
};

const meta: Meta<typeof GitHubTokenFormWrapper> = {
  component: GitHubTokenFormWrapper,
  decorators: [
    (Story) => (
      <GitHubDataProvider>
        <Story />
      </GitHubDataProvider>
    ),
  ],
  title: "Components/GitHubTokenForm",
};

export default meta;
type Story = StoryObj<typeof GitHubTokenFormWrapper>;

// Empty form story
export const EmptyForm: Story = {
  args: {
    initialValue: "",
    onSubmit: fn<(token: string) => void>(),
  },
};

export const InvalidInput: Story = {
  args: {
    initialValue: "invalid-token-value",
    onSubmit: fn<(token: string) => void>(),
  },
};

export const ValidToken: Story = {
  args: {
    initialValue: VALID_TOKEN,
    onSubmit: fn<(token: string) => void>(),
  },
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);

    const submitButton = canvas.getByRole("button", { name: "Submit" });

    await waitFor(() => expect(submitButton).toBeEnabled());

    await userEvent.click(submitButton);

    // Wait for and then verify the onSubmit was called with the correct token
    await expect(args.onSubmit).toHaveBeenCalled();
    await expect(args.onSubmit).toHaveBeenCalledWith(VALID_TOKEN);
  },
};

export const InvalidToken: Story = {
  args: {
    initialValue: INVALID_TOKEN,
    onSubmit: fn<(token: string) => void>(),
  },
  parameters: {
    msw: {
      handlers: [
        http.get("https://api.github.com/user", () => {
          return HttpResponse.json(
            {
              documentation_url: "https://docs.github.com/rest",
              message: "Bad credentials",
              status: 401,
            },
            { status: 401 },
          );
        }),
      ],
    },
  },
};
