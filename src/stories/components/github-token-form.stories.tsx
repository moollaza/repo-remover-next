import type { Meta, StoryObj } from "@storybook/react";

import { http, HttpResponse } from "msw";
import { initialize, mswDecorator } from "msw-storybook-addon";
import React, { useState } from "react";

import { GitHubDataProvider } from "@/providers/github-data-provider";

import GitHubTokenForm from "../../components/github-token-form";

const VALID_TOKEN = "ghp_1234567890abcdef1234567890abcdef1234";
const INVALID_TOKEN = "invalid-token-value";

// Initialize MSW
initialize({
  onUnhandledRequest: "bypass", // Don't warn about unhandled requests
});

// Props for the wrapper component
interface WrapperProps {
  initialValue?: string;
  onSubmit?: (token: string) => void;
}

// Create a wrapper component to handle state for the controlled component
const GitHubTokenFormWrapper: React.FC<WrapperProps> = ({
  initialValue = "",
  onSubmit = () => console.log("Form submitted"),
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
    mswDecorator,
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
    onSubmit: () => console.log("Form submitted"),
  },
};

export const InvalidInput: Story = {
  args: {
    initialValue: "invalid-token-value",
    onSubmit: () => console.log("Form submitted"),
  },
};

export const ValidToken: Story = {
  args: {
    initialValue: VALID_TOKEN,
    onSubmit: () => console.log("Valid token submitted"),
  },
  parameters: {
    msw: {
      handlers: [
        http.get("https://api.github.com/user", () => {
          return HttpResponse.json({
            avatar_url: "https://avatars.githubusercontent.com/u/12345?v=4",
            login: "testuser",
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
    onSubmit: () => console.log("Invalid token submitted"),
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
