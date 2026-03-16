import type { Meta, StoryObj } from "@storybook/react";

import RepoTable from "@/components/repo-table/repo-table";
import { manyMockRepos, mockRepos } from "@/mocks/static-fixtures";

const meta: Meta<typeof RepoTable> = {
  component: RepoTable,
  title: "Components/RepoTable",
};

export default meta;
type Story = StoryObj<typeof RepoTable>;

export const Empty: Story = {
  args: {
    login: null,
    repos: [],
  },
};

export const WithRepos: Story = {
  args: {
    login: "testuser",
    repos: mockRepos,
  },
};

export const WithManyRepos: Story = {
  args: {
    login: "testuser",
    repos: manyMockRepos,
  },
};
