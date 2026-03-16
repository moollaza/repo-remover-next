/**
 * Sanitize GitHub tokens from text for Sentry error reporting.
 * Matches all GitHub token formats: ghp_, gho_, ghu_, ghs_, ghr_, github_pat_
 */
export function sanitizeTokens(text: string): string {
  return text
    .replace(/ghp_[a-zA-Z0-9]{36}/g, "[REDACTED_PAT]")
    .replace(/github_pat_[a-zA-Z0-9_]+/g, "[REDACTED_PAT]")
    .replace(/gh[orus]_[a-zA-Z0-9]+/g, "[REDACTED_TOKEN]")
    .replace(/Bearer\s+[a-zA-Z0-9_.-]+/g, "Bearer [REDACTED]");
}
