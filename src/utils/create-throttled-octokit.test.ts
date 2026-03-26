import { beforeEach, describe, expect, it, vi } from "vitest";

interface CapturedOptions {
  auth: string;
  throttle: ThrottleConfig;
}

interface ThrottleConfig {
  onRateLimit: (
    retryAfter: number,
    options: unknown,
    octokit: unknown,
    retryCount: number,
  ) => boolean;
  onSecondaryRateLimit: () => boolean;
}

// Use vi.hoisted so the mock is available when vi.mock factories run
const { getCapturedOptions, MockConstructor } = vi.hoisted(() => {
  let capturedOptions: CapturedOptions | null = null;

  // Must use `function` (not arrow) so it can be called with `new`
  const MockConstructor = vi.fn().mockImplementation(function (
    this: unknown,
    options: CapturedOptions,
  ) {
    capturedOptions = options;
  });

  return {
    getCapturedOptions: () => capturedOptions,
    MockConstructor,
  };
});

vi.mock("@octokit/rest", () => ({
  Octokit: {
    plugin: vi.fn().mockReturnValue(MockConstructor),
  },
}));

vi.mock("@octokit/plugin-throttling", () => ({
  throttling: "mock-throttling",
}));

vi.mock("@octokit/plugin-paginate-graphql", () => ({
  paginateGraphQL: "mock-paginate",
}));

// Import after mocking so the module-level ThrottledOctokit uses the mock
import { createThrottledOctokit } from "./github-utils";

describe("createThrottledOctokit", () => {
  beforeEach(() => {
    MockConstructor.mockClear();
  });

  it("should create a ThrottledOctokit instance with the provided token", () => {
    const token = "ghp_testtoken1234567890abcdef12345678";
    createThrottledOctokit(token);

    expect(MockConstructor).toHaveBeenCalledOnce();
    const options = getCapturedOptions();
    expect(options).not.toBeNull();
    expect(options!.auth).toBe(token);
  });

  it("onRateLimit should return true on first retry (retryCount=0)", () => {
    createThrottledOctokit("ghp_testtoken1234567890abcdef12345678");

    const { onRateLimit } = getCapturedOptions()!.throttle;
    expect(onRateLimit(60, {}, {}, 0)).toBe(true);
  });

  it("onRateLimit should return false on second retry (retryCount=1)", () => {
    createThrottledOctokit("ghp_testtoken1234567890abcdef12345678");

    const { onRateLimit } = getCapturedOptions()!.throttle;
    expect(onRateLimit(60, {}, {}, 1)).toBe(false);
  });

  it("onRateLimit should return false on subsequent retries (retryCount>1)", () => {
    createThrottledOctokit("ghp_testtoken1234567890abcdef12345678");

    const { onRateLimit } = getCapturedOptions()!.throttle;
    expect(onRateLimit(60, {}, {}, 2)).toBe(false);
    expect(onRateLimit(60, {}, {}, 5)).toBe(false);
  });

  it("onSecondaryRateLimit should always return false", () => {
    createThrottledOctokit("ghp_testtoken1234567890abcdef12345678");

    const { onSecondaryRateLimit } = getCapturedOptions()!.throttle;
    expect(onSecondaryRateLimit()).toBe(false);
  });
});
