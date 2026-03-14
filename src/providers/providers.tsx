import { HeroUIProvider } from "@heroui/system";
import {
  ThemeProvider as NextThemesProvider,
  type ThemeProviderProps,
} from "next-themes";
import { type ReactNode } from "react";
import { useNavigate } from "react-router-dom";

import { GitHubDataProvider } from "@/providers/github-data-provider";

export interface ProvidersProps {
  children: ReactNode;
  themeProps?: ThemeProviderProps;
}

export function Providers({ children, themeProps }: ProvidersProps) {
  const navigate = useNavigate();

  return (
    <HeroUIProvider navigate={(url) => void navigate(url)}>
      <NextThemesProvider {...themeProps}>
        <GitHubDataProvider>{children}</GitHubDataProvider>
      </NextThemesProvider>
    </HeroUIProvider>
  );
}
