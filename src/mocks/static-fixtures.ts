import { Repository } from "@octokit/graphql-schema";

// Static mock user data
export const MOCK_USER = {
  avatarUrl: "https://avatars.githubusercontent.com/u/123456?v=4",
  bioHTML: "<p>Test user bio for testing purposes</p>",
  id: "user-123456",
  login: "testuser",
  name: "Test User",
  url: "https://github.com/testuser",
};

// Static mock repositories covering core scenarios
export const MOCK_REPOS: Repository[] = [
  {
    description: "First test repo",
    id: "repo-1",
    isArchived: false,
    isFork: false,
    isInOrganization: false,
    isLocked: false,
    isMirror: false,
    isPrivate: false,
    isTemplate: false,
    name: "test-repo-1",
    owner: {
      id: "user-123456",
      login: "testuser",
      url: "https://github.com/testuser",
    },
    parent: null,
    updatedAt: "2023-12-01T10:00:00Z",
    url: "https://github.com/testuser/test-repo-1",
    viewerCanAdminister: true,
  } as Repository,
  {
    description: "Second test repo", 
    id: "repo-2",
    isArchived: true,
    isFork: false,
    isInOrganization: true,
    isLocked: false,
    isMirror: false,
    isPrivate: true,
    isTemplate: false,
    name: "test-repo-2",
    owner: {
      id: "user-123456",
      login: "testuser", 
      url: "https://github.com/testuser",
    },
    parent: null,
    updatedAt: "2023-11-15T14:30:00Z",
    url: "https://github.com/testuser/test-repo-2",
    viewerCanAdminister: true,
  } as Repository,
  {
    description: "A forked repository",
    id: "repo-3",
    isArchived: false,
    isFork: true,
    isInOrganization: false,
    isLocked: false,
    isMirror: false,
    isPrivate: false,
    isTemplate: false,
    name: "forked-repo",
    owner: {
      id: "user-123456",
      login: "testuser",
      url: "https://github.com/testuser",
    },
    parent: {
      name: "original-repo",
      owner: {
        login: "originalowner",
      },
    },
    updatedAt: "2023-10-20T08:15:00Z",
    url: "https://github.com/testuser/forked-repo", 
    viewerCanAdminister: true,
  } as Repository,
  {
    description: "Repository in organization",
    id: "repo-4",
    isArchived: false,
    isFork: false,
    isInOrganization: true,
    isLocked: false,
    isMirror: false,
    isPrivate: false,
    isTemplate: false,
    name: "org-repo",
    owner: {
      id: "org-456789",
      login: "testorg",
      url: "https://github.com/testorg",
    },
    parent: null,
    updatedAt: "2023-09-05T16:45:00Z",
    url: "https://github.com/testorg/org-repo",
    viewerCanAdminister: false,
  } as Repository,
  {
    description: "Organization repo with admin access",
    id: "repo-5", 
    isArchived: false,
    isFork: false,
    isInOrganization: true,
    isLocked: false,
    isMirror: false,
    isPrivate: true,
    isTemplate: false,
    name: "admin-org-repo",
    owner: {
      id: "org-456789",
      login: "testorg",
      url: "https://github.com/testorg",
    },
    parent: null,
    updatedAt: "2023-08-12T12:00:00Z",
    url: "https://github.com/testorg/admin-org-repo",
    viewerCanAdminister: true,
  } as Repository,
];

// Helper function to create a mock repo with overrides
export function createMockRepo(overrides: Partial<Repository> = {}): Repository {
  const baseRepo = MOCK_REPOS[0];
  return {
    ...baseRepo,
    ...overrides,
    owner: {
      ...baseRepo.owner,
      ...overrides.owner,
    },
  } as Repository;
}

// Valid GitHub Personal Access Token for testing
export function getValidPersonalAccessToken(): string {
  return "ghp_abcdefghijklmnopqrstuvwxyz1234567890";
}

// Mock organizations
export const MOCK_ORGANIZATIONS = [
  {
    login: "testorg",
    url: "https://github.com/testorg",
  },
  {
    login: "anotherorg", 
    url: "https://github.com/anotherorg",
  },
];

// Export commonly used subsets
export const mockUser = MOCK_USER;
export const mockRepos = MOCK_REPOS;
export const mockUsers = [MOCK_USER]; // For compatibility
export const manyMockRepos = [...MOCK_REPOS, ...MOCK_REPOS]; // For large dataset tests