import type { Meta, StoryObj } from "@storybook/react";

import { PageDecorator } from "@/../.storybook/decorators";
import { Home } from "@/routes/home";

const meta: Meta<typeof Home> = {
  component: Home,
  decorators: [PageDecorator],
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
  },
  title: "Pages/Home",
};

export default meta;

type Story = StoryObj<typeof Home>;

export const Default: Story = {};
