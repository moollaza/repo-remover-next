import RepoTableSkeleton from "@/components/repo-table/repo-table-skeleton";
import { render, screen } from "@/utils/test-utils";

describe("RepoTableSkeleton", () => {
  it("renders with default 10 rows", () => {
    render(<RepoTableSkeleton />);

    const rows = screen.getAllByRole("row");
    // 1 header + 10 body rows
    expect(rows).toHaveLength(11);
  });

  it("renders custom number of rows", () => {
    render(<RepoTableSkeleton rows={5} />);

    const rows = screen.getAllByRole("row");
    // 1 header + 5 body rows
    expect(rows).toHaveLength(6);
  });

  it("renders filter skeletons", () => {
    render(<RepoTableSkeleton />);

    const filtersSkeleton = screen.getByTestId("repo-filters-skeleton");
    expect(filtersSkeleton).toBeInTheDocument();
  });

  it("has accessible table label", () => {
    render(<RepoTableSkeleton />);

    expect(screen.getByLabelText("Loading repositories")).toBeInTheDocument();
  });

  it("renders NAME and LAST UPDATED columns", () => {
    render(<RepoTableSkeleton />);

    expect(screen.getByText("NAME")).toBeInTheDocument();
    expect(screen.getByText("LAST UPDATED")).toBeInTheDocument();
  });

  it("renders skeleton container with correct test id", () => {
    render(<RepoTableSkeleton />);

    expect(
      screen.getByTestId("repo-table-skeleton-container"),
    ).toBeInTheDocument();
  });

  it("renders many rows without error", () => {
    render(<RepoTableSkeleton rows={20} />);

    const rows = screen.getAllByRole("row");
    // 1 header + 20 body rows
    expect(rows).toHaveLength(21);
  });

  it("renders minimal rows without error", () => {
    render(<RepoTableSkeleton rows={3} />);

    const rows = screen.getAllByRole("row");
    // 1 header + 3 body rows
    expect(rows).toHaveLength(4);
  });
});
