import type { Meta, StoryObj } from "@storybook/react";

import { GitHubDataDecorator, PageDecorator } from "@storybook/decorators";

import DashboardPage from "@/app/dashboard/page";

const meta: Meta<typeof DashboardPage> = {
  component: DashboardPage,
  decorators: [PageDecorator, GitHubDataDecorator],
  parameters: {
    msw: {
      handlers: [

      ],
    },
  },
  title: "Pages/Dashboard",
};

export default meta;

type Story = StoryObj<typeof DashboardPage>;

export const Default: Story = {};
