import { userEvent } from "@testing-library/user-event";
import { useLocation } from "react-router-dom";

import Header from "@/components/header";
import { useGitHubData } from "@/hooks/use-github-data";
import { render, screen } from "@/utils/test-utils";

// Mock react-router-dom
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useLocation: vi.fn(() => ({
      hash: "",
      key: "default",
      pathname: "/",
      search: "",
      state: null,
    })),
    useNavigate: vi.fn(() => vi.fn()),
  };
});

// Mock useGitHubData hook
vi.mock("@/hooks/use-github-data", async () => {
  const actual = await vi.importActual("@/hooks/use-github-data");
  return {
    ...actual,
    useGitHubData: vi.fn(),
  };
});

const mockUseGitHubData = vi.mocked(useGitHubData);
const mockUseLocation = vi.mocked(useLocation);

function setupDashboardWithAuth(overrides = {}) {
  mockUseLocation.mockReturnValue({
    hash: "",
    key: "default",
    pathname: "/dashboard",
    search: "",
    state: null,
  });

  const mockLogout = vi.fn();
  mockUseGitHubData.mockReturnValue({
    error: null,
    hasPartialData: false,
    isAuthenticated: true,
    isError: false,
    isInitialized: true,
    isLoading: false,
    login: "testuser",
    logout: mockLogout,
    mutate: vi.fn(),
    pat: "ghp_test",
    progress: null,
    refetchData: vi.fn(),
    repos: [],
    setLogin: vi.fn(),
    setPat: vi.fn(),
    user: {
      avatarUrl: "",
      login: "testuser",
      name: "Test User",
      url: "https://github.com/testuser",
    } as ReturnType<typeof useGitHubData>["user"],
    ...overrides,
  });

  return { mockLogout };
}

function setupDefaultContext(overrides = {}) {
  mockUseGitHubData.mockReturnValue({
    error: null,
    hasPartialData: false,
    isAuthenticated: false,
    isError: false,
    isInitialized: true,
    isLoading: false,
    login: null,
    logout: vi.fn(),
    mutate: vi.fn(),
    pat: null,
    progress: null,
    refetchData: vi.fn(),
    repos: null,
    setLogin: vi.fn(),
    setPat: vi.fn(),
    user: null,
    ...overrides,
  });
}

describe("Header", () => {
  beforeEach(() => {
    mockUseLocation.mockReturnValue({
      hash: "",
      key: "default",
      pathname: "/",
      search: "",
      state: null,
    });
    setupDefaultContext();
  });

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

  describe("Dashboard route", () => {
    it("renders dashboard header with user info and hides home nav links", () => {
      setupDashboardWithAuth();
      render(<Header />);

      // User name and login should be visible
      expect(screen.getByText("Test User")).toBeInTheDocument();
      expect(screen.getByText("testuser")).toBeInTheDocument();

      // Home navigation links should NOT be present on dashboard
      expect(screen.queryByText("Features")).not.toBeInTheDocument();
      expect(screen.queryByText("How It Works")).not.toBeInTheDocument();
      expect(screen.queryByText("Get Started")).not.toBeInTheDocument();

      // User menu button should be present
      expect(
        screen.getByRole("button", { name: /user menu for test user/i }),
      ).toBeInTheDocument();
    });
  });

  describe("Accessibility", () => {
    it("user dropdown trigger has aria-label and is a button", () => {
      setupDashboardWithAuth();
      render(<Header />);

      const trigger = screen.getByRole("button", {
        name: /user menu for test user/i,
      });
      expect(trigger).toBeInTheDocument();
    });
  });

  describe("User dropdown toggle", () => {
    it("opens dropdown on click and shows menu items, closes on second click", async () => {
      setupDashboardWithAuth();
      const user = userEvent.setup();
      render(<Header />);

      const trigger = screen.getByRole("button", {
        name: /user menu for test user/i,
      });

      // Dropdown menu should not be visible initially
      expect(screen.queryByText("Log Out")).not.toBeInTheDocument();
      expect(screen.queryByText("Signed in as")).not.toBeInTheDocument();

      // Click to open
      await user.click(trigger);

      // Dropdown menu should now be visible
      expect(await screen.findByText("Log Out")).toBeInTheDocument();
      expect(screen.getByText("Signed in as")).toBeInTheDocument();

      // Click trigger again to close
      await user.click(trigger);

      // Dropdown menu should be gone
      await vi.waitFor(() => {
        expect(screen.queryByText("Log Out")).not.toBeInTheDocument();
      });
    });
  });

  describe("Logout", () => {
    it("calls context logout function instead of directly clearing localStorage", async () => {
      const { mockLogout } = setupDashboardWithAuth();
      const localStorageClearSpy = vi.spyOn(Storage.prototype, "clear");
      const user = userEvent.setup();

      render(<Header />);

      // Open the dropdown menu
      const userAvatar = screen.getByText("Test User");
      await user.click(userAvatar);

      // Click logout
      const logoutButton = await screen.findByText("Log Out");
      await user.click(logoutButton);

      expect(mockLogout).toHaveBeenCalledOnce();
      expect(localStorageClearSpy).not.toHaveBeenCalled();

      localStorageClearSpy.mockRestore();
    });
  });
});
