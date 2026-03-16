import { render, screen } from "@/utils/test-utils";

import Footer from "./footer";

describe("Footer", () => {
  it("renders the footer element with data-testid", () => {
    render(<Footer />);

    expect(screen.getByTestId("footer")).toBeInTheDocument();
  });

  it("contains the creator attribution", () => {
    render(<Footer />);

    expect(screen.getByText(/zaahir moolla/i)).toBeInTheDocument();
  });

  it("contains copyright text", () => {
    render(<Footer />);

    expect(screen.getByText(/© 2019-2026/i)).toBeInTheDocument();
  });

  it("contains a link to the GitHub repo", () => {
    render(<Footer />);

    const githubLink = screen.getByRole("link", { name: /github/i });
    expect(githubLink).toBeInTheDocument();
    expect(githubLink).toHaveAttribute(
      "href",
      "https://github.com/moollaza/repo-remover",
    );
  });

  it("external links have rel='noopener noreferrer' and target='_blank'", () => {
    render(<Footer />);

    const links = screen.getAllByRole("link");
    for (const link of links) {
      const href = link.getAttribute("href");
      // Only check external http links (skip anchor links and mailto)
      if (href && href.startsWith("http")) {
        expect(link).toHaveAttribute("target", "_blank");
        expect(link).toHaveAttribute(
          "rel",
          expect.stringContaining("noopener"),
        );
        expect(link).toHaveAttribute(
          "rel",
          expect.stringContaining("noreferrer"),
        );
      }
    }
  });

  it("contains Product section heading", () => {
    render(<Footer />);

    expect(
      screen.getByRole("heading", { name: /product/i }),
    ).toBeInTheDocument();
  });

  it("contains Resources section heading", () => {
    render(<Footer />);

    expect(
      screen.getByRole("heading", { name: /resources/i }),
    ).toBeInTheDocument();
  });

  it("contains Bluesky link", () => {
    render(<Footer />);

    const blueskyLinks = screen.getAllByRole("link").filter((link) =>
      link.getAttribute("href")?.includes("bsky.app"),
    );
    expect(blueskyLinks.length).toBeGreaterThan(0);
  });
});
