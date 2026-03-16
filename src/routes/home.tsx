import { Button, Link } from "@heroui/react";

import { ErrorBoundary } from "@/components/error-boundary";
import ScrollButton from "@/components/scroll-button";
import { ScrollingQuotes } from "@/components/scrolling-quotes";
import TokenFormSection from "@/components/token-form-section";

export function Home() {
  return (
    <ErrorBoundary>
      <section>
        <div className="container mx-auto max-w-6xl py-10 px-6 text-center text-pretty justify-center">
          <h1 className="font-extrabold tracking-tight text-[84px] leading-none">
            Archive or Delete Multiple GitHub Repos, Instantly.
          </h1>

          <p className="text-3xl mt-16 mx-auto text-default-800">
            Search, Filter, Sort, and Select to quickly clean up your repos!
          </p>

          <div className="inline-flex gap-5 pt-10">
            <ScrollButton targetId="github-token-form">
              Get Started
            </ScrollButton>
            <ScrollButton targetId="features" variant="ghost">
              Learn More
            </ScrollButton>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <div
        className="container mx-auto max-w-6xl pt-16 px-6 flex-grow"
        id="features"
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
                Completely free and open source on GitHub. Use Repo Remover here
                or run it locally.
              </p>
            </div>
            <div className="flex flex-col items-center text-center p-6 bg-content2 rounded-lg shadow-md">
              <h3 className="text-xl font-semibold mb-2">Private and Secure</h3>
              <p className="text-pretty">
                We do not store any data or collect any information about you or
                your repos. All api calls are made client-side.
              </p>
            </div>
          </div>
        </section>
      </div>

      {/* SEE IT IN ACTION */}
      <section className="bg-secondary-100 py-16">
        <div className="container mx-auto max-w-6xl px-6">
          <h2 className="text-5xl font-bold mb-8 text-secondary-900">
            See It In Action!
          </h2>
          <p className="text-3xl font-semibold text-secondary-800">
            Got some forgotten repos lying around? Repo Remover can help you
            find them, quickly.
          </p>

          <ScrollButton
            className="mt-10 bg-secondary"
            color="secondary"
            targetId="github-token-form"
          >
            Get Started It&apos;s Free!
          </ScrollButton>
        </div>
      </section>

      {/* IMPACT */}
      <section className="bg-success-100 py-16">
        <div className="container mx-auto max-w-6xl px-6">
          <h2 className="text-5xl font-bold mb-8 text-success-900">
            Over 235,000 repositories archived and deleted!
          </h2>
          <p className="text-3xl font-semibold text-success-800">
            Join thousands of developers who have simplified their lives and
            saved hours of time thanks to Repo Remover.
          </p>
          <ScrollButton
            className="mt-10 bg-success"
            color="primary"
            targetId="github-token-form"
          >
            Get Started It&apos;s Free!
          </ScrollButton>
        </div>

        {/* QUOTES */}
        <div className="pt-16 overflow-x-hidden">
          <ScrollingQuotes />
        </div>
      </section>

      {/* GET STARTED */}
      <div className="container mx-auto max-w-6xl py-16 px-6 flex-grow ">
        <section className="mb-16" id="get-started">
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
                className="text-primary"
                color="primary"
                href="https://github.com/settings/tokens/new?scopes=repo,delete_repo,user"
                isExternal
                showAnchorIcon
                variant="ghost"
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

          <TokenFormSection />
        </section>
      </div>
    </ErrorBoundary>
  );
}
