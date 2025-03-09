import type { Meta, StoryObj } from "@storybook/react";

import { faker } from "@faker-js/faker";
import { Repository } from "@octokit/graphql-schema";

import { GitHubDataProvider } from "@/providers/github-data-provider";

import RepoTable from "../../components/repo-table/repo-table";

// Helper function to create a mock repository
function createMockRepository(overrides: Partial<Repository> = {}): Repository {
  return {
    description: faker.lorem.sentence(),
    id: faker.string.uuid(),
    isArchived: faker.datatype.boolean(),
    isDisabled: faker.datatype.boolean(),
    isFork: faker.datatype.boolean(),
    isInOrganization: faker.datatype.boolean(),
    isMirror: faker.datatype.boolean(),
    isPrivate: faker.datatype.boolean(),
    isTemplate: faker.datatype.boolean(),
    name: faker.lorem.slug(),
    owner: {
      __typename: "User",
      id: faker.string.uuid(),
      login: faker.internet.userName(),
      url: faker.internet.url(),
    },
    updatedAt: faker.date.recent().toISOString(),
    url: faker.internet.url(),
    ...overrides,
  } as Repository;
}

const mockRepos: Repository[] = [
  createMockRepository({
    description: "First test repo",
    isInOrganization: false,
    isPrivate: true,
    name: "test-repo-1",
  }),
  createMockRepository({
    description: "Second test repo",
    isInOrganization: true,
    isPrivate: false,
    name: "test-repo-2",
  }),
  createMockRepository({
    description: "Third test repo",
    isFork: true,
    name: "test-repo-3",
  }),
  createMockRepository({
    description: "Fourth test repo",
    isArchived: true,
    name: "test-repo-4",
  }),
  createMockRepository({
    description: "Fifth test repo",
    isTemplate: true,
    name: "test-repo-5",
  }),
];

const meta: Meta<typeof RepoTable> = {
  component: RepoTable,
  decorators: [
    (Story) => (
      <GitHubDataProvider>
        <Story />
      </GitHubDataProvider>
    ),
  ],
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
    repos: Array.from({ length: 25 }, (_, index) =>
      createMockRepository({ name: `repo-${index + 1}` }),
    ),
  },
};
