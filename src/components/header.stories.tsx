import type { Meta, StoryObj } from "@storybook/react";

import {
  AuthenticatedUserDecorator,
  GitHubDataDecorator,
} from "@/../.storybook/decorators";
import Header from "@/components/header";

const meta: Meta<typeof Header> = {
  component: Header,
  title: "Components/Header",
};

export default meta;
type Story = StoryObj<typeof Header>;

export const Default: Story = {
  decorators: [],
};

export const LoggedIn: Story = {
  decorators: [GitHubDataDecorator, AuthenticatedUserDecorator],
};

export const Dashboard: Story = {
  decorators: [GitHubDataDecorator, AuthenticatedUserDecorator],
  parameters: {
    nextjs: {
      navigation: {
        pathname: "/dashboard",
      },
    },
  },
};
