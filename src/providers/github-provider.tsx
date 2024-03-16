"use client";

import { useState } from "react";

import GitHubContext from "@contexts/github-context";

export default function GitHubProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [pat, setPat] = useState<string | null>(null);
  const [login, setLogin] = useState<string | null>(null);

  return (
    <GitHubContext.Provider value={{ pat, setPat, login, setLogin }}>
      {children}
    </GitHubContext.Provider>
  );
}
