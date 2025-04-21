import { faker } from "@faker-js/faker";
import { Repository } from "@octokit/graphql-schema";

import {
  createMockUser,
  createRepoFromTemplate,
  MOCK_REPO_TEMPLATES,
} from "./fixture-utils";

// Seed Faker for consistent results
faker.seed(123456789);

// Factory function to create a mock repository
export function createMockRepo(
  overrides: Partial<Repository> = {},
): Repository {
  const randomTemplateIndex = faker.number.int(MOCK_REPO_TEMPLATES.length - 1);
  const template = MOCK_REPO_TEMPLATES[randomTemplateIndex];

  return createRepoFromTemplate(template, 0, overrides);
}

// Generate a set of mock repositories based on predefined templates
export function generateMockRepos(
  count = 10,
  overrides: Partial<Repository> = {},
): Repository[] {
  const repos: Repository[] = [];
  for (let i = 0; i < count; i++) {
    // Use modulo to cycle through templates when count > templates length
    const templateIndex = i % MOCK_REPO_TEMPLATES.length;
    repos.push(
      createRepoFromTemplate(MOCK_REPO_TEMPLATES[templateIndex], i, overrides),
    );
  }
  return repos;
}

export function getValidPersonalAccessToken() {
  return "ghp_abcdefghijklmnopqrstuvwxyz1234567890";
}

export const mockUser = createMockUser();
export const mockUsers = Array.from({ length: 10 }, () => createMockUser());

export const mockRepos = generateMockRepos();
export const manyMockRepos = generateMockRepos(50);
