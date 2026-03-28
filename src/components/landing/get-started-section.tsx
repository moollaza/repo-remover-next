import { motion } from "framer-motion";
import {
  CheckSquare,
  ExternalLink,
  Info,
  Key,
  Loader2,
  Search,
  Trash2,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

import { useGitHubData } from "@/hooks/use-github-data";
import { analytics } from "@/utils/analytics";
import {
  createThrottledOctokit,
  isValidGitHubToken,
} from "@/utils/github-utils";
import {
  fadeUp,
  scaleIn,
  staggerContainer,
  staggerContainerWide,
  viewportOnce,
} from "@/utils/motion";

const steps = [
  {
    cta: {
      href: "https://github.com/settings/tokens/new?scopes=repo,delete_repo,read:org&description=Repo+Remover",
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
  const [remember, setRemember] = useState(true);
  const [showTooltip, setShowTooltip] = useState(false);
  const [showToken, setShowToken] = useState(false);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const { setPat } = useGitHubData();
  const navigate = useNavigate();

  // Close tooltip on click outside
  useEffect(() => {
    if (!showTooltip) return;
    function handleClick(e: MouseEvent) {
      if (
        tooltipRef.current &&
        !tooltipRef.current.contains(e.target as Node)
      ) {
        setShowTooltip(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [showTooltip]);

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

    setPat(token, remember);
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
          className={`w-full pl-10 pr-12 py-3 rounded-lg border bg-default-100 text-sm font-mono placeholder:text-default-400 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-colors ${
            error
              ? "border-danger"
              : isValid
                ? "border-emerald-600"
                : "border-divider"
          }`}
          data-testid="github-token-input"
          onChange={(e) => setToken(e.target.value)}
          placeholder="ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
          type={showToken ? "text" : "password"}
          data-1p-ignore
          data-lpignore="true"
          value={token}
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
          {token && (
            <button
              aria-label={showToken ? "Hide token" : "Show token"}
              className="text-default-400 hover:text-default-600 transition-colors p-0.5"
              onClick={() => setShowToken((prev) => !prev)}
              type="button"
            >
              {showToken ? (
                <svg
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  viewBox="0 0 24 24"
                >
                  <path
                    d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <line
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    x1="1"
                    x2="23"
                    y1="1"
                    y2="23"
                  />
                </svg>
              ) : (
                <svg
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  viewBox="0 0 24 24"
                >
                  <path
                    d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <circle
                    cx="12"
                    cy="12"
                    r="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              )}
            </button>
          )}
          {isValidating && (
            <Loader2 className="h-4 w-4 text-default-400 animate-spin" />
          )}
        </div>
      </div>

      {error && <p className="text-xs text-danger">{error}</p>}

      {isValid && (
        <p className="text-xs text-emerald-700 dark:text-emerald-400">
          Token validated successfully
        </p>
      )}

      <div className="flex items-center gap-2">
        <input
          checked={remember}
          className="h-4 w-4 rounded border-default-300 accent-[var(--brand-blue)]"
          id="remember-token"
          onChange={(e) => setRemember(e.target.checked)}
          type="checkbox"
        />
        <label
          className="text-sm text-default-500 select-none"
          htmlFor="remember-token"
        >
          Remember my token
        </label>
        <div className="relative" ref={tooltipRef}>
          <button
            aria-label="Token storage info"
            className="text-default-400 hover:text-default-600 transition-colors"
            onClick={() => setShowTooltip(!showTooltip)}
            type="button"
          >
            <Info className="h-3.5 w-3.5" />
          </button>
          {showTooltip && (
            <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-3 w-64 p-3 rounded-lg bg-content1 border border-divider shadow-lg text-xs text-default-500 z-50">
              Your token is AES-encrypted and stored only in your browser's
              localStorage. It never leaves your device.
              <div className="absolute left-1/2 -translate-x-1/2 -bottom-1.5 w-3 h-3 rotate-45 bg-content1 border-r border-b border-divider" />
            </div>
          )}
        </div>
      </div>

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
        <motion.div
          className="text-center mb-16"
          initial="hidden"
          variants={staggerContainer}
          viewport={viewportOnce}
          whileInView="visible"
        >
          <motion.h2
            className="text-3xl md:text-4xl font-bold mb-4"
            variants={fadeUp}
          >
            Get Started in Under 2 Minutes
          </motion.h2>
          <motion.p
            className="text-lg text-default-500 max-w-2xl mx-auto text-pretty"
            variants={fadeUp}
          >
            No installs, no sign-up, no server. Just a token in your browser and
            you're ready to&nbsp;go.
          </motion.p>
        </motion.div>

        <motion.div
          className="relative"
          initial="hidden"
          variants={staggerContainerWide}
          viewport={viewportOnce}
          whileInView="visible"
        >
          {/* Connecting line */}
          <div className="absolute left-5 top-6 bottom-6 w-px bg-divider hidden sm:block" />

          <div className="space-y-10">
            {steps.map((step, index) => (
              <motion.div
                className="flex gap-6 items-start relative"
                key={index}
                variants={fadeUp}
              >
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
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* PAT form card */}
        <motion.div
          className="mt-16 bg-content1 border border-divider rounded-xl p-8 max-w-xl mx-auto"
          initial="hidden"
          variants={scaleIn}
          viewport={viewportOnce}
          whileInView="visible"
        >
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
        </motion.div>
      </div>
    </section>
  );
}
