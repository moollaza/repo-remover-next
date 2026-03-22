import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, test, vi } from "vitest";

import {
  restUserNetworkErrorHandler,
  restUserServerErrorHandler,
  restUserUnauthorizedHandler,
} from "@/mocks/handlers";
import { server } from "@/mocks/server";
import { render, screen, waitFor } from "@/utils/test-utils";

import GitHubTokenForm from "./github-token-form";

describe("GitHubTokenForm", () => {
  const mockOnValueChange = vi.fn();
  const mockOnSubmit = vi.fn();
  const user = userEvent.setup();

  // Helper function to render the form and get input and submit button
  const setupForm = (props = {}) => {
    const defaultProps = {
      onSubmit: mockOnSubmit,
      onValueChange: mockOnValueChange,
      value: "",
    };

    render(<GitHubTokenForm {...defaultProps} {...props} />);
    const input = screen.getByLabelText(/Personal Access Token/i);
    const submitButton = screen.getByRole("button", { name: /submit/i });
    return { input, submitButton };
  };

  beforeEach(() => {
    // Reset mocks before each test
    vi.clearAllMocks();
  });

  test("renders input field and submit button", () => {
    const { input, submitButton } = setupForm();

    expect(input).toBeInTheDocument();
    expect(submitButton).toBeInTheDocument();
  });

  test("calls onValueChange when input changes", async () => {
    const { input } = setupForm();

    await user.type(input, "t");
    expect(mockOnValueChange).toHaveBeenCalledWith("t");
  });

  test("calls onValueChange with empty string when cleared", async () => {
    setupForm({ value: "test-token" });

    // Find and click the clear button
    const clearButton = screen.getByRole("button", { name: /clear/i });
    await user.click(clearButton);

    expect(mockOnValueChange).toHaveBeenCalledWith("");
  });

  test("shows error for invalid token format", () => {
    setupForm({ value: "invalid-token" });

    expect(
      screen.getByText(/Invalid GitHub token format/i),
    ).toBeInTheDocument();
  });

  test("calls onSubmit when form is submitted with valid token", async () => {
    const { submitButton } = setupForm({
      value: "ghp_abcdefghijklmnopqrstuvwxyz1234567890",
    });

    // Wait for API validation to complete and button to become enabled
    await waitFor(() => expect(submitButton).not.toBeDisabled(), {
      timeout: 2000,
    });

    // Submit the form
    await user.click(submitButton);

    // onSubmit should be called with the token
    expect(mockOnSubmit).toHaveBeenCalledWith(
      "ghp_abcdefghijklmnopqrstuvwxyz1234567890",
    );
  });

  test("does not render a non-functional remember-me checkbox", () => {
    setupForm();

    expect(
      screen.queryByTestId("github-token-remember"),
    ).not.toBeInTheDocument();
    expect(screen.queryByRole("checkbox")).not.toBeInTheDocument();
  });

  test("resets validation state when input is cleared after successful validation", async () => {
    const { rerender } = render(
      <GitHubTokenForm
        onSubmit={mockOnSubmit}
        onValueChange={mockOnValueChange}
        value="ghp_abcdefghijklmnopqrstuvwxyz1234567890"
      />,
    );

    const submitButton = screen.getByRole("button", { name: /submit/i });

    // Wait for validation to succeed
    await waitFor(() => expect(submitButton).not.toBeDisabled(), {
      timeout: 2000,
    });
    expect(screen.getByText(/Token is valid\. Welcome/i)).toBeInTheDocument();

    // Simulate clearing — parent re-renders with empty value
    rerender(
      <GitHubTokenForm
        onSubmit={mockOnSubmit}
        onValueChange={mockOnValueChange}
        value=""
      />,
    );

    // Validation state should be reset (after debounce)
    await waitFor(() => expect(submitButton).toBeDisabled());
    expect(
      screen.queryByText(/Token is valid\. Welcome/i),
    ).not.toBeInTheDocument();
  });

  test("doesn't call onSubmit when token is invalid", async () => {
    const { submitButton } = setupForm({
      value: "invalid-token",
    });

    // Button should be disabled
    expect(submitButton).toBeDisabled();

    // Try to submit the form
    await user.click(submitButton);

    // onSubmit should not be called
    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  test("shows 'Invalid or expired token' for 401 errors", async () => {
    server.use(restUserUnauthorizedHandler());

    setupForm({
      value: "ghp_abcdefghijklmnopqrstuvwxyz1234567890",
    });

    await waitFor(
      () => {
        expect(
          screen.getByText(/Invalid or expired token/i),
        ).toBeInTheDocument();
      },
      { timeout: 2000 },
    );
  });

  test("shows server error message for 500 errors instead of 'Invalid or expired token'", async () => {
    server.use(restUserServerErrorHandler());

    setupForm({
      value: "ghp_abcdefghijklmnopqrstuvwxyz1234567890",
    });

    await waitFor(
      () => {
        expect(
          screen.getByText(/GitHub API is unavailable/i),
        ).toBeInTheDocument();
      },
      { timeout: 2000 },
    );

    // Should NOT show "Invalid or expired token"
    expect(
      screen.queryByText(/Invalid or expired token/i),
    ).not.toBeInTheDocument();
  });

  test("shows network error message for network failures instead of 'Invalid or expired token'", async () => {
    server.use(restUserNetworkErrorHandler());

    setupForm({
      value: "ghp_abcdefghijklmnopqrstuvwxyz1234567890",
    });

    await waitFor(
      () => {
        expect(
          screen.getByText(/GitHub API is unavailable/i),
        ).toBeInTheDocument();
      },
      { timeout: 2000 },
    );

    // Should NOT show "Invalid or expired token"
    expect(
      screen.queryByText(/Invalid or expired token/i),
    ).not.toBeInTheDocument();
  });

  test("submit button remains disabled after API error", async () => {
    server.use(restUserUnauthorizedHandler());

    const { submitButton } = setupForm({
      value: "ghp_abcdefghijklmnopqrstuvwxyz1234567890",
    });

    // Wait for the error to appear
    await waitFor(
      () => {
        expect(
          screen.getByText(/Invalid or expired token/i),
        ).toBeInTheDocument();
      },
      { timeout: 2000 },
    );

    // Submit button should still be disabled (isTokenValid is false)
    expect(submitButton).toBeDisabled();
  });

  test("clicking clear after successful validation resets to default hint state", async () => {
    const { rerender } = render(
      <GitHubTokenForm
        onSubmit={mockOnSubmit}
        onValueChange={mockOnValueChange}
        value="ghp_abcdefghijklmnopqrstuvwxyz1234567890"
      />,
    );

    const submitButton = screen.getByRole("button", { name: /submit/i });

    // Wait for validation to succeed — green state
    await waitFor(() => expect(submitButton).not.toBeDisabled(), {
      timeout: 2000,
    });
    expect(screen.getByText(/Token is valid\. Welcome/i)).toBeInTheDocument();

    // Click the clear button (fires handleChange(""))
    const clearButton = screen.getByRole("button", { name: /clear/i });
    await user.click(clearButton);

    // Parent responds with empty value
    rerender(
      <GitHubTokenForm
        onSubmit={mockOnSubmit}
        onValueChange={mockOnValueChange}
        value=""
      />,
    );

    // Success message gone
    await waitFor(() =>
      expect(
        screen.queryByText(/Token is valid\. Welcome/i),
      ).not.toBeInTheDocument(),
    );

    // Button disabled
    expect(submitButton).toBeDisabled();

    // Description reverted to the default hint text
    expect(
      screen.getByText(/Token should start with 'ghp_'/i),
    ).toBeInTheDocument();
  });

  test("pressing Enter submits the form when token is valid", async () => {
    const { input } = setupForm({
      value: "ghp_abcdefghijklmnopqrstuvwxyz1234567890",
    });

    const submitButton = screen.getByRole("button", { name: /submit/i });

    // Wait for API validation to complete
    await waitFor(() => expect(submitButton).not.toBeDisabled(), {
      timeout: 2000,
    });

    // Press Enter on the input
    await user.click(input);
    await user.keyboard("{Enter}");

    expect(mockOnSubmit).toHaveBeenCalledWith(
      "ghp_abcdefghijklmnopqrstuvwxyz1234567890",
    );
  });

  test("pressing Enter does NOT submit the form when token is invalid", async () => {
    const { input } = setupForm({
      value: "invalid-token",
    });

    // Button should be disabled (token format invalid, never validates)
    expect(screen.getByRole("button", { name: /submit/i })).toBeDisabled();

    // Press Enter on the input
    await user.click(input);
    await user.keyboard("{Enter}");

    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  test("error clears when user clears the input after an API error", async () => {
    server.use(restUserUnauthorizedHandler());

    const { rerender } = render(
      <GitHubTokenForm
        onSubmit={mockOnSubmit}
        onValueChange={mockOnValueChange}
        value="ghp_abcdefghijklmnopqrstuvwxyz1234567890"
      />,
    );

    // Wait for the 401 error to appear
    await waitFor(
      () => {
        expect(
          screen.getByText(/Invalid or expired token/i),
        ).toBeInTheDocument();
      },
      { timeout: 2000 },
    );

    // User clicks clear — handleChange("") sets error to null
    const clearButton = screen.getByRole("button", { name: /clear/i });
    await user.click(clearButton);

    // Parent responds by re-rendering with empty value (no re-validation triggered)
    rerender(
      <GitHubTokenForm
        onSubmit={mockOnSubmit}
        onValueChange={mockOnValueChange}
        value=""
      />,
    );

    // Error should be cleared
    await waitFor(() => {
      expect(
        screen.queryByText(/Invalid or expired token/i),
      ).not.toBeInTheDocument();
    });
  });
});
