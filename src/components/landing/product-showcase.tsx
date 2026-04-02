import { motion, useReducedMotion } from "framer-motion";

import { MockDashboardPreview } from "@/components/landing/mock-dashboard-preview";
import {
  fadeUp,
  scaleIn,
  scrollRevealProps,
  staggerContainer,
} from "@/utils/motion";

export function ProductShowcase() {
  const reduced = useReducedMotion();

  return (
    <section
      className="w-full px-4 sm:px-6 py-16 sm:py-20 bg-gradient-to-b from-background to-default-50"
      id="how-it-works"
    >
      <div className="max-w-7xl mx-auto">
        <motion.div
          className="text-center mb-12"
          {...scrollRevealProps(staggerContainer, reduced)}
        >
          <motion.span
            className="inline-block px-3 py-1 text-xs rounded-full bg-[var(--brand-blue)]/10 text-[var(--brand-blue)] border border-[var(--brand-blue)]/20 mb-4"
            variants={fadeUp}
          >
            See it in action
          </motion.span>
          <motion.h2
            className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4"
            variants={fadeUp}
          >
            All Your Repos in One View
          </motion.h2>
          <motion.p
            className="text-lg text-default-500 max-w-2xl mx-auto"
            variants={fadeUp}
          >
            Browse your repositories in an organized table. Search, filter,
            select, and take action.
          </motion.p>
        </motion.div>

        {/* Glow + UI mockup */}
        <motion.div
          className="relative max-w-5xl mx-auto"
          {...scrollRevealProps(scaleIn, reduced)}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-[var(--brand-blue)] to-[var(--brand-cyan)] blur-3xl opacity-10 dark:opacity-20 rounded-3xl" />
          <div className="relative">
            <MockDashboardPreview />
          </div>
        </motion.div>

        {/* Feature highlights below */}
        <motion.div
          className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12 max-w-5xl mx-auto"
          {...scrollRevealProps(staggerContainer, reduced)}
        >
          <motion.div className="text-center" variants={fadeUp}>
            <div className="text-2xl mb-2">⚡</div>
            <h3 className="font-semibold mb-1">Instant Search</h3>
            <p className="text-sm text-default-500">
              Find repos by name or description in milliseconds
            </p>
          </motion.div>
          <motion.div className="text-center" variants={fadeUp}>
            <div className="text-2xl mb-2">🎯</div>
            <h3 className="font-semibold mb-1">Smart Filtering</h3>
            <p className="text-sm text-default-500">
              Filter by type, visibility, and more
            </p>
          </motion.div>
          <motion.div className="text-center" variants={fadeUp}>
            <div className="text-2xl mb-2">✅</div>
            <h3 className="font-semibold mb-1">Bulk Actions</h3>
            <p className="text-sm text-default-500">
              Select multiple repos and act on them at once
            </p>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
