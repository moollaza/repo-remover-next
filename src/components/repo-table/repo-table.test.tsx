import { type Repository } from "@octokit/graphql-schema";
import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, test, vi } from "vitest";

import { createMockRepo } from "@/mocks/static-fixtures";

import RepoTable from "./repo-table";

// Mock dependencies
vi.mock("@heroui/react", async () => {
  const actual = await vi.importActual("@heroui/react");
  return {
    ...(actual as Record<string, unknown>),
    useDisclosure: vi.fn().mockReturnValue({
      isOpen: true,
      onClose: vi.fn(),
      onOpen: vi.fn(),
    }),
  };
});

// Mock ConfirmationModal
vi.mock("./confirmation-modal", () => ({
  default: vi
    .fn()
    .mockImplementation(({ isOpen }) =>
      isOpen ? <div data-testid="repo-confirmation-modal"></div> : null,
    ),
}));

describe("RepoTable", () => {
  const mockLogin = "testuser";
  const mockRepos: Repository[] = [
    createMockRepo({
      description: "First test repo",
      id: "test-repo-1",
      isInOrganization: false,
      isPrivate: true,
      name: "test-repo-1",
      url: "https://github.com/testuser/test-repo-1",
    }),
    createMockRepo({
      description: "Second test repo",
      id: "test-repo-2",
      isInOrganization: true,
      isPrivate: false,
      name: "test-repo-2",
      url: "https://github.com/testuser/test-repo-2",
    }),
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("renders table with repos", () => {
    render(<RepoTable login={mockLogin} repos={mockRepos} />);

    expect(screen.getByTestId("repo-table")).toBeInTheDocument();
    expect(screen.getByText("test-repo-1")).toBeInTheDocument();
    expect(screen.getByText("test-repo-2")).toBeInTheDocument();
  });

  test("displays empty state when no repos are available", () => {
    render(<RepoTable login={mockLogin} repos={[]} />);

    expect(screen.getByTestId("repo-table")).toBeInTheDocument();
    expect(screen.queryByText("test-repo-1")).not.toBeInTheDocument();
    expect(screen.queryByText("test-repo-2")).not.toBeInTheDocument();

    // Check for empty state message
    expect(screen.queryByText("No repos to display.")).toBeInTheDocument();
  });

  test("disables archived repos when archive action is selected", () => {
    const mockReposWithArchived: Repository[] = [
      createMockRepo({
        description: "Active repo",
        id: "active-repo",
        isArchived: false,
        name: "active-repo",
      }),
      createMockRepo({
        description: "Archived repo",
        id: "archived-repo",
        isArchived: true,
        name: "archived-repo",
      }),
    ];

    render(<RepoTable login={mockLogin} repos={mockReposWithArchived} />);

    // Find archived repo and verify its row has disabled styling
    expect(screen.getByText("active-repo")).toBeInTheDocument();
    expect(screen.getByText("archived-repo")).toBeInTheDocument();

    // The archived repo should be disabled when archive action is selected (which is the default)
    // Check for disabled styling on the archived repo row
    const archivedRepoRow = screen.getByText("archived-repo").closest('[data-testid="repo-row"]');
    expect(archivedRepoRow).toHaveClass("pointer-events-none");
    expect(archivedRepoRow).toHaveClass("opacity-50");

    // Active repo should not have these classes
    const activeRepoRow = screen.getByText("active-repo").closest('[data-testid="repo-row"]');
    expect(activeRepoRow).not.toHaveClass("opacity-50");
    expect(activeRepoRow).not.toHaveClass("pointer-events-none");
  });
});
