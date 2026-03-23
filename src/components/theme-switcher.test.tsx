import { userEvent } from "@testing-library/user-event";
import { useTheme } from "next-themes";

import { ThemeSwitcher } from "@/components/theme-switcher";
import { render, screen } from "@/utils/test-utils";

vi.mock("next-themes", () => ({
  useTheme: vi.fn(),
}));

const mockUseTheme = vi.mocked(useTheme);

describe("ThemeSwitcher", () => {
  beforeEach(() => {
    mockUseTheme.mockReturnValue({
      forcedTheme: undefined,
      resolvedTheme: "light",
      setTheme: vi.fn(),
      systemTheme: "light",
      theme: "light",
      themes: ["light", "dark"],
    });
  });

  it("renders moon icon with correct aria-label in light mode", () => {
    render(<ThemeSwitcher />);

    expect(screen.getByLabelText("Switch to dark theme")).toBeInTheDocument();
  });

  it("renders sun icon with correct aria-label in dark mode", () => {
    mockUseTheme.mockReturnValue({
      forcedTheme: undefined,
      resolvedTheme: "dark",
      setTheme: vi.fn(),
      systemTheme: "light",
      theme: "dark",
      themes: ["light", "dark"],
    });

    render(<ThemeSwitcher />);

    expect(screen.getByLabelText("Switch to light theme")).toBeInTheDocument();
  });

  it("calls setTheme with 'dark' when in light mode and clicked", async () => {
    const mockSetTheme = vi.fn();
    mockUseTheme.mockReturnValue({
      forcedTheme: undefined,
      resolvedTheme: "light",
      setTheme: mockSetTheme,
      systemTheme: "light",
      theme: "light",
      themes: ["light", "dark"],
    });

    render(<ThemeSwitcher />);

    const button = screen.getByLabelText("Switch to dark theme");
    await userEvent.click(button);

    expect(mockSetTheme).toHaveBeenCalledWith("dark");
  });

  it("calls setTheme with 'light' when in dark mode and clicked", async () => {
    const mockSetTheme = vi.fn();
    mockUseTheme.mockReturnValue({
      forcedTheme: undefined,
      resolvedTheme: "dark",
      setTheme: mockSetTheme,
      systemTheme: "light",
      theme: "dark",
      themes: ["light", "dark"],
    });

    render(<ThemeSwitcher />);

    const button = screen.getByLabelText("Switch to light theme");
    await userEvent.click(button);

    expect(mockSetTheme).toHaveBeenCalledWith("light");
  });
});
