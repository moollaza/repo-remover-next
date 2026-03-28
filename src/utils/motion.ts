/**
 * Shared animation variants and utilities for framer-motion.
 *
 * All variants respect prefers-reduced-motion via MotionConfig
 * reducedMotion="user" set in src/app.tsx.
 */
import type { Variants } from "framer-motion";

const EASE = [0.25, 0.1, 0.25, 1] as const;

/** Fade-in + slide-up (hero, section headings) */
export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: EASE },
  },
};

/** Staggered container — wraps children with stagger delay */
export const staggerContainer: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.12,
    },
  },
};

/** Wider stagger for larger groups (e.g. feature sections) */
export const staggerContainerWide: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.18,
    },
  },
};

/** Fade-in only (no translate — for cards, smaller elements) */
export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: 0.5, ease: EASE },
  },
};

/** Scale-in (CTA card, product showcase) */
export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.96 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.6, ease: EASE },
  },
};

/** Default viewport trigger options for whileInView */
export const viewportOnce = { once: true, margin: "-80px" as const };
