import type { Meta, StoryObj } from "@storybook/react";

import Header from "@/components/header";
import { GitHubDataProvider } from "@/providers/github-data-provider";

const meta: Meta<typeof Header> = {
  component: Header,
  decorators: [
    (Story) => (
      <GitHubDataProvider>
        <Story />
      </GitHubDataProvider>
    ),
  ],
  title: "Components/Header",
};

export default meta;
type Story = StoryObj<typeof Header>;

export const Default: Story = {};

export const LoggedIn: Story = {
  decorators: [
    (Story) => {
      // Mock localStorage for logged in state
      if (typeof window !== "undefined") {
        localStorage.setItem(
          "pat",
          "ghp_validtoken123456789012345678901234567890",
        );
        localStorage.setItem("login", "testuser");
      }
      return <Story />;
    },
  ],
  parameters: {
    mockData: [
      {
        method: "GET",
        response: {
          avatarUrl: "https://avatars.githubusercontent.com/u/12345?v=4",
          login: "testuser",
          name: "Test User",
        },
        status: 200,
        url: "https://api.github.com/user",
      },
    ],
  },
};

export const Dashboard: Story = {
  decorators: [
    (Story) => {
      // Mock localStorage for logged in state
      if (typeof window !== "undefined") {
        localStorage.setItem(
          "pat",
          "ghp_validtoken123456789012345678901234567890",
        );
        localStorage.setItem("login", "testuser");
      }
      return <Story />;
    },
  ],
  parameters: {
    mockData: [
      {
        method: "GET",
        response: {
          avatarUrl: "https://avatars.githubusercontent.com/u/12345?v=4",
          login: "testuser",
          name: "Test User",
        },
        status: 200,
        url: "https://api.github.com/user",
      },
    ],
    nextjs: {
      navigation: {
        pathname: "/dashboard",
      },
    },
  },
};
