import { ExternalLink, Star } from "lucide-react";

const testimonials = [
  {
    avatar: "LW",
    handle: "Lindsay W.",
    quote:
      "This saved me a lot of time when I needed to delete 100 repos. The developer helped me out by making updates when I gave some feedback. Great!",
    rating: 5,
    source: "ProductHunt Review",
    sourceUrl: "https://www.producthunt.com/products/repo-remover/reviews",
  },
  {
    avatar: "GA",
    handle: "George A.",
    quote:
      "It was dumb simple, and the UI made it easy to filter out repos I did not want to be affected.",
    rating: 5,
    source: "ProductHunt Review",
    sourceUrl: "https://www.producthunt.com/products/repo-remover/reviews",
  },
  {
    avatar: "JY",
    handle: "@jayanth0107",
    quote: "You have created a website that GitHub won't provide.",
    rating: 5,
    source: "GitHub Gist",
    sourceUrl:
      "https://gist.github.com/mrkpatchaa/63720cbf744a2bf59a3e9cfe73fc33b0",
  },
];

export function TestimonialsSection() {
  return (
    <section className="w-full px-6 py-20 bg-default-50">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            What Developers Are Saying
          </h2>
          <p className="text-lg text-default-500 max-w-2xl mx-auto">
            Real reviews from developers who use Repo Remover.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {testimonials.map((t, index) => (
            <div
              className="bg-background border border-divider rounded-xl p-6 flex flex-col"
              key={index}
            >
              <div className="flex gap-1 mb-4">
                {Array.from({ length: t.rating }, (_, i) => (
                  <Star
                    className="w-4 h-4 fill-yellow-400 text-yellow-400"
                    key={i}
                  />
                ))}
              </div>
              <p className="text-foreground mb-6 leading-relaxed flex-1">
                &ldquo;{t.quote}&rdquo;
              </p>
              <div className="flex items-center gap-3 mt-auto">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[var(--brand-blue)] to-[var(--brand-cyan)] flex items-center justify-center text-white font-semibold text-sm">
                  {t.avatar}
                </div>
                <div>
                  <div className="font-semibold">{t.handle}</div>
                  <a
                    className="text-sm text-default-500 hover:text-primary transition-colors inline-flex items-center gap-1"
                    href={t.sourceUrl}
                    rel="noopener noreferrer"
                    target="_blank"
                  >
                    {t.source}
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
