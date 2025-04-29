"use client";

import { HeroUIProvider } from "@heroui/system";
import {
  ThemeProvider as NextThemesProvider,
  ThemeProviderProps,
} from "next-themes";
import { useRouter } from "next/navigation";
import { type ReactNode } from "react";

import { GitHubDataProvider } from "@/providers/github-data-provider";

export interface ProvidersProps {
  children: ReactNode;
  themeProps?: ThemeProviderProps;
}

export function Providers({ children, themeProps }: ProvidersProps) {
  const router = useRouter();

  return (
    <HeroUIProvider navigate={(url) => router.push(url)}>
      <NextThemesProvider {...themeProps}>
        <GitHubDataProvider>{children}</GitHubDataProvider>
      </NextThemesProvider>
    </HeroUIProvider>
  );
}
