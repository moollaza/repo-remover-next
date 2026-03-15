import { type Repository } from "@octokit/graphql-schema";
import { paginateGraphQL } from "@octokit/plugin-paginate-graphql";
import { throttling } from "@octokit/plugin-throttling";
import { Octokit } from "@octokit/rest";

import { analytics } from "@/utils/analytics";
import { debug } from "@/utils/debug";

// Create a custom Octokit class with the throttling plugin and pagination
export const ThrottledOctokit = Octokit.plugin(throttling, paginateGraphQL);

export type ThrottledOctokitType = InstanceType<typeof ThrottledOctokit>;

const DEBUG = false;

// Static test repository data for generation
const REPO_TEMPLATES = [
  {
    description: "A test project for demos",
    homepage: "https://example.com",
    name: "test-project-1",
    private: false,
  },
  {
    description: "Sample application for testing",
    homepage: "https://demo.com",
    name: "sample-app-2",
    private: true,
  },
  {
    description: "Demo repository",
    homepage: "https://test.com",
    name: "demo-repo-3",
    private: false,
  },
  {
    description: "Test library project",
    homepage: "https://lib.com",
    name: "test-lib-4",
    private: true,
  },
  {
    description: "Example project",
    homepage: "https://sample.com",
    name: "example-5",
    private: false,
  },
];

export async function generateRepos(
  octokit: Octokit,
  setLoading: (loading: boolean) => void,
  numberOfRepos = 10,
): Promise<void> {
  DEBUG && console.log("Generating test repos...");
  setLoading(true);

  try {
    for (let i = 0; i < numberOfRepos; i++) {
      DEBUG && console.log(`Creating repo ${i + 1}...`);
      const template = REPO_TEMPLATES[i % REPO_TEMPLATES.length];
      await octokit.rest.repos.createForAuthenticatedUser({
        description: template.description,
        homepage: template.homepage,
        name: `${template.name}-${Date.now()}-${i}`, // Make unique
        private: template.private,
      });
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
  } catch (error) {
    const errorMessage = (error as Error).message;
    console.error(errorMessage);
    throw new Error(`Failed to create repositories: ${errorMessage}`);
  } finally {
    setLoading(false);
  }
}

// Reference: https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/about-authentication-to-github#githubs-token-formats
// Reference: https://github.blog/changelog/2021-03-31-authentication-token-format-updates-are-generally-available/
export function isValidGitHubToken(token: string): boolean {
  if (!token) return false;

  // Special case for github_pat_ tokens
  if (token.startsWith("github_pat_")) {
    return token.length >= 40 && /^[a-zA-Z0-9_]+$/.test(token.slice(11));
  }

  // All other tokens start with 3-letter prefix + underscore
  const standardPrefixes = ["ghp_", "gho_", "ghu_", "ghs_", "ghr_"];
  const matchedPrefix = standardPrefixes.find((prefix) =>
    token.startsWith(prefix),
  );

  if (!matchedPrefix) return false;

  // Standard tokens should be exactly 40 characters in total
  if (token.length !== 40) return false;

  // Check that characters after the prefix are alphanumeric
  return /^[a-zA-Z0-9]+$/.test(token.slice(matchedPrefix.length));
}

export const archiveRepo = async (
  octokit: Octokit,
  repo: Repository,
): Promise<void> => {
  try {
    await octokit.rest.repos.update({
      archived: true,
      owner: repo.owner.login,
      repo: repo.name,
    });
  } catch (error) {
    const errorMessage = (error as Error).message;
    debug.error(errorMessage);
    throw new Error(
      `Failed to archive ${repo.name}: ${(error as Error).message}`,
    );
  }
};

export const deleteRepo = async (
  octokit: Octokit,
  repo: Repository,
): Promise<void> => {
  try {
    await octokit.rest.repos.delete({
      owner: repo.owner.login,
      repo: repo.name,
    });
  } catch (error) {
    const errorMessage = (error as Error).message;
    debug.error(errorMessage);
    throw new Error(
      `Failed to delete ${repo.name}: ${(error as Error).message}`,
    );
  }
};

export const processRepo = async (
  octokit: Octokit,
  repo: Repository,
  action: "archive" | "delete",
): Promise<void> => {
  if (!octokit) {
    throw new Error("Octokit instance is required");
  }

  if (!repo) {
    throw new Error("Repository is required");
  }

  if (!action) {
    throw new Error("Action is required");
  }

  debug.log(`Processing ${action} for ${repo.name}...`);

  if (action === "archive") {
    await archiveRepo(octokit, repo);
    // Track individual successful archive
    analytics.trackRepoArchived();
  } else if (action === "delete") {
    await deleteRepo(octokit, repo);
    // Track individual successful delete
    analytics.trackRepoDeleted();
  }
};

/**
 * Creates a throttled Octokit instance with pagination support
 * @param token GitHub Personal Access Token
 * @returns Octokit instance with throttling and pagination
 */
export function createThrottledOctokit(
  token: string,
): InstanceType<typeof ThrottledOctokit> {
  // Create a custom Octokit instance with the token and throttling
  return new ThrottledOctokit({
    auth: token,
    throttle: {
      onRateLimit: (_retryAfter, _options, _octokitInstance, retryCount) => {
        // Otherwise retry once, then give up
        if (retryCount < 1) {
          if (DEBUG) console.log("[Throttle] Rate limited - retrying once");
          return true;
        }
        if (DEBUG) console.log("[Throttle] Rate limited - giving up");
        return false;
      },
      onSecondaryRateLimit: () => {
        // Don't retry secondary rate limits (abuse detection)
        if (DEBUG)
          console.log(
            "[Throttle] Secondary rate limit detected - not retrying",
          );
        return false;
      },
    },
  });
}
