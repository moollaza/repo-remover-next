import { render, screen } from "@testing-library/react";

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

    expect(
      screen.getByText(/© 2019-2025 all rights reserved/i),
    ).toBeInTheDocument();
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
      // All links in this footer are external
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

  it("contains social media share links", () => {
    render(<Footer />);

    expect(screen.getByLabelText("Bluesky")).toBeInTheDocument();
    expect(screen.getByLabelText("Reddit")).toBeInTheDocument();
    expect(screen.getByLabelText("X")).toBeInTheDocument();
    expect(screen.getByLabelText("LinkedIn")).toBeInTheDocument();
  });

  it("contains Contribute section heading", () => {
    render(<Footer />);

    expect(
      screen.getByRole("heading", { name: /contribute/i }),
    ).toBeInTheDocument();
  });

  it("contains Share section heading", () => {
    render(<Footer />);

    expect(screen.getByRole("heading", { name: /share/i })).toBeInTheDocument();
  });
});
