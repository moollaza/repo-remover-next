import { motion, useInView, useReducedMotion } from "framer-motion";
import { Clock, Code, CheckSquare, Shield } from "lucide-react";
import { useRef } from "react";

import { Button } from "@/components/ui/button";
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
      "Personal, org, forked, and archived repos loaded automatically",
      "Sort by name or last updated",
      "Pagination keeps large accounts usable",
    ],
    description:
      "GitHub scatters your repos across profiles, orgs, and settings pages. Repo Remover loads them all \u2014 personal, org, forked, archived \u2014 into one sortable table.",
    icon: CheckSquare,
    title: "Stop Jumping Between Pages",
  },
  {
    benefits: [
      "Both actions require typing your username to confirm",
      "Archiving is always reversible through GitHub",
      "Review your full selection before anything runs",
    ],
    description:
      "Every bulk action requires typing your username to confirm. Archiving is reversible. You see exactly which repos are affected before anything executes.",
    icon: Shield,
    title: "Safer Destructive Actions",
  },
  {
    benefits: [
      "No shell scripts or API calls to maintain",
      "Built-in throttling handles GitHub API rate limits",
      "Useful for side projects, experiments, and stale org repos",
    ],
    description:
      "No shell scripts, no clicking through settings pages one by one. Filter, check the boxes, and clean up in minutes instead of hours.",
    icon: Clock,
    title: "Cleanup Without Scripts",
  },
  {
    benefits: [
      "No accounts, no tracking, no cookies",
      "MIT-licensed \u2014 audit it yourself",
      "Token encryption uses AES-GCM in localStorage",
    ],
    description:
      "There is no server between you and GitHub. Your token is never stored unless you opt in to local encryption. The source code is public.",
    icon: Code,
    title: "Private by Design",
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
                  <Button
                    className="mt-4 gap-2 px-6 py-2.5 bg-[var(--brand-blue)] text-white hover:opacity-90"
                    onClick={() => {
                      const target = document.getElementById("get-started");
                      target?.scrollIntoView({ behavior: "smooth" });
                    }}
                  >
                    Try It Now
                  </Button>
                )}
              </motion.div>
            </div>
          </motion.div>
        </div>
      ))}
    </section>
  );
}
