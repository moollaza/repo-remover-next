import { motion, useInView, useReducedMotion } from "framer-motion";
import { CheckSquare, Filter, Search, Shield } from "lucide-react";
import { useRef } from "react";

import {
  fadeUp,
  scrollRevealProps,
  staggerContainerWide,
} from "@/utils/motion";

/** Wrapper that draws SVG icon strokes when scrolled into view */
function AnimatedIcon({
  icon: Icon,
}: {
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const prefersReduced = useReducedMotion();
  const isInView = useInView(ref, { once: true, margin: "-80px" });
  // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing -- ?? would swallow false, hiding icons for non-reduced-motion users
  const visible = prefersReduced || isInView;

  return (
    <motion.div
      ref={ref}
      initial={
        prefersReduced ? { scale: 1, opacity: 1 } : { scale: 0.8, opacity: 0 }
      }
      animate={visible ? { scale: 1, opacity: 1 } : { scale: 0.8, opacity: 0 }}
      transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
      whileHover={{ rotate: [0, -5, 5, 0], transition: { duration: 0.4 } }}
      className="[&_svg]:w-24 [&_svg]:h-24 [&_svg]:text-white"
      style={{
        strokeDasharray: visible ? "none" : "200",
        strokeDashoffset: visible ? "0" : "200",
      }}
    >
      <Icon strokeWidth={1.5} />
    </motion.div>
  );
}

const features = [
  {
    benefits: [
      "Search across all your repositories instantly",
      "Filter by name and description",
      "See results update in real-time as you type",
    ],
    description:
      "Find any repository instantly by name or description. No more scrolling through endless lists.",
    icon: Search,
    title: "Instant Search",
  },
  {
    benefits: [
      "Filter by visibility (public, private, archived)",
      "Sort by any column with a single click",
      "Combine multiple filters for precise results",
    ],
    description:
      "Show only private repos, archived projects, or forks. Sort by name or last updated. Combine filters for precise results.",
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
      "Select repos with checkboxes and act on all of them at once. Archive dozens or delete test repos in a single click.",
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
  const reduced = useReducedMotion();

  return (
    <section className="w-full" id="features">
      {features.map((feature, index) => (
        <div
          className={`w-full px-6 py-20 ${index % 2 === 1 ? "bg-default-50" : ""}`}
          key={index}
        >
          <motion.div
            className="max-w-7xl mx-auto"
            {...scrollRevealProps(staggerContainerWide, reduced)}
          >
            <div
              className={`flex flex-col ${index % 2 === 1 ? "lg:flex-row-reverse" : "lg:flex-row"} items-center gap-12 lg:gap-16`}
            >
              <motion.div
                className="flex-1 flex justify-center"
                variants={fadeUp}
              >
                <div className="w-48 h-48 rounded-2xl bg-gradient-to-br from-[var(--brand-blue)] to-[var(--brand-cyan)] dark:from-[var(--brand-blue)]/80 dark:to-[var(--brand-cyan)]/80 flex items-center justify-center shadow-xl">
                  <AnimatedIcon icon={feature.icon} />
                </div>
              </motion.div>
              <motion.div className="flex-1" variants={fadeUp}>
                <h2 className="text-3xl md:text-4xl font-bold mb-4">
                  {feature.title}
                </h2>
                <p className="text-lg text-default-500 mb-6">
                  {feature.description}
                </p>
                <ul className="space-y-3 mb-8">
                  {feature.benefits.map((benefit, i) => (
                    <li className="flex items-start gap-3" key={i}>
                      <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                        <div className="w-2 h-2 rounded-full bg-primary" />
                      </div>
                      <span>{benefit}</span>
                    </li>
                  ))}
                </ul>
                {index === 0 && (
                  <button
                    className="mt-4 inline-flex items-center gap-2 px-6 py-2.5 rounded-lg bg-[var(--brand-blue)] text-white font-medium text-sm hover:opacity-90 transition-opacity"
                    onClick={() => {
                      const target = document.getElementById("get-started");
                      target?.scrollIntoView({ behavior: "smooth" });
                    }}
                    type="button"
                  >
                    Try It Now
                  </button>
                )}
              </motion.div>
            </div>
          </motion.div>
        </div>
      ))}
    </section>
  );
}
