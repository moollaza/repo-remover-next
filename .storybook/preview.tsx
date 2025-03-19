import React from "react";
import type { Preview } from "@storybook/react";
import { initialize, mswLoader } from "msw-storybook-addon";

import { GitHubDataDecorator } from "./decorators";

import { handlers } from "../src/mocks/handlers";

import "../src/globals.css";

initialize({
  // onUnhandledRequest: "bypass"
});

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    nextjs: {
      appDirectory: true,
    },
    layout: "fullscreen",
    msw: {
      handlers: [handlers],
    },
  },
  loaders: [mswLoader],
  decorators: [
    GitHubDataDecorator,
    (Story) => (
      <div className="p-4">
        <Story />
      </div>
    ),
  ],
};

export default preview;
