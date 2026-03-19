import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { debug } from "./debug";

describe("debug.sanitize", () => {
  it("sanitizes GitHub PAT tokens in strings", () => {
    expect(debug.sanitize("token ghp_abc123XYZ")).toBe("token [REDACTED]");
    expect(debug.sanitize("github_pat_abc123_xyz")).toBe("[REDACTED]");
    expect(debug.sanitize("Bearer ghp_abc123")).toBe("Bearer [REDACTED]");
  });

  it("sanitizes sensitive keys in objects", () => {
    const result = debug.sanitize({ name: "test", token: "ghp_secret" });
    expect(result).toEqual({ name: "test", token: "[REDACTED]" });
  });

  it("preserves Error message and name after sanitization", () => {
    const err = new Error("Something failed with ghp_abc123");
    const result = debug.sanitize(err) as Record<string, unknown>;

    expect(result).toHaveProperty("name", "Error");
    expect(result).toHaveProperty("message");
    // The token in the message should be redacted
    expect(result.message).toBe("Something failed with [REDACTED]");
  });

  it("handles Error subclasses", () => {
    const err = new TypeError("bad type ghp_abc123");
    const result = debug.sanitize(err) as Record<string, unknown>;

    expect(result).toHaveProperty("name", "TypeError");
    expect(result).toHaveProperty("message", "bad type [REDACTED]");
  });

  it("returns primitives unchanged", () => {
    expect(debug.sanitize(42)).toBe(42);
    expect(debug.sanitize(null)).toBe(null);
    expect(debug.sanitize(undefined)).toBe(undefined);
    expect(debug.sanitize(true)).toBe(true);
  });

  it("sanitizes arrays recursively", () => {
    const result = debug.sanitize(["ghp_abc123", "safe"]);
    expect(result).toEqual(["[REDACTED]", "safe"]);
  });

  it("sanitizes nested objects recursively", () => {
    const result = debug.sanitize({
      outer: { apiKey: "secret", data: "ghp_abc123" },
    });
    expect(result).toEqual({
      outer: { apiKey: "[REDACTED]", data: "[REDACTED]" },
    });
  });
});

describe("debug.error", () => {
  let consoleSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleSpy = vi
      .spyOn(console, "error")
      .mockImplementation((() => undefined) as typeof console.error);
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  it("logs Error objects with preserved message", () => {
    const err = new Error("request failed ghp_abc123");
    debug.error("oops", err);

    expect(consoleSpy).toHaveBeenCalledWith(
      "[ERROR] oops",
      expect.objectContaining({
        message: "request failed [REDACTED]",
        name: "Error",
      }),
    );
  });
});
