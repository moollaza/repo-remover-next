"use client";

import { useGitHub } from "@/providers/github-provider";
import Dashboard from "@components/dashboard";
import Homepage from "@components/homepage";

export default function App() {
  const { pat, login } = useGitHub();

  if (pat && login) {
    return <Dashboard />;
  } else {
    return <Homepage />;
  }
}
