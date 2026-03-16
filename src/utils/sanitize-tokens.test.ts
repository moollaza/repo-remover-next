import { describe, expect, it } from "vitest";

import { sanitizeTokens } from "./sanitize-tokens";

describe("sanitizeTokens", () => {
  it("should redact ghp_ tokens (classic PATs)", () => {
    const input = "Error with token ghp_1234567890abcdef1234567890abcdef1234";
    expect(sanitizeTokens(input)).not.toContain("ghp_");
    expect(sanitizeTokens(input)).toContain("[REDACTED_PAT]");
  });

  it("should redact github_pat_ tokens (fine-grained PATs)", () => {
    const input = "Token: github_pat_11AABB_abcDEFghiJKL";
    expect(sanitizeTokens(input)).not.toContain("github_pat_");
  });

  it("should redact gho_ tokens (OAuth)", () => {
    const input = "Error: gho_1234567890abcdef1234567890abcdef1234";
    expect(sanitizeTokens(input)).not.toContain("gho_");
    expect(sanitizeTokens(input)).toContain("[REDACTED_TOKEN]");
  });

  it("should redact ghu_ tokens (user-to-server)", () => {
    const input = "Error: ghu_1234567890abcdef1234567890abcdef1234";
    expect(sanitizeTokens(input)).not.toContain("ghu_");
  });

  it("should redact ghs_ tokens (installation)", () => {
    const input = "Error: ghs_1234567890abcdef1234567890abcdef1234";
    expect(sanitizeTokens(input)).not.toContain("ghs_");
  });

  it("should redact ghr_ tokens (refresh)", () => {
    const input = "Error: ghr_1234567890abcdef1234567890abcdef1234";
    expect(sanitizeTokens(input)).not.toContain("ghr_");
  });

  it("should redact Bearer tokens", () => {
    const input = "Authorization: Bearer ghp_1234567890abcdef1234";
    expect(sanitizeTokens(input)).toContain("Bearer [REDACTED]");
  });

  it("should preserve non-token text", () => {
    const input = "Normal error: something went wrong";
    expect(sanitizeTokens(input)).toBe(input);
  });
});
