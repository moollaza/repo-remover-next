import React, { useEffect } from "react";
import type { Preview } from "@storybook/react";
import "../src/globals.css";

// Import the MSW addon for Storybook
import { initialize, mswLoader } from "msw-storybook-addon";

// Initialize MSW
initialize();

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
      handlers: [],
    },
  },
  decorators: [
    (Story) => {
      // Mock localStorage for authentication in Storybook
      useEffect(() => {
        if (typeof window !== "undefined") {
          // Setup mock localStorage values for authentication
          localStorage.setItem(
            "pat",
            "ghp_validtoken123456789012345678901234567890",
          );
          localStorage.setItem("login", "testuser");
        }
        return () => {
          // Cleanup
          if (typeof window !== "undefined") {
            localStorage.removeItem("pat");
            localStorage.removeItem("login");
          }
        };
      }, []);

      return (
        <div className="p-4">
          <Story />
        </div>
      );
    },
  ],
  loaders: [mswLoader],
};

export default preview;
