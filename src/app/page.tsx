"use client";

import { useContext } from "react";

import Dashboard from "@components/dashboard";
import Homepage from "@components/homepage";
import GitHubContext from "@contexts/github-context";

export default function App() {
  const { pat, login } = useContext(GitHubContext);

  if (pat && login) {
    return <Dashboard />;
  } else {
    return <Homepage />;
  }
}
