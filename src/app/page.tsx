"use client";

import { useGitHub } from "@/providers/github-provider";
import Dashboard from "@components/dashboard";
import Homepage from "@components/homepage";

export default function App() {
  const { pat, login, isLoading } = useGitHub();

  if (pat && login && !isLoading) {
    return <Dashboard />;
  } else {
    return <Homepage />;
  }
}
