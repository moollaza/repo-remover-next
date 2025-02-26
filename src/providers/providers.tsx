"use client";

import { HeroUIProvider } from "@heroui/system";
import {
  ThemeProvider as NextThemesProvider,
  ThemeProviderProps,
} from "next-themes";
import { useRouter } from "next/navigation";
import { type ReactNode } from "react";

import GitHubProvider from "@/providers/github-provider";

export interface ProvidersProps {
  children: ReactNode;
  themeProps?: ThemeProviderProps;
}

export function Providers({ children, themeProps }: ProvidersProps) {
  const router = useRouter();

  return (
    <HeroUIProvider navigate={(url) => router.push(url)}>
      <NextThemesProvider {...themeProps}>
        <GitHubProvider>{children}</GitHubProvider>
      </NextThemesProvider>
    </HeroUIProvider>
  );
}
