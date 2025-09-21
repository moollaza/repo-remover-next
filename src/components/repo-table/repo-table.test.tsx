import { Repository } from "@octokit/graphql-schema";
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
      isInOrganization: false,
      isPrivate: true,
      name: "test-repo-1",
    }),
    createMockRepo({
      description: "Second test repo",
      isInOrganization: true,
      isPrivate: false,
      name: "test-repo-2",
    }),
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("renders table with repos", () => {
    render(<RepoTable isLoading={false} login={mockLogin} repos={mockRepos} />);

    expect(screen.getByTestId("repo-table")).toBeInTheDocument();
    expect(screen.getByText("test-repo-1")).toBeInTheDocument();
    expect(screen.getByText("test-repo-2")).toBeInTheDocument();
  });

  test("displays empty state when no repos are available", () => {
    render(<RepoTable isLoading={false} login={mockLogin} repos={[]} />);

    expect(screen.getByTestId("repo-table")).toBeInTheDocument();
    expect(screen.queryByText("test-repo-1")).not.toBeInTheDocument();
    expect(screen.queryByText("test-repo-2")).not.toBeInTheDocument();

    // Check for empty state message
    expect(screen.queryByText("No repos to display.")).toBeInTheDocument();
  });

  test("displays loading state", () => {
    render(<RepoTable isLoading={true} login={mockLogin} repos={null} />);

    expect(screen.getByLabelText("Loading...")).toBeInTheDocument();
  });
});
