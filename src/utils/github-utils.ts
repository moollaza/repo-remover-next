import { faker } from "@faker-js/faker";
import { type Repository } from "@octokit/graphql-schema";
import { throttling } from "@octokit/plugin-throttling";
import { Octokit } from "@octokit/rest";

// Create a custom Octokit class with the throttling plugin
export const ThrottledOctokit = Octokit.plugin(throttling);

const DEBUG = false;

export async function generateRepos(
  octokit: Octokit,
  setLoading: (loading: boolean) => void,
  numberOfRepos = 10,
): Promise<void> {
  DEBUG && console.log("Generating random repos...");
  setLoading(true);

  try {
    for (let i = 0; i < numberOfRepos; i++) {
      DEBUG && console.log(`Creating repo ${i + 1}...`);
      await octokit.rest.repos.createForAuthenticatedUser({
        description: faker.company.catchPhrase(),
        homepage: faker.internet.url(),
        name: faker.company.name(),
        private: faker.datatype.boolean(),
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

export function isValidGitHubToken(token: string): boolean {
  if (!token) return false;

  // Special case for github_pat_ tokens
  if (token.startsWith("github_pat_")) {
    return token.length >= 40 && /^[a-zA-Z0-9_]+$/.test(token.slice(11));
  }

  // All other tokens start with 3-letter prefix + underscore and are exactly 40 chars
  const standardPrefixes = ["ghp_", "gho_", "ghu_", "ghs_", "ghr_"];
  const matchedPrefix = standardPrefixes.find((prefix) =>
    token.startsWith(prefix),
  );

  if (!matchedPrefix) return false;
  if (token.length !== 40) return false;

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
    console.error(errorMessage);
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
    console.error(errorMessage);
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
  if (action === "archive") {
    await archiveRepo(octokit, repo);
  } else if (action === "delete") {
    await deleteRepo(octokit, repo);
  }
};

/**
 * Creates a throttled Octokit instance with standardized rate limiting options
 * @param token GitHub Personal Access Token
 * @returns Throttled Octokit instance
 */
export function createThrottledOctokit(token: string): Octokit {
  return new ThrottledOctokit({
    auth: token,
    throttle: {
      onRateLimit: (retryAfter, options, octokitInstance, retryCount) => {
        // Retry once, then give up
        if (retryCount < 1) {
          DEBUG &&
            console.log(`Rate limited, retrying after ${retryAfter} seconds`);
          return true;
        }
        DEBUG &&
          console.log(`Rate limited, giving up after ${retryCount} retries`);
        return false;
      },
      onSecondaryRateLimit: (retryAfter, options) => {
        // Don't retry secondary rate limits (abuse detection)
        DEBUG &&
          console.log(
            `Secondary rate limit detected for ${options.method} ${options.url}`,
          );
        return false;
      },
    },
  });
}
