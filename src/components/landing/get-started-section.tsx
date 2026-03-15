import {
  CheckSquare,
  ExternalLink,
  Key,
  Loader2,
  Search,
  Trash2,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { useGitHubData } from "@/hooks/use-github-data";
import { analytics } from "@/utils/analytics";
import {
  createThrottledOctokit,
  isValidGitHubToken,
} from "@/utils/github-utils";

const steps = [
  {
    cta: {
      href: "https://github.com/settings/tokens/new?scopes=repo,delete_repo&description=Repo+Remover",
      label: "Generate PAT on GitHub",
    },
    description:
      "Create a GitHub PAT with the permissions needed to manage your repositories.",
    icon: Key,
    number: "1",
    title: "Generate a Personal Access Token",
  },
  {
    description:
      "Paste your PAT into Repo Remover. It stays in your browser — we never see it, log it, or send it anywhere.",
    icon: Search,
    number: "2",
    title: "Paste Your Token & Load Repos",
  },
  {
    description:
      "Use search and filters to locate old repos. Check the ones you want to archive or delete.",
    icon: CheckSquare,
    number: "3",
    title: "Find & Select What to Remove",
  },
  {
    description:
      "Confirm your choices and Repo Remover handles the rest. No page reloads, no waiting.",
    icon: Trash2,
    number: "4",
    title: "Archive or Delete in One Click",
  },
];

/**
 * Inline PAT form — matches Figma design (key icon + password input + full-width button).
 * Handles validation + auth without HeroUI components.
 */
function InlinePATForm() {
  const [token, setToken] = useState("");
  const [error, setError] = useState<null | string>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [isValid, setIsValid] = useState(false);
  const { setPat } = useGitHubData();
  const navigate = useNavigate();

  // Auto-validate when token changes (with debounce)
  useEffect(() => {
    if (!token || !isValidGitHubToken(token)) {
      setIsValid(false);
      if (token && token.length > 5) {
        setError("Invalid token format");
      } else {
        setError(null);
      }
      return;
    }

    setError(null);
    setIsValidating(true);

    const timeout = setTimeout(() => {
      const octokit = createThrottledOctokit(token);
      octokit.rest.users
        .getAuthenticated()
        .then(() => {
          setIsValid(true);
          setIsValidating(false);
        })
        .catch(() => {
          setError("Invalid or expired token");
          setIsValid(false);
          setIsValidating(false);
        });
    }, 500);

    return () => clearTimeout(timeout);
  }, [token]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isValid || isValidating) return;

    setPat(token);
    analytics.trackTokenValidated();
    void navigate("/dashboard");
  }

  const canSubmit = isValid && !isValidating;

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <div className="relative">
        <Key className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-default-400" />
        <input
          autoComplete="off"
          className={`w-full pl-10 pr-4 py-3 rounded-lg border bg-default-100 text-sm font-mono placeholder:text-default-400 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-colors ${
            error
              ? "border-danger"
              : isValid
                ? "border-emerald-600"
                : "border-divider"
          }`}
          data-testid="github-token-input"
          onChange={(e) => setToken(e.target.value)}
          placeholder="ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
          type="text"
          data-1p-ignore
          data-lpignore="true"
          value={token}
        />
        {isValidating && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-default-400 animate-spin" />
        )}
      </div>

      {error && <p className="text-xs text-danger">{error}</p>}

      {isValid && (
        <p className="text-xs text-emerald-700 dark:text-emerald-400">
          Token validated successfully
        </p>
      )}

      <button
        className={`w-full py-3 rounded-lg font-medium text-base transition-all ${
          canSubmit
            ? "bg-[var(--brand-blue)] text-white hover:opacity-90 shadow-sm"
            : "bg-default-200 text-default-400 cursor-not-allowed"
        }`}
        data-testid="github-token-submit"
        disabled={!canSubmit}
        type="submit"
      >
        {isValidating ? "Validating..." : "Load My Repositories"}
      </button>
    </form>
  );
}

export function GetStartedSection() {
  return (
    <section className="w-full px-6 py-20" id="get-started">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Get Started in Under 2 Minutes
          </h2>
          <p className="text-lg text-default-500 max-w-2xl mx-auto">
            No installs, no sign-up, no server. Just a token in your browser and
            you're ready to go.
          </p>
        </div>

        <div className="relative">
          {/* Connecting line */}
          <div className="absolute left-5 top-6 bottom-6 w-px bg-divider hidden sm:block" />

          <div className="space-y-10">
            {steps.map((step, index) => (
              <div className="flex gap-6 items-start relative" key={index}>
                <div className="shrink-0 relative z-10">
                  <div
                    className={`w-11 h-11 rounded-full flex items-center justify-center font-bold text-base shadow-sm ring-4 ring-background ${
                      index === 0
                        ? "bg-gradient-to-br from-[var(--brand-blue)] to-[var(--brand-cyan)] text-white"
                        : "bg-default-100 text-default-500 border border-divider"
                    }`}
                  >
                    {step.number}
                  </div>
                </div>
                <div className="flex-1 pt-1 pb-2">
                  <div className="flex items-center gap-2 mb-1.5">
                    <step.icon className="h-4 w-4 text-[var(--brand-blue)]" />
                    <h3 className="text-lg font-semibold">{step.title}</h3>
                  </div>
                  <p className="text-default-500 mb-3">{step.description}</p>
                  {step.cta && (
                    <a
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-divider text-sm font-medium hover:bg-default-50 transition-colors"
                      href={step.cta.href}
                      rel="noopener noreferrer"
                      target="_blank"
                    >
                      <ExternalLink className="h-4 w-4" />
                      {step.cta.label}
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* PAT form card — plain Tailwind, no HeroUI */}
        <div className="mt-16 bg-content1 border border-divider rounded-xl p-8 max-w-xl mx-auto">
          <h3 className="text-xl font-semibold mb-2 text-center">
            Ready to start?
          </h3>
          <p className="text-sm text-default-500 text-center mb-6">
            Paste your PAT below to load your repositories.
          </p>

          <InlinePATForm />

          <div className="flex items-center justify-center gap-6 mt-5 text-xs text-default-400">
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-success inline-block" />
              Stays in your browser
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-success inline-block" />
              Never sent to a server
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-success inline-block" />
              100% free
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
