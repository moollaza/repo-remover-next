import { ArrowRight, Github } from "lucide-react";

export function HeroSection() {
  return (
    <section className="w-full px-6 py-20 md:py-28">
      <div className="max-w-5xl mx-auto text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-default-100 border border-divider mb-8">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--brand-blue)] opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-[var(--brand-blue)]" />
          </span>
          <span className="text-sm text-default-500">
            300,000+ repos managed and counting
          </span>
        </div>

        <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
          Archive or Delete Multiple GitHub Repos,{" "}
          <span className="bg-gradient-to-r from-[var(--brand-blue)] to-[var(--brand-cyan)] bg-clip-text text-transparent">
            Instantly
          </span>
        </h1>

        <p className="text-lg md:text-xl text-default-500 mb-10 max-w-2xl mx-auto leading-relaxed">
          Search, filter, and bulk-manage hundreds of repositories in one place.
          Zero-knowledge — your token never leaves your browser.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <button
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-lg bg-[var(--brand-blue)] text-white font-medium text-base hover:opacity-90 transition-opacity shadow-sm"
            onClick={() => {
              const target = document.getElementById("get-started");
              target?.scrollIntoView({ behavior: "smooth" });
            }}
          >
            Get Started
            <ArrowRight className="h-4 w-4" />
          </button>
          <a
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-lg border border-divider text-foreground font-medium text-base hover:bg-default-100 transition-colors"
            href="https://github.com/moollaza/repo-remover"
            rel="noopener noreferrer"
            target="_blank"
          >
            <Github className="h-5 w-5" />
            View on GitHub
          </a>
        </div>

        <div className="mt-8 flex items-center justify-center gap-4 text-sm text-default-600">
          <span>Free forever</span>
          <span className="w-1 h-1 rounded-full bg-default-300" />
          <span>100% in-browser</span>
          <span className="w-1 h-1 rounded-full bg-default-300" />
          <span>Your token never leaves your device</span>
        </div>
      </div>
    </section>
  );
}
