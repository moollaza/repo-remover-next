"use client";

import { Button, Link } from "@nextui-org/react";

import { ScrollingQuotes } from "@/components/scrolling-quotes";
import Footer from "@components/footer";
import GitHubTokenForm from "@components/github-token-form";

const scrollToID = (id: string) => {
  const form = document.getElementById(id);
  form?.scrollIntoView({ behavior: "smooth" });
};

const scrollToForm = () => {
  scrollToID("github-token-form");
};

export default function HomePage() {
  return (
    <>
      <main>
        <section className="bg-primary-50">
          <div className="container mx-auto max-w-7xl py-10 px-6 text-center text-pretty justify-center">
            <h1 className="text-7xl font-bold leading-snug text-pretty">
              <span className="underline underline-offset-4 decoration-warning">
                Archive
              </span>{" "}
              or{" "}
              <span className="underline underline-offset-4 decoration-danger">
                Delete
              </span>{" "}
              multiple GitHub repos, <i>instantly</i>.
            </h1>

            <p className="text-3xl mt-16 mx-auto text-default-800">
              Search, Filter, Sort, and Select to quickly clean up your repos!
            </p>

            <div className="inline-flex gap-5 pt-10">
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
                variant="ghost"
                size="lg"
                onPress={() => scrollToID("features")}
              >
                Learn More
              </Button>
            </div>
          </div>
        </section>

        {/* FEATURES */}
        <div
          id="features"
          className="container mx-auto max-w-7xl pt-16 px-6 flex-grow"
        >
          <section className="mb-16">
            <h2 className="text-5xl font-bold mb-8">Features</h2>
            <p className="text-3xl font-semibold">
              Some of the reasons why developers love Repo Remover
            </p>

            <div className="grid md:grid-cols-3 gap-8 mt-16">
              <div className="flex flex-col items-center text-center p-6 bg-content2 rounded-lg shadow-md">
                <h3 className="text-xl font-semibold mb-2">Easy to Use</h3>
                <p className="text-pretty">
                  Our simple interface makes it incredibly easy to find what
                  you&apos;re looking for and get rid of it quickly.
                </p>
              </div>
              <div className="flex flex-col items-center text-center p-6 bg-content2 rounded-lg shadow-md">
                <h3 className="text-xl font-semibold mb-2">Open Source</h3>
                <p className="text-pretty">
                  Completely free and open source on GitHub. Use Repo Remover
                  here or run it locally.
                </p>
              </div>
              <div className="flex flex-col items-center text-center p-6 bg-content2 rounded-lg shadow-md">
                <h3 className="text-xl font-semibold mb-2">
                  Private and Secure
                </h3>
                <p className="text-pretty">
                  We do not store any data or collect any information about you
                  or your repos. All api calls are made client-side.
                </p>
              </div>
            </div>
          </section>
        </div>

        {/* SEE IT IN ACTION */}
        <section className="bg-secondary-100 py-16">
          <div className="container mx-auto max-w-7xl px-6">
            <h2 className="text-5xl font-bold mb-8 text-secondary-900">
              See It In Action!
            </h2>
            <p className="text-3xl font-semibold text-secondary-800">
              Got some forgotten repos lying around? Repo Remover can help you
              find them, quickly.
            </p>

            <Button
              color="secondary"
              size="lg"
              onPress={scrollToForm}
              className="mt-10 bg-secondary"
            >
              Get Started It&apos;s Free!
            </Button>
          </div>
        </section>

        {/* IMPACT */}
        <section className="bg-success-100 py-16">
          <div className="container mx-auto max-w-7xl px-6">
            <h2 className="text-5xl font-bold mb-8 text-success-900">
              Over 235,000 repositories archived and deleted!
            </h2>
            <p className="text-3xl font-semibold text-success-800">
              Join thousands of developers who have simplified their lives and
              saved hours of time thanks to Repo Remover.
            </p>
            <Button
              color="primary"
              size="lg"
              onPress={scrollToForm}
              className="mt-10 bg-success"
            >
              Get Started It&apos;s Free!
            </Button>
          </div>

          {/* QUOTES */}
          <div className="pt-16">
            <ScrollingQuotes />
          </div>
        </section>

        {/* GET STARTED */}
        <div className="container mx-auto max-w-7xl py-16 px-6 flex-grow ">
          <section id="get-started" className="mb-16">
            <h2 className="text-5xl font-bold mb-8">Get Started</h2>
            <p className="text-3xl">
              Cleaning up repos has never been quicker, or easier!
            </p>

            <ol className="list-decimal list-inside space-y-4 pt-10">
              <li className="text-lg">
                Generate a GitHub Personal Access Token (PAT) with the required
                permissions
              </li>
              <div className="mt-2">
                <Button
                  as={Link}
                  color="primary"
                  variant="ghost"
                  href="https://github.com/settings/tokens/new?scopes=repo,delete_repo,user"
                  isExternal
                  showAnchorIcon
                  className="text-primary"
                >
                  Get my token
                </Button>
              </div>
              <li className="text-lg">Enter your PAT in the form below</li>
              <li className="text-lg">
                Select the repositories you want to archive or delete
              </li>
              <li className="text-lg">
                Confirm your action and watch the magic happen!
              </li>
            </ol>

            <div id="github-token-form" className="pt-10">
              <GitHubTokenForm />
            </div>
          </section>
        </div>
      </main>

      <Footer className="mt-auto" />
    </>
  );
}
