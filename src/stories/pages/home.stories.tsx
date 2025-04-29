import type { Meta, StoryObj } from "@storybook/react";

import { GitHubDataDecorator, PageDecorator } from "@/../.storybook/decorators";
import HomePage from "@/app/page";

const meta: Meta<typeof HomePage> = {
  component: HomePage,
  decorators: [PageDecorator, GitHubDataDecorator],
  parameters: {
    layout: "fullscreen",
  },
  title: "Pages/Home",
};

export default meta;

type Story = StoryObj<typeof HomePage>;

export const Default: Story = {};
