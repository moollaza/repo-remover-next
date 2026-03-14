import type { Preview } from "@storybook/react";
import { initialize, mswLoader } from "msw-storybook-addon";

import { handlers } from "../src/mocks/handlers";

import { ClearLocalStorageDecorator } from "../.storybook/decorators";

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
    msw: {
      handlers: [handlers],
    },
  },
  loaders: [mswLoader],
  decorators: [ClearLocalStorageDecorator],
};

export default preview;
