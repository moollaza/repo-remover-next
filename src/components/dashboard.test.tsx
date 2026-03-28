import { render, screen } from "@/utils/test-utils";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";

import { MOCK_REPOS, MOCK_USER } from "@/mocks/static-fixtures";

import Dashboard, { type DashboardProps } from "./dashboard";

const defaultProps: DashboardProps = {
  isError: false,
  isLoading: false,
  isRefreshing: false,
  login: MOCK_USER.login,
  repos: MOCK_REPOS,
};

describe("Dashboard", () => {
  it("renders heading", () => {
    render(<Dashboard {...defaultProps} />);

    expect(
      screen.getByText(/select repositories to archive or delete/i),
    ).toBeInTheDocument();
  });

  it("shows error alert when isError is true", () => {
    render(<Dashboard {...defaultProps} isError={true} />);

    expect(screen.getByText(/error loading repositories/i)).toBeInTheDocument();
  });

  it("shows permission warning when provided", () => {
    const warning = "Some organizations are not accessible due to SSO";
    render(<Dashboard {...defaultProps} permissionWarning={warning} />);

    expect(
      screen.getByText(/some repositories may be missing/i),
    ).toBeInTheDocument();
    expect(screen.getByText(warning)).toBeInTheDocument();
  });

  it("renders repo table with correct data", () => {
    render(<Dashboard {...defaultProps} />);

    // Verify table is rendered (header exists)
    expect(screen.getByTestId("repo-table-header")).toBeInTheDocument();
  });

  it("calls onRefresh when refresh button clicked", async () => {
    const user = userEvent.setup();
    const onRefresh = vi.fn();

    render(<Dashboard {...defaultProps} onRefresh={onRefresh} />);

    const refreshButton = screen.getByRole("button", {
      name: /refresh repository data/i,
    });
    await user.click(refreshButton);

    expect(onRefresh).toHaveBeenCalledTimes(1);
  });

  it("hides refresh button when loading", () => {
    render(
      <Dashboard {...defaultProps} isLoading={true} onRefresh={vi.fn()} />,
    );

    expect(
      screen.queryByRole("button", { name: /refresh repository data/i }),
    ).not.toBeInTheDocument();
  });

  it("does not render refresh button when onRefresh not provided", () => {
    render(<Dashboard {...defaultProps} />);

    expect(
      screen.queryByRole("button", { name: /refresh repository data/i }),
    ).not.toBeInTheDocument();
  });

  it("handles null repos gracefully", () => {
    render(<Dashboard {...defaultProps} repos={null} />);

    expect(
      screen.getByText(/select repositories to archive or delete/i),
    ).toBeInTheDocument();
  });

  it("handles empty repos array", () => {
    render(<Dashboard {...defaultProps} repos={[]} />);

    expect(
      screen.getByText(/select repositories to archive or delete/i),
    ).toBeInTheDocument();
  });

  it("shows loading state", () => {
    render(<Dashboard {...defaultProps} isLoading={true} repos={null} />);

    expect(
      screen.getByText(/select repositories to archive or delete/i),
    ).toBeInTheDocument();
    // RepoTable handles loading indicator internally
  });

  it("shows both error and permission warning if present", () => {
    const warning = "Limited org access";

    render(
      <Dashboard
        {...defaultProps}
        isError={true}
        permissionWarning={warning}
      />,
    );

    expect(screen.getByText(/error loading repositories/i)).toBeInTheDocument();
    expect(
      screen.getByText(/some repositories may be missing/i),
    ).toBeInTheDocument();
    expect(screen.getByText(warning)).toBeInTheDocument();
  });
});
