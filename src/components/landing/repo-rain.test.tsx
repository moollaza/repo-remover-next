import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, test, vi, beforeEach } from "vitest";

import { REPO_RAIN_POOL } from "./repo-rain-data";

// Mock framer-motion AnimatePresence to pass children through
vi.mock("framer-motion", async () => {
  const actual = await vi.importActual("framer-motion");
  return {
    ...actual,
    AnimatePresence: ({ children }: { children: React.ReactNode }) => (
      <>{children}</>
    ),
    motion: {
      div: ({
        children,
        exit,
        layout,
        ...props
      }: React.HTMLAttributes<HTMLDivElement> & {
        exit?: unknown;
        layout?: unknown;
      }) => <div {...props}>{children}</div>,
    },
  };
});

describe("RepoRain", () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });

  test("renders 10 floating cards", async () => {
    const { default: RepoRain } = await import("./repo-rain");
    render(<RepoRain />);

    const container = screen.getByTestId("repo-rain-container");
    expect(container).toBeInTheDocument();
    expect(container).toHaveAttribute("aria-hidden", "true");

    // Should have 10 cards initially
    const cards = container.querySelectorAll("[role='presentation']");
    expect(cards.length).toBe(10);
  });

  test("container has correct styling for background layer", async () => {
    const { default: RepoRain } = await import("./repo-rain");
    render(<RepoRain />);

    const container = screen.getByTestId("repo-rain-container");
    expect(container).toHaveAttribute("role", "presentation");
    expect(container).toHaveAttribute("aria-hidden", "true");
  });

  test("cards display repo name and metadata", async () => {
    const { default: RepoRain } = await import("./repo-rain");
    render(<RepoRain />);

    // At least some of the pool names should appear
    const poolNames = REPO_RAIN_POOL.map((e) => e.name);
    const allText = screen.getByTestId("repo-rain-container").textContent ?? "";
    const found = poolNames.some((name) => allText.includes(name));
    expect(found).toBe(true);
  });

  test("clicking a card removes it", async () => {
    vi.useRealTimers();
    const user = userEvent.setup();
    const { default: RepoRain } = await import("./repo-rain");
    render(<RepoRain />);

    const container = screen.getByTestId("repo-rain-container");
    const cards = container.querySelectorAll("[role='presentation']");
    const initialCount = cards.length;

    // Click the first card's inner presentation div
    await user.click(cards[0]);

    await waitFor(() => {
      const updated = container.querySelectorAll("[role='presentation']");
      expect(updated.length).toBeLessThan(initialCount);
    });
  });
});

describe("RepoRainData", () => {
  test("pool has 20 unique entries", () => {
    expect(REPO_RAIN_POOL).toHaveLength(20);
    const names = REPO_RAIN_POOL.map((e) => e.name);
    expect(new Set(names).size).toBe(20);
  });

  test("each entry has required fields", () => {
    for (const entry of REPO_RAIN_POOL) {
      expect(entry.name).toBeTruthy();
      expect(typeof entry.stars).toBe("number");
      expect(entry.lastCommit).toBeTruthy();
    }
  });
});
