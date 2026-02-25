import type { Meta, StoryObj } from "@storybook/react";

import RepoTableSkeleton from "@/components/repo-table/repo-table-skeleton";

const meta: Meta<typeof RepoTableSkeleton> = {
  component: RepoTableSkeleton,
  parameters: {
    chromatic: {
      modes: {
        dark: { theme: "dark" },
        light: { theme: "light" },
      },
    },
    layout: "fullscreen",
  },
  title: "Components/RepoTable/Skeleton",
};

export default meta;
type Story = StoryObj<typeof RepoTableSkeleton>;

/** Default skeleton with 10 rows */
export const Default: Story = {
  args: {
    rows: 10,
  },
};

/** Fewer rows (first page of 5) */
export const FiveRows: Story = {
  args: {
    rows: 5,
  },
};

/** Many rows (first page of 20) */
export const TwentyRows: Story = {
  args: {
    rows: 20,
  },
};

/** Minimal skeleton (3 rows) */
export const MinimalRows: Story = {
  args: {
    rows: 3,
  },
};
