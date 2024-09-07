"use client";

import { NextUIProvider } from "@nextui-org/react";
import GitHubProvider from "@providers/github-provider";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <NextUIProvider>
      <GitHubProvider>{children}</GitHubProvider>
    </NextUIProvider>
  );
}
