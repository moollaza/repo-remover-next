import { type ErrorEvent } from "@sentry/react";
import { describe, expect, it } from "vitest";

import { sentryBeforeSend } from "./utils/sentry-before-send";

const FAKE_GHP = "ghp_aBcDeFgHiJkLmNoPqRsTuVwXyZ0123456789";
const FAKE_PAT =
  "github_pat_aBcDeFgHiJkLmNoPqRsTuVwXyZ0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ01234567890";

function createEvent(overrides: Omit<ErrorEvent, "type"> = {}): ErrorEvent {
  return { type: undefined, ...overrides };
}

describe("sentryBeforeSend", () => {
  it("returns the event (never drops it)", () => {
    const event = createEvent({ message: "hello" });
    expect(sentryBeforeSend(event)).toBe(event);
  });

  it("deletes user.ip_address", () => {
    const event = createEvent({
      user: { id: "u1", ip_address: "1.2.3.4" },
    });
    const result = sentryBeforeSend(event);
    expect(result.user?.ip_address).toBeUndefined();
    expect(result.user?.id).toBe("u1");
  });

  it("deletes sensitive request headers", () => {
    const event = createEvent({
      request: {
        headers: {
          Authorization: "Bearer secret",
          "Content-Type": "application/json",
          Cookie: "session=abc",
          "X-Auth-Token": "xyz",
        },
      },
    });
    const result = sentryBeforeSend(event);
    expect(result.request?.headers?.Authorization).toBeUndefined();
    expect(result.request?.headers?.Cookie).toBeUndefined();
    expect(result.request?.headers?.["X-Auth-Token"]).toBeUndefined();
    expect(result.request?.headers?.["Content-Type"]).toBe("application/json");
  });

  it("scrubs token from event.message", () => {
    const event = createEvent({
      message: `Error with token ${FAKE_GHP} in request`,
    });
    const result = sentryBeforeSend(event);
    expect(result.message).not.toContain(FAKE_GHP);
    expect(result.message).toContain("[REDACTED]");
  });

  it("scrubs token from exception values", () => {
    const event = createEvent({
      exception: {
        values: [
          {
            type: "Error",
            value: `Auth failed: ${FAKE_PAT}`,
          },
        ],
      },
    });
    const result = sentryBeforeSend(event);
    expect(result.exception?.values?.[0]?.value).not.toContain(FAKE_PAT);
    expect(result.exception?.values?.[0]?.value).toContain("[REDACTED]");
  });

  it("scrubs tokens from stacktrace frame vars", () => {
    const event = createEvent({
      exception: {
        values: [
          {
            stacktrace: {
              frames: [
                {
                  filename: "app.js",
                  vars: {
                    count: 42,
                    safe: "no-token-here",
                    token: FAKE_GHP,
                  },
                },
              ],
            },
            type: "Error",
            value: "crash",
          },
        ],
      },
    });
    const result = sentryBeforeSend(event);
    const vars = result.exception?.values?.[0]?.stacktrace?.frames?.[0]?.vars;
    expect(vars?.token).not.toContain(FAKE_GHP);
    expect(vars?.token).toContain("[REDACTED]");
    expect(vars?.count).toBe(42);
    expect(vars?.safe).toBe("no-token-here");
  });

  it("scrubs token from breadcrumb messages", () => {
    const event = createEvent({
      breadcrumbs: [
        { category: "http", message: `Fetching with ${FAKE_GHP}` },
        { category: "ui", message: "Safe breadcrumb" },
      ],
    });
    const result = sentryBeforeSend(event);
    expect(result.breadcrumbs?.[0]?.message).not.toContain(FAKE_GHP);
    expect(result.breadcrumbs?.[0]?.message).toContain("[REDACTED]");
    expect(result.breadcrumbs?.[1]?.message).toBe("Safe breadcrumb");
  });

  it("scrubs tokens from breadcrumb data values", () => {
    const event = createEvent({
      breadcrumbs: [
        {
          category: "http",
          data: {
            auth: `Bearer ${FAKE_GHP}`,
            status: 200,
            url: "https://api.github.com/user",
          },
        },
      ],
    });
    const result = sentryBeforeSend(event);
    const data = result.breadcrumbs?.[0]?.data;
    expect(data?.auth).not.toContain(FAKE_GHP);
    expect(data?.auth).toContain("[REDACTED]");
    expect(data?.url).toBe("https://api.github.com/user");
    expect(data?.status).toBe(200);
  });

  it("handles event with no optional fields", () => {
    const event = createEvent();
    const result = sentryBeforeSend(event);
    expect(result).toEqual({ type: undefined });
  });

  it("handles event with empty exception values array", () => {
    const event = createEvent({ exception: { values: [] } });
    const result = sentryBeforeSend(event);
    expect(result.exception?.values).toEqual([]);
  });

  it("handles event with empty breadcrumbs array", () => {
    const event = createEvent({ breadcrumbs: [] });
    const result = sentryBeforeSend(event);
    expect(result.breadcrumbs).toEqual([]);
  });
});
