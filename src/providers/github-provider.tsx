"use client";

import { useState, useEffect } from "react";

import GitHubContext from "@contexts/github-context";

export default function GitHubProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [pat, setPat] = useState<string | null>(
    typeof localStorage !== "undefined" ? localStorage?.getItem("pat") : null,
  );
  const [login, setLogin] = useState<string | null>(
    typeof localStorage !== "undefined" ? localStorage?.getItem("login") : null,
  );

  useEffect(() => {
    if (typeof localStorage !== "undefined") {
      localStorage?.setItem("pat", pat || "");
      localStorage?.setItem("login", login || "");
    }
  }, [pat, login]);

  return (
    <GitHubContext.Provider value={{ pat, setPat, login, setLogin }}>
      {children}
    </GitHubContext.Provider>
  );
}
