import { ExternalLink, Star } from "lucide-react";

const testimonials = [
  {
    handle: "Lindsay W.",
    quote:
      "This saved me a lot of time when I needed to delete 100 repos. The developer helped me out by making updates when I gave some feedback. Great!",
    rating: 5,
    source: "ProductHunt Review",
    sourceUrl: "https://www.producthunt.com/products/repo-remover/reviews",
  },
  {
    handle: "George A.",
    quote:
      "It was dumb simple, and the UI made it easy to filter out repos I did not want to be affected.",
    rating: 5,
    source: "ProductHunt Review",
    sourceUrl: "https://www.producthunt.com/products/repo-remover/reviews",
  },
  {
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
            Loved by Developers
          </h2>
          <p className="text-lg text-default-500 max-w-2xl mx-auto">
            Join thousands of developers who have reclaimed control of their
            GitHub accounts.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {testimonials.map((t, index) => (
            <div
              className="bg-background border border-divider rounded-xl p-6"
              key={index}
            >
              <div className="flex gap-1 mb-4">
                {Array.from({ length: t.rating }, (_, i) => (
                  <Star className="w-4 h-4 fill-warning text-warning" key={i} />
                ))}
              </div>
              <p className="mb-6 leading-relaxed">&ldquo;{t.quote}&rdquo;</p>
              <div className="flex items-center justify-between">
                <span className="font-semibold text-sm">{t.handle}</span>
                <a
                  className="inline-flex items-center gap-1 text-xs text-default-400 hover:text-primary transition-colors"
                  href={t.sourceUrl}
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  {t.source}
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
