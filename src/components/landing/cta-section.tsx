import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, Github } from "lucide-react";

import {
  fadeUp,
  scaleIn,
  scrollRevealProps,
  staggerContainer,
} from "@/utils/motion";

export function CTASection() {
  const reduced = useReducedMotion();

  return (
    <section className="w-full px-6 py-20">
      <div className="max-w-4xl mx-auto">
        <motion.div
          className="rounded-2xl p-12 md:p-16 text-center bg-gradient-to-br from-[var(--brand-blue)] to-[var(--brand-cyan)] dark:from-[var(--brand-blue)]/90 dark:to-[var(--brand-cyan)]/80 text-white relative overflow-hidden shadow-2xl"
          {...scrollRevealProps(scaleIn, reduced)}
        >
          {/* Decorative blurs */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-white/10 rounded-full blur-3xl" />

          <motion.div
            className="relative z-10"
            {...scrollRevealProps(staggerContainer, reduced)}
          >
            <motion.h2
              className="text-3xl md:text-5xl font-bold mb-6"
              variants={fadeUp}
            >
              Clean up the repos you stopped thinking about months ago.
            </motion.h2>
            <motion.p
              className="text-lg md:text-xl mb-10 text-white/90 max-w-2xl mx-auto"
              variants={fadeUp}
            >
              Archive the keepers. Delete the experiments. Do it from one
              screen, in your browser.
            </motion.p>
            <motion.div
              className="flex flex-col sm:flex-row items-center justify-center gap-4"
              variants={fadeUp}
            >
              <motion.button
                className="inline-flex items-center gap-2 px-8 py-3 rounded-lg bg-white text-[var(--brand-blue)] font-medium text-base hover:bg-white/90 transition-colors"
                onClick={() => {
                  const target = document.getElementById("get-started");
                  target?.scrollIntoView({ behavior: "smooth" });
                }}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.98 }}
              >
                <Github className="h-5 w-5" />
                Start Cleaning Up
                <ArrowRight className="h-4 w-4" />
              </motion.button>
              <motion.a
                className="inline-flex items-center gap-2 px-8 py-3 rounded-lg border border-white/30 text-white font-medium text-base hover:bg-white/10 transition-colors"
                href="https://github.com/moollaza/repo-remover"
                rel="noopener noreferrer"
                target="_blank"
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.98 }}
              >
                View on GitHub
              </motion.a>
            </motion.div>
            <motion.p className="text-sm text-white/70 mt-6" variants={fadeUp}>
              250,000+ repos cleaned up · Trusted by 25,000+ developers
            </motion.p>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
