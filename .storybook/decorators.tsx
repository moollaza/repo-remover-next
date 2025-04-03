import { type Decorator } from "@storybook/react";

import { GitHubDataProvider } from "@providers/github-data-provider";
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
    localStorage.removeItem("pat");
    localStorage.removeItem("login");
  }
  return <Story />;
};

export const AuthenticatedUserDecorator: Decorator = (Story) => {
  if (typeof window !== "undefined") {
    localStorage.setItem("pat", "ghp_validtoken123456789012345678901234567890");
    localStorage.setItem("login", "testuser");
  }
  return <Story />;
};
