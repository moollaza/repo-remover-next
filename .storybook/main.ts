import type { StorybookConfig } from "@storybook/nextjs";

const config: StorybookConfig = {
  stories: ["../src/**/*.mdx", "../src/**/*.stories.@(js|jsx|mjs|ts|tsx)"],

  addons: [
    "@storybook/addon-essentials",
    "@storybook/addon-interactions",
    "@chromatic-com/storybook",
  ],

  framework: {
    name: "@storybook/experimental-nextjs-vite",
    options: {
      builder: {
        viteConfigPath: "vite.config.ts",
      },
    },
  },

  // https://storybook.js.org/docs/get-started/frameworks/nextjs#react-server-components-rsc
  features: {
    experimentalRSC: true,
  },

  staticDirs: ["../public"],

  docs: {
    autodocs: false
  }
};
export default config;
