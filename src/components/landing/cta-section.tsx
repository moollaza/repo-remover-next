import { ArrowRight, Github } from "lucide-react";

export function CTASection() {
  return (
    <section className="w-full px-6 py-20">
      <div className="max-w-4xl mx-auto">
        <div className="rounded-2xl p-12 md:p-16 text-center bg-gradient-to-br from-[var(--brand-blue)] to-[var(--brand-cyan)] dark:from-[var(--brand-blue)]/90 dark:to-[var(--brand-cyan)]/80 text-white relative overflow-hidden shadow-2xl">
          {/* Decorative blurs */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-white/10 rounded-full blur-3xl" />

          <div className="relative z-10">
            <h2 className="text-3xl md:text-5xl font-bold mb-6">
              Ready to Clean Up Your GitHub?
            </h2>
            <p className="text-lg md:text-xl mb-10 text-white/90 max-w-2xl mx-auto">
              Join 15,000+ developers who have already organized their
              repositories. Get started in less than 2 minutes — completely
              free, forever.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <button
                className="inline-flex items-center gap-2 px-8 py-3 rounded-lg bg-white text-[var(--brand-blue)] font-medium text-base hover:bg-white/90 transition-colors"
                onClick={() => {
                  const target = document.getElementById("get-started");
                  target?.scrollIntoView({ behavior: "smooth" });
                }}
              >
                <Github className="h-5 w-5" />
                Get Started Now
                <ArrowRight className="h-4 w-4" />
              </button>
              <a
                className="inline-flex items-center gap-2 px-8 py-3 rounded-lg border border-white/30 text-white font-medium text-base hover:bg-white/10 transition-colors"
                href="https://github.com/moollaza/repo-remover"
                rel="noopener noreferrer"
                target="_blank"
              >
                View on GitHub
              </a>
            </div>
            <p className="text-sm text-white/70 mt-6">
              Free forever · Your token stays in your browser · No servers, no
              tracking
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
