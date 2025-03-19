import type { Meta, StoryObj } from "@storybook/react";

import RepoTable from "@/components/repo-table/repo-table";
import { manyMockRepos, mockRepos } from "@/mocks/fixtures";

const meta: Meta<typeof RepoTable> = {
  component: RepoTable,
  title: "Components/RepoTable",
};

export default meta;
type Story = StoryObj<typeof RepoTable>;

export const Loading: Story = {
  args: {
    isLoading: true,
    repos: null,
  },
};

export const Empty: Story = {
  args: {
    isLoading: false,
    repos: [],
  },
};

export const WithRepos: Story = {
  args: {
    isLoading: false,
    repos: mockRepos,
  },
};

export const WithManyRepos: Story = {
  args: {
    isLoading: false,
    repos: manyMockRepos,
  },
};
