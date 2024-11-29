"use client";

import { type ReactNode } from "react";
import { NextUIProvider } from "@nextui-org/system";
import { useRouter } from "next/navigation";
import {
  ThemeProvider as NextThemesProvider,
  ThemeProviderProps,
} from "next-themes";

import GitHubProvider from "@/providers/github-provider";

export interface ProvidersProps {
  children: ReactNode;
  themeProps?: ThemeProviderProps;
}

export function Providers({ children, themeProps }: ProvidersProps) {
  const router = useRouter();

  return (
    <NextUIProvider navigate={(url) => router.push(url)}>
      <NextThemesProvider {...themeProps}>
        <GitHubProvider>{children}</GitHubProvider>
      </NextThemesProvider>
    </NextUIProvider>
  );
}
