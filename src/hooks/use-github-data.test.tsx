import { renderHook } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";

import { GitHubDataProvider } from "@/providers/github-data-provider";

import { useGitHubData } from "./use-github-data";

function AllProviders({ children }: { children: React.ReactNode }) {
  return (
    <BrowserRouter>
      <GitHubDataProvider>{children}</GitHubDataProvider>
    </BrowserRouter>
  );
}

describe("useGitHubData", () => {
  it("throws when used outside GitHubDataProvider", () => {
    expect(() => {
      renderHook(() => useGitHubData());
    }).toThrow("useGitHubData must be used within GitHubDataProvider");
  });

  it("returns context value when used within GitHubDataProvider", () => {
    const { result } = renderHook(() => useGitHubData(), {
      wrapper: AllProviders,
    });

    expect(result.current).toBeDefined();
    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.repos).toBeNull();
    expect(result.current.pat).toBeNull();
  });
});
