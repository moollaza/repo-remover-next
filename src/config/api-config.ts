/**
 * GitHub API Configuration
 *
 * This file contains all constants related to GitHub API interactions,
 * including pagination settings, timeouts, and rate limit configurations.
 */

/**
 * GitHub GraphQL API pagination size
 * Maximum number of items to fetch per page for repositories and organizations
 * GitHub's maximum is 100 items per page
 */
export const GITHUB_API_PAGE_SIZE = 100;

/**
 * Delay between repository creation operations (in milliseconds)
 * Used to avoid hitting rate limits when generating test repositories
 */
export const REPO_CREATION_DELAY_MS = 500;

/**
 * Number of retry attempts for rate-limited requests
 * After this many retries, the request will fail
 */
export const RATE_LIMIT_RETRY_COUNT = 1;

/**
 * Throttle plugin configuration for Octokit
 */
export const THROTTLE_CONFIG = {
  /**
   * Number of retry attempts before giving up on rate-limited requests
   */
  retryCount: RATE_LIMIT_RETRY_COUNT,
} as const;

/**
 * GitHub token format validation patterns
 * Reference: https://github.blog/changelog/2021-03-31-authentication-token-format-updates-are-generally-available/
 */
export const TOKEN_VALIDATION = {
  /**
   * Fine-grained personal access token prefix
   */
  finGrainedPrefix: "github_pat_",

  /**
   * Minimum length for fine-grained tokens (github_pat_ + at least 29 chars)
   */
  minFineGrainedLength: 40,

  /**
   * Standard GitHub token prefixes (3-letter prefix + underscore)
   */
  standardPrefixes: ["ghp_", "gho_", "ghu_", "ghs_", "ghr_"],

  /**
   * Standard token length (including prefix)
   */
  standardTokenLength: 40,
} as const;
