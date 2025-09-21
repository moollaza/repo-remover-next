import { Repository } from "@octokit/graphql-schema";

// Static mock user data
export const MOCK_USER = {
  id: "user-123456",
  login: "testuser",
  name: "Test User",
  avatarUrl: "https://avatars.githubusercontent.com/u/123456?v=4",
  bioHTML: "<p>Test user bio for testing purposes</p>",
  url: "https://github.com/testuser",
};

// Static mock repositories covering core scenarios
export const MOCK_REPOS: Repository[] = [
  {
    id: "repo-1",
    name: "test-repo-1",
    description: "First test repo",
    isPrivate: false,
    isArchived: false,
    isFork: false,
    isTemplate: false,
    isMirror: false,
    isLocked: false,
    isInOrganization: false,
    viewerCanAdminister: true,
    owner: {
      id: "user-123456",
      login: "testuser",
      url: "https://github.com/testuser",
    },
    parent: null,
    updatedAt: "2023-12-01T10:00:00Z",
    url: "https://github.com/testuser/test-repo-1",
  } as Repository,
  {
    id: "repo-2", 
    name: "test-repo-2",
    description: "Second test repo",
    isPrivate: true,
    isArchived: true,
    isFork: false,
    isTemplate: false,
    isMirror: false,
    isLocked: false,
    isInOrganization: true,
    viewerCanAdminister: true,
    owner: {
      id: "user-123456",
      login: "testuser", 
      url: "https://github.com/testuser",
    },
    parent: null,
    updatedAt: "2023-11-15T14:30:00Z",
    url: "https://github.com/testuser/test-repo-2",
  } as Repository,
  {
    id: "repo-3",
    name: "forked-repo",
    description: "A forked repository",
    isPrivate: false,
    isArchived: false,
    isFork: true,
    isTemplate: false,
    isMirror: false,
    isLocked: false,
    isInOrganization: false,
    viewerCanAdminister: true,
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
  } as Repository,
  {
    id: "repo-4",
    name: "org-repo",
    description: "Repository in organization",
    isPrivate: false,
    isArchived: false,
    isFork: false,
    isTemplate: false,
    isMirror: false,
    isLocked: false,
    isInOrganization: true,
    viewerCanAdminister: false,
    owner: {
      id: "org-456789",
      login: "testorg",
      url: "https://github.com/testorg",
    },
    parent: null,
    updatedAt: "2023-09-05T16:45:00Z",
    url: "https://github.com/testorg/org-repo",
  } as Repository,
  {
    id: "repo-5",
    name: "admin-org-repo", 
    description: "Organization repo with admin access",
    isPrivate: true,
    isArchived: false,
    isFork: false,
    isTemplate: false,
    isMirror: false,
    isLocked: false,
    isInOrganization: true,
    viewerCanAdminister: true,
    owner: {
      id: "org-456789",
      login: "testorg",
      url: "https://github.com/testorg",
    },
    parent: null,
    updatedAt: "2023-08-12T12:00:00Z",
    url: "https://github.com/testorg/admin-org-repo",
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