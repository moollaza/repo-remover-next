import type { Meta, StoryObj } from "@storybook/react";

import { ThemeSwitcher } from "./theme-switcher";

const meta: Meta<typeof ThemeSwitcher> = {
  component: ThemeSwitcher,
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
    layout: "centered",
  },
  title: "Components/ThemeSwitcher",
};

export default meta;
type Story = StoryObj<typeof ThemeSwitcher>;

export const Default: Story = {};