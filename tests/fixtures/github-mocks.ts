import type { Repository } from "@octokit/graphql-schema";

export const mockUser = {
  avatarUrl: "https://github.com/testuser.png",
  bioHTML: "<p>Test user bio</p>",
  id: "u1",
  login: "testuser",
  name: "Test User",
};

export const mockRepos = [
  {
    description: "Test repository 1",
    id: "1",
    isArchived: false,
    isDisabled: false,
    isFork: false,
    isInOrganization: false,
    isMirror: false,
    isPrivate: true,
    isTemplate: false,
    name: "test-repo-1",
    owner: {
      login: "testuser",
      url: "https://github.com/testuser",
    },
    updatedAt: "2024-02-26T00:00:00Z",
    url: "https://github.com/testuser/test-repo-1",
    viewerCanAdminister: true,
  },
  {
    description: "Test repository 2",
    id: "2",
    isArchived: true,
    isDisabled: false,
    isFork: true,
    isInOrganization: false,
    isMirror: false,
    isPrivate: false,
    isTemplate: false,
    name: "test-repo-2",
    owner: {
      login: "testuser",
      url: "https://github.com/testuser",
    },
    updatedAt: "2024-02-25T00:00:00Z",
    url: "https://github.com/testuser/test-repo-2",
    viewerCanAdminister: true,
  },
] as Repository[];
