import type { Meta, StoryObj } from "@storybook/react";

import { fn } from "@storybook/test";
import { http, HttpResponse } from "msw";
import React, { useState } from "react";

import { GitHubDataDecorator } from "@/../.storybook/decorators";
import GitHubTokenForm from "@/components/github-token-form";

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
  decorators: [GitHubDataDecorator],
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
  parameters: {
    msw: {
      handlers: [
        http.get("https://api.github.com/user", () => {
          return HttpResponse.json({
            login: "testuser",
            id: 1,
            avatar_url: "https://avatars.githubusercontent.com/u/1?v=4",
            name: "Test User",
          });
        }),
      ],
    },
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
