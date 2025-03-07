import { Octokit } from "@octokit/rest";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { createThrottledOctokit } from "../github-utils";

// Mock the Octokit and throttling plugin
vi.mock("@octokit/rest", () => {
  const mockOctokit = vi.fn().mockImplementation((options) => {
    // Store the throttle options for tests to access
    (mockOctokit as any).lastOptions = options;

    return {
      rest: {
        users: {
          getAuthenticated: vi.fn().mockResolvedValue({
            data: { login: "testuser" },
          }),
        },
      },
    };
  });

  // Add plugin method to the constructor function
  (mockOctokit as any).plugin = vi.fn().mockImplementation(() => mockOctokit);

  return {
    Octokit: mockOctokit,
  };
});

vi.mock("@octokit/plugin-throttling", () => ({
  throttling: vi.fn(),
}));

describe("createThrottledOctokit", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should create an Octokit instance with auth token", () => {
    const token = "ghp_testtoken123";
    const octokit = createThrottledOctokit(token);

    // We don't test plugin call directly since we're mocking the entire module

    // Verify Octokit was instantiated with correct auth
    expect(Octokit).toHaveBeenCalledTimes(1);
    expect(vi.mocked(Octokit).mock.calls[0][0]).toHaveProperty("auth", token);
    expect(octokit).toBeDefined();
  });

  it("should configure throttling with rate limit handling", () => {
    const token = "ghp_testtoken123";
    const octokit = createThrottledOctokit(token);

    // Access the stored options from our mock
    const options = (Octokit as any).lastOptions;
    expect(options).toBeDefined();
    expect(options.throttle).toBeDefined();

    // Test the rate limit handler with mock values
    const { onRateLimit, onSecondaryRateLimit } = options.throttle;

    // Should retry once (when retryCount is 0)
    expect(onRateLimit(60, {}, {}, 0)).toBe(true);

    // Should not retry a second time (when retryCount is 1)
    expect(onRateLimit(60, {}, {}, 1)).toBe(false);

    // Should not retry secondary rate limits
    expect(onSecondaryRateLimit()).toBe(false);
  });
});
