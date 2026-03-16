import type { Meta, StoryObj } from "@storybook/react";

import { ScrollingQuotes } from "./scrolling-quotes";

const meta: Meta<typeof ScrollingQuotes> = {
  component: ScrollingQuotes,
  parameters: {
    backgrounds: {
      default: "light",
    },
    layout: "centered",
  },
  title: "Components/ScrollingQuotes",
};

export default meta;

type Story = StoryObj<typeof ScrollingQuotes>;

export const Default: Story = {
  parameters: {
    docs: {
      description: {
        story: "Scrolling quotes component with automatic animation detection. Animations are disabled in Storybook and when user prefers reduced motion.",
      },
    },
  },
};

export const WithReducedMotion: Story = {
  decorators: [
    (Story) => (
      <div style={{ width: '800px' }}>
        <style>
          {`
            .no-animations .scrolling-quotes-module__scrolling {
              animation: none !important;
            }
          `}
        </style>
        <div className="no-animations">
          <Story />
        </div>
      </div>
    ),
  ],
  parameters: {
    docs: {
      description: {
        story: "Preview of how the component appears when animations are disabled (e.g., for users who prefer reduced motion).",
      },
    },
  },
};