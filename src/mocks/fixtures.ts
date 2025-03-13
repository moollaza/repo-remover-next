import { faker } from "@faker-js/faker";
import { Repository } from "@octokit/graphql-schema";

// Factory function to create a mock repository
export function createMockRepo(
  overrides: Partial<Repository> = {},
): Repository {
  const owner = overrides.owner ?? {
    id: faker.string.uuid(),
    login: faker.internet.userName().toLowerCase(),
    updatedAt: faker.date.recent().toISOString(),
    url: `https://github.com/${faker.internet.userName().toLowerCase()}`,
  };

  const repoName = faker.word.words(2).toLowerCase().replace(/\s+/g, "-");
  const isFork =
    overrides.isFork ?? faker.datatype.boolean({ probability: 0.2 });

  return {
    description: faker.lorem.sentence(),
    id: faker.string.uuid(),
    isArchived: faker.datatype.boolean({ probability: 0.1 }),
    isDisabled: faker.datatype.boolean({ probability: 0.05 }),
    isFork,
    isInOrganization: faker.datatype.boolean({ probability: 0.3 }),
    isMirror: faker.datatype.boolean({ probability: 0.05 }),
    isPrivate: faker.datatype.boolean(),
    isTemplate: faker.datatype.boolean({ probability: 0.05 }),
    name: repoName,
    owner,
    parent: isFork
      ? {
          name: faker.word.words(2).toLowerCase().replace(/\s+/g, "-"),
          owner: {
            login: faker.internet.userName().toLowerCase(),
          },
        }
      : null,
    updatedAt: faker.date.recent().toISOString(),
    url: `https://github.com/${owner.login}/${repoName}`,
    ...overrides,
  } as Repository;
}

// Factory function to create a mock user with Faker
export function createMockUser(overrides = {}) {
  return {
    avatarUrl: faker.image.avatar(),
    bioHTML: `<p>${faker.person.bio()}</p>`,
    id: faker.string.uuid(),
    login: faker.internet.userName().toLowerCase(),
    name: faker.person.fullName(),
    ...overrides,
  };
}

// Generate a set of mock repositories
export function generateMockRepos(count = 10): Repository[] {
  return Array.from({ length: count }, () => createMockRepo());
}

export const mockUser = createMockUser();
export const mockUsers = Array.from({ length: 10 }, () => createMockUser());

export const mockRepos = generateMockRepos();
export const manyMockRepos = generateMockRepos(50);
