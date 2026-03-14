import { type Decorator } from "@storybook/react";
import { BrowserRouter } from "react-router-dom";

import { GitHubDataProvider } from "@/providers/github-data-provider";
import { Providers } from "@/providers/providers";

export const PageDecorator: Decorator = (Story) => {
  return (
    <BrowserRouter>
      <Providers themeProps={{ attribute: "class", defaultTheme: "light" }}>
        <div className="min-h-full bg-background text-foreground font-sans antialiased">
          <main className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <Story />
          </main>
        </div>
      </Providers>
    </BrowserRouter>
  );
};

export const GitHubDataDecorator: Decorator = (Story) => {
  return (
    <BrowserRouter>
      <GitHubDataProvider>
        <Story />
      </GitHubDataProvider>
    </BrowserRouter>
  );
};

export const ClearLocalStorageDecorator: Decorator = (Story) => {
  if (typeof window !== "undefined") {
    // secureStorage uses 'secure_' prefix
    localStorage.removeItem("secure_pat");
    localStorage.removeItem("secure_login");
  }
  return <Story />;
};

export const AuthenticatedUserDecorator: Decorator = (Story) => {
  if (typeof window !== "undefined") {
    // secureStorage uses 'secure_' prefix and stores plain text in test/dev mode
    localStorage.setItem("secure_pat", "ghp_abcdefghijklmnopqrstuvwxyz1234567890");
    localStorage.setItem("secure_login", "testuser");
  }
  return <Story />;
};
