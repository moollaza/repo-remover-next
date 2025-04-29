import { faker } from "@faker-js/faker";
import { Repository } from "@octokit/graphql-schema";

// Owner type for template definitions
export type OwnerType = "current-user" | "organization" | "other-user";

// Repository template interface
export interface RepoTemplate {
  description: string;
  isArchived: boolean;
  isFork: boolean;
  isInOrganization?: boolean;
  isPrivate: boolean;
  name: string;
  ownerType: OwnerType;
  viewerCanAdminister: boolean;
}

// Predefined repository templates to ensure consistent test data
export const MOCK_REPO_TEMPLATES: RepoTemplate[] = [
  {
    description: "Public repository owned by the current user",
    isArchived: false,
    isFork: false,
    isPrivate: false,
    name: "repo-1",
    ownerType: "current-user",
    viewerCanAdminister: true,
  },
  {
    description: "Private repository owned by the current user",
    isArchived: false,
    isFork: false,
    isPrivate: true,
    name: "repo-2",
    ownerType: "current-user",
    viewerCanAdminister: true,
  },
  {
    description: "Archived public repository owned by the current user",
    isArchived: true,
    isFork: false,
    isPrivate: false,
    name: "repo-3",
    ownerType: "current-user",
    viewerCanAdminister: true,
  },
  {
    description: "Forked public repository owned by the current user",
    isArchived: false,
    isFork: true,
    isPrivate: false,
    name: "repo-4",
    ownerType: "current-user",
    viewerCanAdminister: true,
  },
  {
    description: "Private forked repository owned by the current user",
    isArchived: false,
    isFork: true,
    isPrivate: true,
    name: "repo-5",
    ownerType: "current-user",
    viewerCanAdminister: true,
  },
  {
    description: "Public repository owned by another user",
    isArchived: false,
    isFork: false,
    isPrivate: false,
    name: "repo-6",
    ownerType: "other-user",
    viewerCanAdminister: false,
  },
  {
    description: "Public repository owned by another user with admin rights",
    isArchived: false,
    isFork: false,
    isPrivate: false,
    name: "repo-7",
    ownerType: "other-user",
    viewerCanAdminister: true,
  },
  {
    description: "Public repository owned by an organization",
    isArchived: false,
    isFork: false,
    isInOrganization: true,
    isPrivate: false,
    name: "repo-8",
    ownerType: "organization",
    viewerCanAdminister: false,
  },
  {
    description: "Public repository owned by an organization with admin rights",
    isArchived: false,
    isFork: false,
    isInOrganization: true,
    isPrivate: false,
    name: "repo-9",
    ownerType: "organization",
    viewerCanAdminister: true,
  },
  {
    description:
      "Private repository owned by an organization with admin rights",
    isArchived: false,
    isFork: false,
    isInOrganization: true,
    isPrivate: true,
    name: "repo-10",
    ownerType: "organization",
    viewerCanAdminister: true,
  },
];

// Factory function to create a mock user with Faker
export function createMockUser(overrides = {}) {
  return {
    avatarUrl: faker.image.avatar(),
    bioHTML: `<p>${faker.person.bio()}</p>`,
    id: faker.string.uuid(),
    login: "testuser",
    name: "Test User",
    url: "https://github.com/testuser",
    ...overrides,
  };
}

// Utility function to create an owner based on type and index
export function createOwner(ownerType: OwnerType, index = 0) {
  if (ownerType === "current-user") {
    return {
      id: faker.string.uuid(),
      login: "testuser",
      updatedAt: faker.date.recent().toISOString(),
      url: "https://github.com/testuser",
    };
  } else if (ownerType === "other-user") {
    const username = `user-${index}`;
    return {
      id: faker.string.uuid(),
      login: username,
      updatedAt: faker.date.recent().toISOString(),
      url: `https://github.com/${username}`,
    };
  } else {
    const orgName = `org-${index}`;
    return {
      id: faker.string.uuid(),
      login: orgName,
      updatedAt: faker.date.recent().toISOString(),
      url: `https://github.com/${orgName}`,
    };
  }
}

// Utility function to create a parent repository for forks
export function createParentRepo(repoName: string) {
  // Generate a random username for the parent repo owner
  const randomUsername = faker.internet
    .userName()
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, "-");

  return {
    name: `parent-of-${repoName}`,
    owner: {
      login: randomUsername,
    },
  };
}

// Core function to create a repository from a template or overrides
export function createRepoFromTemplate(
  template: RepoTemplate,
  index = 0,
  overrides: Partial<Repository> = {},
): Repository {
  // Set the owner based on the template's ownerType or override
  const owner = overrides.owner ?? createOwner(template.ownerType, index);

  // Create the parent for forked repos
  const parent = template.isFork ? createParentRepo(template.name) : null;

  // Calculate the updated date for consistent ordering
  const updatedDate = getUpdatedDate(index);

  // Return the repository with properties from the template
  return {
    description: template.description,
    id: faker.string.uuid(),
    isArchived: template.isArchived,
    isDisabled: false,
    isFork: template.isFork,
    isInOrganization: template.isInOrganization ?? false,
    isMirror: false,
    isPrivate: template.isPrivate,
    isTemplate: false,
    name: template.name,
    owner,
    parent,
    updatedAt: updatedDate.toISOString(),
    url: `https://github.com/${owner.login}/${template.name}`,
    viewerCanAdminister: template.viewerCanAdminister,
    ...overrides,
  } as Repository;
}

// Calculate date for repository with consistent incremental aging
export function getUpdatedDate(index: number) {
  const currentDate = new Date();
  const daysToSubtract = index * 3; // Each repo is 3 days older than the previous one
  return new Date(currentDate.setDate(currentDate.getDate() - daysToSubtract));
}
