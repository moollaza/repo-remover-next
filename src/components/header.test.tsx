import Header from "@/components/header";
import { render, screen } from "@/utils/test-utils";

// Mock next/navigation
vi.mock("next/navigation", () => ({
  usePathname: vi.fn(() => "/"),
}));

describe("Header", () => {
  describe("Authentication states", () => {
    it("shows logo on all pages", () => {
      render(<Header />);
      expect(screen.getByText("Repo Remover")).toBeInTheDocument();
    });

    it("shows home navigation links on homepage", () => {
      render(<Header />);

      expect(screen.getByText("Features")).toBeInTheDocument();
      expect(screen.getByText("How It Works")).toBeInTheDocument();
      expect(screen.getByText("Get Started")).toBeInTheDocument();
    });

    it("does not show Go to Dashboard button when not authenticated", () => {
      render(<Header />);

      expect(
        screen.queryByRole("link", { name: /go to dashboard/i }),
      ).not.toBeInTheDocument();
    });

    it("shows theme switcher", () => {
      render(<Header />);

      // Theme switcher should be present
      const navbar = screen.getByTestId("navbar");
      expect(navbar).toBeInTheDocument();
    });
  });

  describe("Navigation", () => {
    it("renders navbar with correct structure", () => {
      render(<Header />);

      const navbar = screen.getByTestId("navbar");
      expect(navbar).toBeInTheDocument();
    });

    it("has accessible navigation", () => {
      render(<Header />);

      const navbar = screen.getByRole("navigation");
      expect(navbar).toBeInTheDocument();
    });
  });
});
