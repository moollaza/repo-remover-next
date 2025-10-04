import { type Decorator } from "@storybook/react";

import { GitHubDataProvider } from "@/providers/github-data-provider";
import LayoutContent, { bodyClasses } from "../src/app/layout-content";

export const PageDecorator: Decorator = (Story) => {
  return (
    <div className={bodyClasses}>
      <LayoutContent>
        <GitHubDataProvider>
          <Story />
        </GitHubDataProvider>
      </LayoutContent>
    </div>
  );
};

export const GitHubDataDecorator: Decorator = (Story) => {
  return (
    <GitHubDataProvider>
      <Story />
    </GitHubDataProvider>
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
