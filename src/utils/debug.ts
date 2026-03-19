/**
 * Debug Utility
 *
 * Production-safe logging utility that:
 * - Only logs in development environments
 * - Sanitizes sensitive data (tokens, credentials)
 * - Provides consistent logging interface across the application
 */

/**
 * Check if we're in development mode
 */
const isDevelopment = import.meta.env.DEV;

/**
 * Patterns to detect and sanitize sensitive data
 */
const SENSITIVE_PATTERNS = [
  /github_pat_[a-zA-Z0-9_]+/gi, // Fine-grained PATs
  /gh[porus]_[a-zA-Z0-9]+/gi, // Standard GitHub tokens
  /Bearer\s+[a-zA-Z0-9_-]+/gi, // Bearer tokens
  /token[:\s]+[a-zA-Z0-9_-]+/gi, // Generic token patterns
] as const;

/**
 * Log an error message
 * Note: Error logs are shown in all environments, but sanitized
 * @param message - The error message to log
 * @param data - Optional data to log with the error
 */
function error(message: string, ...data: unknown[]): void {
  const sanitizedData = data.map(sanitize);
  if (sanitizedData.length > 0) {
    // eslint-disable-next-line no-console
    console.error(`[ERROR] ${message}`, ...sanitizedData);
  } else {
    // eslint-disable-next-line no-console
    console.error(`[ERROR] ${message}`);
  }
}

/**
 * Log a grouped console output (only in development)
 * @param label - The group label
 * @param collapsed - Whether the group should start collapsed
 */
function group(label: string, collapsed = false): void {
  if (!isDevelopment) return;

  if (collapsed) {
    // eslint-disable-next-line no-console
    console.groupCollapsed(`[DEBUG] ${label}`);
  } else {
    // eslint-disable-next-line no-console
    console.group(`[DEBUG] ${label}`);
  }
}

/**
 * End a grouped console output (only in development)
 */
function groupEnd(): void {
  if (!isDevelopment) return;
  // eslint-disable-next-line no-console
  console.groupEnd();
}

/**
 * Log a debug message (only in development)
 * @param message - The message to log
 * @param data - Optional data to log with the message
 */
function log(message: string, ...data: unknown[]): void {
  if (!isDevelopment) return;

  const sanitizedData = data.map(sanitize);
  if (sanitizedData.length > 0) {
    // eslint-disable-next-line no-console
    console.log(`[DEBUG] ${message}`, ...sanitizedData);
  } else {
    // eslint-disable-next-line no-console
    console.log(`[DEBUG] ${message}`);
  }
}

/**
 * Sanitize a value by redacting sensitive information
 * @param value - The value to sanitize (string, object, or other)
 * @returns Sanitized value safe for logging
 */
function sanitize(value: unknown): unknown {
  if (typeof value === "string") {
    let sanitized = value;
    for (const pattern of SENSITIVE_PATTERNS) {
      sanitized = sanitized.replace(pattern, "[REDACTED]");
    }
    return sanitized;
  }

  if (Array.isArray(value)) {
    return value.map(sanitize);
  }

  if (value instanceof Error) {
    return {
      message: sanitize(value.message) as string,
      name: value.name,
    };
  }

  if (value && typeof value === "object") {
    const sanitized: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(value)) {
      // Redact known sensitive keys entirely
      if (
        key.toLowerCase().includes("token") ||
        key.toLowerCase().includes("password") ||
        key.toLowerCase().includes("secret") ||
        key.toLowerCase().includes("key")
      ) {
        sanitized[key] = "[REDACTED]";
      } else {
        sanitized[key] = sanitize(val);
      }
    }
    return sanitized;
  }

  return value;
}

/**
 * Log a table (only in development)
 * @param data - The data to display as a table
 */
function table(data: unknown): void {
  if (!isDevelopment) return;
  try {
    // eslint-disable-next-line no-console
    console.table(sanitize(data));
  } catch {
    // Fallback for environments where console.table fails (e.g. jsdom)
    // eslint-disable-next-line no-console
    console.log(sanitize(data));
  }
}

/**
 * Log a warning message (only in development)
 * @param message - The warning message to log
 * @param data - Optional data to log with the warning
 */
function warn(message: string, ...data: unknown[]): void {
  if (!isDevelopment) return;

  const sanitizedData = data.map(sanitize);
  if (sanitizedData.length > 0) {
    // eslint-disable-next-line no-console
    console.warn(`[WARN] ${message}`, ...sanitizedData);
  } else {
    // eslint-disable-next-line no-console
    console.warn(`[WARN] ${message}`);
  }
}

/**
 * Debug utility object with all logging methods
 */
export const debug = {
  error,
  group,
  groupEnd,
  log,
  sanitize,
  table,
  warn,
} as const;
