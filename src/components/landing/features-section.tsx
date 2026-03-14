import { CheckSquare, Filter, Search, Shield } from "lucide-react";

const features = [
  {
    benefits: [
      "Search across all your repositories instantly",
      "Filter by name and description",
      "See results update in real-time as you type",
    ],
    description:
      "Never scroll through endless lists again. Our smart search instantly finds repositories by name or description.",
    icon: Search,
    title: "Lightning-Fast Search",
  },
  {
    benefits: [
      "Filter by visibility (public, private, archived)",
      "Sort by any column with a single click",
      "Combine multiple filters for precise results",
    ],
    description:
      "Take control with powerful filters. Show only private repos, archived projects, or forked repos. Sort by any metric that matters.",
    icon: Filter,
    title: "Advanced Filtering & Sorting",
  },
  {
    benefits: [
      "Select individual repos or use 'select all'",
      "Archive or delete multiple repos simultaneously",
      "Confirmation dialogs prevent accidents",
    ],
    description:
      "Select multiple repositories with checkboxes and perform actions on all of them at once. Archive dozens or delete test repos in a single click.",
    icon: CheckSquare,
    title: "Bulk Operations Made Simple",
  },
  {
    benefits: [
      "Your token stays in your browser only",
      "No server, no backend, no data collection",
      "Open source code you can read and audit",
    ],
    description:
      "Your token never leaves your browser. It's used directly to call the GitHub API client-side — no backend, no server, nothing to intercept.",
    icon: Shield,
    title: "100% Private & Secure",
  },
];

export function FeaturesSection() {
  return (
    <section className="w-full" id="features">
      {features.map((feature, index) => (
        <div
          className={`w-full px-6 py-20 ${index % 2 === 1 ? "bg-default-50" : ""}`}
          key={index}
        >
          <div className="max-w-7xl mx-auto">
            <div
              className={`flex flex-col ${index % 2 === 1 ? "lg:flex-row-reverse" : "lg:flex-row"} items-center gap-12 lg:gap-16`}
            >
              <div className="flex-1 flex justify-center">
                <div className="w-48 h-48 rounded-2xl bg-gradient-to-br from-[var(--brand-blue)] to-[var(--brand-cyan)] flex items-center justify-center shadow-xl">
                  <feature.icon
                    className="w-24 h-24 text-white"
                    strokeWidth={1.5}
                  />
                </div>
              </div>
              <div className="flex-1">
                <h2 className="text-3xl md:text-4xl font-bold mb-4">
                  {feature.title}
                </h2>
                <p className="text-lg text-default-500 mb-6">
                  {feature.description}
                </p>
                <ul className="space-y-3">
                  {feature.benefits.map((benefit, i) => (
                    <li className="flex items-start gap-3" key={i}>
                      <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                        <div className="w-2 h-2 rounded-full bg-primary" />
                      </div>
                      <span>{benefit}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      ))}
    </section>
  );
}
