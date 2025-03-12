import type { StorybookConfig } from "@storybook/nextjs";

const config: StorybookConfig = {
  stories: ["../src/**/*.mdx", "../src/**/*.stories.@(js|jsx|mjs|ts|tsx)"],
  addons: [
    "@storybook/addon-essentials",
    // "@storybook/addon-onboarding",
    "@chromatic-com/storybook",
  ],
  framework: "@storybook/experimental-nextjs-vite",
  // framework: "@storybook/nextjs",

  // https://storybook.js.org/docs/get-started/frameworks/nextjs#react-server-components-rsc
  features: {
    experimentalRSC: true,
  },

  staticDirs: ["../public"],
};
export default config;
