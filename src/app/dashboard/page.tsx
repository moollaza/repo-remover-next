"use client";

import { useRouter } from "next/navigation";
import { useLayoutEffect } from "react";

import useGitHubData from "@/hooks/use-github-data";
import { useGitHub } from "@/providers/github-provider";
import Dashboard from "@components/dashboard";

export default function DashboardPage() {
  const { pat, login } = useGitHub();
  const { isLoading } = useGitHubData();
  const router = useRouter();

  useLayoutEffect(() => {
    if (!pat || !login) {
      router.push("/");
    }
  }, [pat, login, router]);

  if (isLoading) {
    return null; // or a loading spinner
  }

  return (
    <main className="container mx-auto max-w-7xl pt-16 px-6 flex-grow">
      <Dashboard />
    </main>
  );
}
