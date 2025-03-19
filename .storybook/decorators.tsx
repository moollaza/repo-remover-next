import { type Decorator } from "@storybook/react";

import { GitHubDataProvider } from "@providers/github-data-provider";
import Layout from "../src/app/layout";

export const PageDecorator: Decorator = (Story) => {
  return (
    <Layout>
      <Story />
    </Layout>
  );
};

export const GitHubDataDecorator: Decorator = (Story) => {
  return (
    <GitHubDataProvider>
      <Story />
    </GitHubDataProvider>
  );
};
