"use client";

import { useRouter } from "next/navigation";
import { useLayoutEffect } from "react";

import { useGitHub } from "@/providers/github-provider";
import Dashboard from "@components/dashboard";

export default function DashboardPage() {
  const { pat, login, isLoading } = useGitHub();
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
    <>
      <header></header>
      <main className="flex-grow p-4">
        <Dashboard />
      </main>
    </>
  );
}
