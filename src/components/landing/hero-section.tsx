import {
  lazy,
  Suspense,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, Github } from "lucide-react";

import { useMediaQuery } from "@/hooks/use-media-query";
import { fadeUp, staggerContainer } from "@/utils/motion";

import { REPO_RAIN_POOL } from "./repo-rain-data";
import { LURE_FLIGHT_DURATION, LURE_INTERVAL_MS } from "./use-game-state";
import styles from "./repo-hunt.module.css";

const RepoHunt = lazy(() => import("./repo-hunt"));

export function HeroSection() {
  const [gameActive, setGameActive] = useState(false);
  const prefersReduced = useReducedMotion();
  const isMobile = useMediaQuery("(max-width: 767px)");
  const showLure = !prefersReduced && !isMobile && !gameActive;

  return (
    <section className="relative w-full overflow-hidden px-6 py-20 md:py-28">
      {gameActive ? (
        <Suspense fallback={null}>
          <RepoHunt onExit={() => setGameActive(false)} />
        </Suspense>
      ) : (
        <HeroContent />
      )}
      {showLure && (
        <LureCard
          onActivate={() => setGameActive(true)}
          onHover={() => {
            // Prefetch game chunk on hover for zero-delay activation
            import("./repo-hunt");
          }}
        />
      )}
    </section>
  );
}

// ── Hero Content (extracted for conditional render) ──

function HeroContent() {
  return (
    <motion.div
      animate="visible"
      className="max-w-5xl mx-auto text-center"
      initial="hidden"
      variants={staggerContainer}
    >
      <motion.div
        className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-default-100 border border-divider mb-8"
        variants={fadeUp}
      >
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--brand-blue)] opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-[var(--brand-blue)]" />
        </span>
        <span className="text-sm text-default-500">
          250,000+ repos managed and counting
        </span>
      </motion.div>

      <motion.h1
        className="text-4xl md:text-6xl font-bold mb-6 leading-tight"
        variants={fadeUp}
      >
        Archive or Delete Multiple GitHub Repos,{" "}
        <span className="bg-gradient-to-r from-[var(--brand-blue)] to-[var(--brand-cyan)] bg-clip-text text-transparent">
          Instantly
        </span>
      </motion.h1>

      <motion.p
        className="text-lg md:text-xl text-default-500 mb-10 max-w-2xl mx-auto leading-relaxed"
        variants={fadeUp}
      >
        Search, filter, and bulk-manage hundreds of repositories in one place.
        Zero-knowledge — your token never leaves your browser.
      </motion.p>

      <motion.div
        className="flex flex-col sm:flex-row items-center justify-center gap-4"
        variants={fadeUp}
      >
        <motion.button
          className="inline-flex items-center gap-2 px-8 py-3.5 rounded-lg bg-[var(--brand-blue)] text-white font-medium text-base hover:opacity-90 transition-opacity shadow-sm"
          onClick={() => {
            const target = document.getElementById("get-started");
            target?.scrollIntoView({ behavior: "smooth" });
          }}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.98 }}
        >
          Get Started
          <ArrowRight className="h-4 w-4" />
        </motion.button>
        <motion.a
          className="inline-flex items-center gap-2 px-8 py-3.5 rounded-lg border border-divider text-foreground font-medium text-base hover:bg-default-100 transition-colors"
          href="https://github.com/moollaza/repo-remover"
          rel="noopener noreferrer"
          target="_blank"
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.98 }}
        >
          <Github className="h-5 w-5" />
          View on GitHub
        </motion.a>
      </motion.div>

      <motion.div
        className="mt-8 flex items-center justify-center gap-4 text-sm text-default-600"
        variants={fadeUp}
      >
        <span>Free forever</span>
        <span className="w-1 h-1 rounded-full bg-default-300" />
        <span>100% in-browser</span>
        <span className="w-1 h-1 rounded-full bg-default-300" />
        <span>Your token never leaves your device</span>
      </motion.div>
    </motion.div>
  );
}

// ── Lure Card ──

interface LureCardProps {
  onActivate: () => void;
  onHover: () => void;
}

function LureCard({ onActivate, onHover }: LureCardProps) {
  const [visible, setVisible] = useState(false);
  const [entry, setEntry] = useState(
    () => REPO_RAIN_POOL[Math.floor(Math.random() * REPO_RAIN_POOL.length)],
  );
  const intervalRef = useRef<number | null>(null);

  const showLure = useCallback(() => {
    setEntry(REPO_RAIN_POOL[Math.floor(Math.random() * REPO_RAIN_POOL.length)]);
    setVisible(true);
    // Hide after flight completes
    const hideId = window.setTimeout(() => {
      setVisible(false);
    }, LURE_FLIGHT_DURATION * 1000);
    return hideId;
  }, []);

  useEffect(() => {
    // Show first lure after a short delay
    const initialDelay = window.setTimeout(() => {
      showLure();
      // Then repeat
      intervalRef.current = window.setInterval(() => {
        showLure();
      }, LURE_INTERVAL_MS);
    }, 3000);

    return () => {
      clearTimeout(initialDelay);
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [showLure]);

  if (!visible) return null;

  return (
    <div
      className={styles.lureCard}
      style={{ top: "30%", left: 0 }}
      onClick={onActivate}
      onMouseEnter={onHover}
      role="presentation"
      aria-hidden="true"
    >
      <div className="w-44 rounded-lg bg-card/80 px-3 py-2 ring-1 ring-foreground/10 shadow-md">
        <p className="truncate text-sm font-medium text-foreground">
          {entry.name}
        </p>
        <div className="mt-1 flex items-center gap-2 text-xs text-default-400">
          {entry.language && (
            <span className="flex items-center gap-1">
              <span
                className={`inline-block h-2 w-2 rounded-full ${entry.languageColor}`}
              />
              {entry.language}
            </span>
          )}
          <span>{entry.lastCommit}</span>
        </div>
      </div>
    </div>
  );
}
