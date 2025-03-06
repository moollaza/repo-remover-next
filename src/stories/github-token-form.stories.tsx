import type { Meta, StoryObj } from "@storybook/react";

import React from "react";

import { GitHubDataProvider } from "@/providers/github-data-provider";

import GitHubTokenForm from "../components/github-token-form";

const meta: Meta<typeof GitHubTokenForm> = {
  component: GitHubTokenForm,
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
type Story = StoryObj<typeof GitHubTokenForm>;

export const Default: Story = {};

export const WithValidToken: Story = {
  decorators: [
    (Story) => {
      // Mock the GitHub provider validation to return success
      const originalFetch = window.fetch;
      window.fetch = async (input) => {
        // Safely check if input is a string or has a URL property
        const inputUrl =
          typeof input === "string"
            ? input
            : input instanceof Request
              ? input.url
              : String(input);

        if (inputUrl.includes("api.github.com/user")) {
          return {
            json: async () => {
              // Add await to a Promise to satisfy the require-await rule
              await Promise.resolve();
              return {
                avatarUrl: "https://avatars.githubusercontent.com/u/12345?v=4",
                login: "testuser",
                name: "Test User",
              };
            },
            ok: true,
            status: 200,
          } as Response;
        }
        return originalFetch(input);
      };
      return <Story />;
    },
  ],
};

export const WithInvalidToken: Story = {
  decorators: [
    (Story) => {
      // Mock the GitHub provider validation to return an error
      const originalFetch = window.fetch;
      window.fetch = async (input) => {
        // Safely check if input is a string or has a URL property
        const inputUrl =
          typeof input === "string"
            ? input
            : input instanceof Request
              ? input.url
              : String(input);

        if (inputUrl.includes("api.github.com/user")) {
          return {
            json: async () => {
              // Add await to a Promise to satisfy the require-await rule
              await Promise.resolve();
              return { message: "Bad credentials" };
            },
            ok: false,
            status: 401,
          } as Response;
        }
        return originalFetch(input);
      };
      return <Story />;
    },
  ],
};
