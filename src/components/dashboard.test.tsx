import userEvent from "@testing-library/user-event";
import { vi } from "vitest";

import { MOCK_REPOS, MOCK_USER } from "@/mocks/static-fixtures";
import { render, screen } from "@/utils/test-utils";

import Dashboard, { type DashboardProps } from "./dashboard";

const defaultProps: DashboardProps = {
  isError: false,
  isLoading: false,
  login: MOCK_USER.login,
  repos: MOCK_REPOS,
};

describe("Dashboard", () => {
  it("renders heading", () => {
    render(<Dashboard {...defaultProps} />);

    expect(screen.getByText(/select repos to modify/i)).toBeInTheDocument();
  });

  it("shows error alert when isError is true", () => {
    render(<Dashboard {...defaultProps} isError={true} />);

    expect(screen.getByText(/error loading repositories/i)).toBeInTheDocument();
  });

  it("shows permission warning when provided", () => {
    const warning = "Some organizations are not accessible due to SSO";
    render(<Dashboard {...defaultProps} permissionWarning={warning} />);

    expect(screen.getByText(/limited access/i)).toBeInTheDocument();
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

    expect(screen.getByText(/select repos to modify/i)).toBeInTheDocument();
  });

  it("handles empty repos array", () => {
    render(<Dashboard {...defaultProps} repos={[]} />);

    expect(screen.getByText(/select repos to modify/i)).toBeInTheDocument();
  });

  it("shows loading state", () => {
    render(<Dashboard {...defaultProps} isLoading={true} repos={null} />);

    expect(screen.getByText(/select repos to modify/i)).toBeInTheDocument();
    // RepoTable handles loading indicator internally
  });

  it("renders RepoLoadingProgress when isLoading and progress are set", () => {
    render(
      <Dashboard
        {...defaultProps}
        isLoading={true}
        progress={{
          currentOrg: "my-org",
          orgsLoaded: 1,
          orgsTotal: 3,
          stage: "orgs",
        }}
        repos={null}
      />,
    );

    expect(
      screen.getByText(/loading organization repositories/i),
    ).toBeInTheDocument();
    expect(screen.getByText(/currently loading: my-org/i)).toBeInTheDocument();
    expect(screen.getByRole("progressbar")).toBeInTheDocument();
  });

  it("does not render RepoLoadingProgress when isLoading is false even with stale progress", () => {
    render(
      <Dashboard
        {...defaultProps}
        isLoading={false}
        progress={{
          currentOrg: "my-org",
          orgsLoaded: 1,
          orgsTotal: 3,
          stage: "orgs",
        }}
      />,
    );

    expect(
      screen.queryByText(/loading organization repositories/i),
    ).not.toBeInTheDocument();
    expect(screen.queryByRole("progressbar")).not.toBeInTheDocument();
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
    expect(screen.getByText(/limited access/i)).toBeInTheDocument();
    expect(screen.getByText(warning)).toBeInTheDocument();
  });

  it("renders multi-item permissionWarning with newline separators as a single block", () => {
    const multiWarning =
      "Org A: missing read:org scope\n\nOrg B: SAML SSO required";

    render(<Dashboard {...defaultProps} permissionWarning={multiWarning} />);

    expect(screen.getByText(/limited access/i)).toBeInTheDocument();
    // Both warning segments appear in the rendered output
    expect(
      screen.getByText(/Org A: missing read:org scope/),
    ).toBeInTheDocument();
    expect(screen.getByText(/Org B: SAML SSO required/)).toBeInTheDocument();
    expect(
      screen.getByText(/some organization repositories may not be visible/i),
    ).toBeInTheDocument();
  });
});
