"use client";

import { useRouter } from "next/navigation";
import { useLayoutEffect } from "react";

import { useGitHub } from "@/providers/github-provider";
import Dashboard from "@components/dashboard";

export default function DashboardPage() {
  const { login, pat } = useGitHub();

  const router = useRouter();

  // Redirect to the login page if the user is not logged in, and the data is not loading
  useLayoutEffect(() => {
    if (!pat) {
      router.push("/");
    }
  }, [pat, login, router]);

  return (
    <main className="container mx-auto max-w-6xl pt-16 px-6 flex-grow">
      <Dashboard />
    </main>
  );
}
