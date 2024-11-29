"use client";

import { Button, Link } from "@nextui-org/react";

import Footer from "@components/footer";
import GitHubTokenForm from "@components/github-token-form";

export default function HomePage() {
  const scrollToForm = () => {
    const form = document.getElementById("github-token-form");
    form?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <>
      <header className="pt-16 px-6 flex-grow pb-10 bg-primary-50">
        <section className="container mx-auto max-w-7xl">
          <h1 className="text-7xl font-bold my-5">Repo Remover</h1>
          <p className="text-3xl">
            The <b>fastest</b> way to{" "}
            <span className="underline underline-offset-4 decoration-warning">
              archive
            </span>{" "}
            or{" "}
            <span className="underline underline-offset-4 decoration-danger">
              delete
            </span>{" "}
            multiple GitHub repos.
          </p>
          <div className="flex gap-5 pt-10">
            <Button
              color="primary"
              variant="solid"
              size="lg"
              onPress={scrollToForm}
            >
              Get Started
            </Button>
            <Button
              color="primary"
              variant="light"
              size="lg"
              onPress={scrollToForm}
            >
              Learn More
            </Button>
          </div>
        </section>
      </header>

      <main className="container mx-auto max-w-7xl pt-16 px-6 flex-grow">
        <section className="mb-16">
          <h2 className="text-4xl font-bold mb-8">Features</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="flex flex-col items-center text-center p-6 bg-content1 rounded-lg shadow-md">
              <i className="fas fa-check-circle text-4xl text-primary mb-4"></i>
              <h3 className="text-xl font-semibold mb-2">Bulk Actions</h3>
              <p>Archive or delete multiple repositories in one go</p>
            </div>
            <div className="flex flex-col items-center text-center p-6 bg-content1 rounded-lg shadow-md">
              <i className="fas fa-lock text-4xl text-primary mb-4"></i>
              <h3 className="text-xl font-semibold mb-2">Client-Side Only</h3>
              <p>
                Your GitHub token stays in your browser for maximum security
              </p>
            </div>
            <div className="flex flex-col items-center text-center p-6 bg-content1 rounded-lg shadow-md">
              <i className="fas fa-user-friends text-4xl text-primary mb-4"></i>
              <h3 className="text-xl font-semibold mb-2">User-Friendly</h3>
              <p>Simple interface for managing your GitHub repositories</p>
            </div>
          </div>
        </section>

        <section className="mb-16">
          <h2 className="text-4xl font-bold mb-8">Impact</h2>
          <p className="text-2xl font-semibold">
            Over 235,000 repositories archived and deleted!
          </p>
          <p className="text-lg mt-4">
            Join thousands of developers who have simplified their GitHub
            management with Repo Remover.
          </p>
        </section>

        <section className="mb-16">
          <h2 className="text-4xl font-bold mb-8">How It Works</h2>
          <ol className="list-decimal list-inside space-y-4">
            <li className="text-lg">
              Generate a GitHub Personal Access Token (PAT) with the required
              permissions
            </li>
            <li className="text-lg">Enter your PAT in the form below</li>
            <li className="text-lg">
              Select the repositories you want to archive or delete
            </li>
            <li className="text-lg">
              Confirm your action and let Repo Remover do the work
            </li>
          </ol>
          <div className="mt-8">
            <Link
              href="https://github.com/settings/tokens/new?scopes=repo,delete_repo,user"
              isExternal
              showAnchorIcon
              className="text-primary"
            >
              Create a new GitHub token with the correct permissions
            </Link>
          </div>
        </section>

        <section className="mb-16">
          <h2 className="text-4xl font-bold mb-8">Get Started</h2>
          <p className="text-lg mb-4">
            Ready to clean up your GitHub repositories? Enter your GitHub
            Personal Access Token below to begin:
          </p>
          <div id="github-token-form">
            <GitHubTokenForm />
          </div>
        </section>
      </main>

      <Footer className="mt-auto" />
    </>
  );
}
