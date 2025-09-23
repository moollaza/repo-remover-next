import type { Meta, StoryObj } from "@storybook/react";

import { GitHubDataDecorator } from "@/../.storybook/decorators";

import DashboardPage from "./page";

const meta: Meta<typeof DashboardPage> = {
  component: DashboardPage,
  decorators: [GitHubDataDecorator],
  parameters: {
    chromatic: {
      modes: {
        dark: {
          theme: "dark",
        },
        light: {
          theme: "light",
        },
      },
    },
    layout: "fullscreen",
    nextjs: {
      appDirectory: true,
    },
  },
  title: "Pages/Dashboard",
};

export default meta;
type Story = StoryObj<typeof DashboardPage>;

export const Default: Story = {};