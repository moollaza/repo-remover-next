import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, Crosshair, Link2, X } from "lucide-react";

import { Button } from "@/components/ui/button";

import { REPO_RAIN_POOL, type RepoRainEntry } from "./repo-rain-data";
import {
  BASE_FLIGHT_DURATION,
  MAX_MISSES,
  REPOS_PER_ROUND,
  ROUND_TRANSITION_MS,
  SPAWN_INTERVAL_MS,
  SPEED_MULTIPLIER,
  useGameState,
} from "./use-game-state";
import styles from "./repo-hunt.module.css";

// ── Types ──

interface FlyingCard {
  id: string;
  entry: RepoRainEntry;
  topPercent: number;
  driftY: number;
  rotate: number;
  flipped: boolean;
  hitStyle: "archive" | "delete";
}

interface HitPop {
  id: string;
  x: number;
  y: number;
  points: number;
  action: "Archived" | "Deleted";
}

let nextCardId = 0;

function createFlyingCard(): FlyingCard {
  const entry =
    REPO_RAIN_POOL[Math.floor(Math.random() * REPO_RAIN_POOL.length)];
  const style = Math.random() > 0.5 ? "archive" : "delete";
  return {
    id: `hunt-${nextCardId++}`,
    entry,
    topPercent: 10 + Math.random() * 70,
    driftY: (Math.random() - 0.5) * 40,
    rotate: (Math.random() - 0.5) * 6,
    flipped: Math.random() > 0.5,
    hitStyle: style,
  };
}

// ── Hit animation variants ──

const hitVariants = {
  archive: {
    opacity: 0,
    scale: 0.7,
    y: 50,
    transition: { type: "spring" as const, stiffness: 300, damping: 25 },
  },
  delete: {
    scale: [1, 1.3, 0],
    opacity: [1, 0.8, 0],
    rotate: [0, 8, -4],
    transition: { duration: 0.4 },
  },
};

// ── Share helpers ──

function getShareText(score: number, repos: number, rounds: number) {
  return `I cleaned ${repos} repos in ${rounds} round${rounds > 1 ? "s" : ""} and scored ${score} points in Repo Hunt!\n\nCan you beat my score?`;
}

function shareToTwitter(score: number, repos: number, rounds: number) {
  const text = getShareText(score, repos, rounds);
  const url = window.location.origin;
  window.open(
    `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`,
    "_blank",
    "width=550,height=420",
  );
}

function shareToLinkedIn(url: string) {
  window.open(
    `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
    "_blank",
    "width=550,height=420",
  );
}

function copyShareLink(score: number, repos: number, rounds: number) {
  const text = getShareText(score, repos, rounds);
  const url = window.location.origin;
  return navigator.clipboard.writeText(`${text}\n${url}`).then(
    () => true,
    () => false,
  );
}

// ── Countdown Hook ──

function useCountdown(onComplete: () => void) {
  const [count, setCount] = useState<number | "GO" | null>(3);

  useEffect(() => {
    if (count === null) return;
    if (count === "GO") {
      const id = window.setTimeout(() => {
        setCount(null);
        onComplete();
      }, 500);
      return () => clearTimeout(id);
    }
    const id = window.setTimeout(() => {
      if (count === 1) setCount("GO");
      else setCount(count - 1);
    }, 700);
    return () => clearTimeout(id);
  }, [count, onComplete]);

  const restart = useCallback(() => setCount(3), []);
  return { count, restart };
}

// ── Main Component ──

interface RepoHuntProps {
  onExit: () => void;
}

export default function RepoHunt({ onExit }: RepoHuntProps) {
  const [state, dispatch] = useGameState();
  const [cards, setCards] = useState<FlyingCard[]>([]);
  const [hitPops, setHitPops] = useState<HitPop[]>([]);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [copied, setCopied] = useState(false);
  const spawnedRef = useRef(0);
  const hitCountRef = useRef(0);
  const intervalsRef = useRef<Set<number>>(new Set());
  const arenaRef = useRef<HTMLDivElement>(null);

  const startGame = useCallback(() => {
    dispatch({ type: "START" });
  }, [dispatch]);

  const { count: countdown, restart: restartCountdown } =
    useCountdown(startGame);

  const flightDuration =
    BASE_FLIGHT_DURATION * Math.pow(SPEED_MULTIPLIER, state.round - 1);
  const spawnInterval =
    SPAWN_INTERVAL_MS * Math.pow(SPEED_MULTIPLIER, state.round - 1);

  // Spawn cards at interval during play
  useEffect(() => {
    if (state.phase !== "playing") return;

    spawnedRef.current = 0;
    setCards([]);

    const id = window.setInterval(() => {
      if (spawnedRef.current >= REPOS_PER_ROUND) {
        clearInterval(id);
        intervalsRef.current.delete(id);
        return;
      }
      spawnedRef.current++;
      setCards((prev) => [...prev, createFlyingCard()]);
    }, spawnInterval);

    intervalsRef.current.add(id);
    return () => {
      clearInterval(id);
      intervalsRef.current.delete(id);
    };
  }, [state.phase, state.round, spawnInterval]);

  // Round transition: show countdown then advance
  useEffect(() => {
    if (state.phase !== "round-transition") return;
    setCards([]);
    const id = window.setTimeout(() => {
      dispatch({ type: "NEXT_ROUND" });
    }, ROUND_TRANSITION_MS);
    return () => clearTimeout(id);
  }, [state.phase, dispatch]);

  // Cleanup intervals on unmount
  useEffect(() => {
    return () => {
      intervalsRef.current.forEach((id) => clearInterval(id));
    };
  }, []);

  // Escape key handler
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        dispatch({ type: "EXIT" });
        onExit();
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [dispatch, onExit]);

  // Clean up hit pops after animation
  useEffect(() => {
    if (hitPops.length === 0) return;
    const id = window.setTimeout(() => {
      setHitPops((prev) => prev.slice(1));
    }, 800);
    return () => clearTimeout(id);
  }, [hitPops.length]);

  const handleHit = useCallback(
    (card: FlyingCard, e: React.MouseEvent) => {
      hitCountRef.current++;
      setCards((prev) => prev.filter((c) => c.id !== card.id));
      dispatch({ type: "HIT" });

      const rect = arenaRef.current?.getBoundingClientRect();
      if (rect) {
        setHitPops((prev) => [
          ...prev,
          {
            id: `pop-${hitCountRef.current}`,
            x: e.clientX - rect.left,
            y: e.clientY - rect.top,
            points: state.round * 10,
            action: card.hitStyle === "archive" ? "Archived" : "Deleted",
          },
        ]);
      }
    },
    [dispatch, state.round],
  );

  const handleMiss = useCallback(
    (cardId: string) => {
      setCards((prev) => prev.filter((c) => c.id !== cardId));
      dispatch({ type: "MISS" });
    },
    [dispatch],
  );

  const handleExit = useCallback(() => {
    dispatch({ type: "EXIT" });
    onExit();
  }, [dispatch, onExit]);

  const handlePlayAgain = useCallback(() => {
    setShowShareMenu(false);
    setCopied(false);
    restartCountdown();
  }, [restartCountdown]);

  return (
    <div
      ref={arenaRef}
      className={`fixed inset-0 z-[100] flex flex-col bg-background ${styles.crosshairCursor}`}
      aria-hidden="true"
      role="presentation"
      data-testid="repo-hunt-arena"
    >
      {/* Initial countdown overlay */}
      <AnimatePresence>
        {countdown !== null && state.phase === "idle" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-40 flex flex-col items-center justify-center bg-background"
          >
            <Crosshair className="mx-auto h-10 w-10 text-default-300 mb-6" />
            <h2 className="text-center font-mono text-3xl font-bold tracking-wider text-default-400 mb-8">
              REPO HUNT
            </h2>
            <AnimatePresence mode="wait">
              <motion.span
                key={String(countdown)}
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 1.5, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className={`font-mono font-bold ${
                  countdown === "GO"
                    ? "text-5xl text-success"
                    : "text-7xl text-foreground"
                }`}
              >
                {countdown === "GO" ? "GO!" : countdown}
              </motion.span>
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Round transition banner */}
      <AnimatePresence>
        {state.phase === "round-transition" && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.05 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
            className={`absolute inset-0 z-40 flex flex-col items-center justify-center bg-background/80 ${styles.arena}`}
          >
            <p className="font-mono text-5xl font-bold text-foreground">
              ROUND {state.round + 1}
            </p>
            <p className="mt-3 text-lg text-default-500">Get ready...</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* HUD - visible during play and round transition */}
      {(state.phase === "playing" || state.phase === "round-transition") && (
        <div className="flex items-center justify-between px-6 py-4 font-mono text-sm">
          <span className="text-lg text-default-500">
            SCORE: {String(state.score).padStart(3, "0")}
          </span>
          <span className="text-lg font-semibold text-foreground">
            ROUND {state.round}
          </span>
          <div className="flex items-center gap-3">
            {Array.from({ length: MAX_MISSES }, (_, i) => (
              <span
                key={i}
                className={`h-3 w-3 rounded-full transition-colors ${
                  i < state.misses ? "bg-danger" : "bg-default-300"
                }`}
              />
            ))}
            <button
              onClick={handleExit}
              className="ml-4 cursor-pointer rounded-lg p-2 text-default-400 hover:bg-default-100 hover:text-foreground transition-colors"
              aria-label="Exit game"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
      )}

      {/* Game arena with pixel dot grid */}
      <div className={`relative flex-1 overflow-hidden ${styles.arena}`}>
        {/* Flying cards */}
        {state.phase === "playing" && (
          <AnimatePresence>
            {cards.map((card) => (
              <motion.div
                key={card.id}
                className={`${styles.flyingCard} ${card.flipped ? styles.flipped : ""}`}
                style={
                  {
                    top: `${card.topPercent}%`,
                    "--flight-duration": `${flightDuration}s`,
                    "--drift-y": `${card.driftY}px`,
                    "--rotate": `${card.rotate}deg`,
                  } as React.CSSProperties
                }
                exit={hitVariants[card.hitStyle]}
                onClick={(e) => handleHit(card, e)}
                onAnimationEnd={() => handleMiss(card.id)}
              >
                <div
                  className={`${styles.cardInner} w-48 rounded-lg bg-card px-3 py-2.5 ring-1 ring-foreground/10 shadow-lg`}
                >
                  <p className="truncate text-sm font-medium text-foreground">
                    {card.entry.name}
                  </p>
                  <div className="mt-1 flex items-center gap-2 text-xs text-default-400">
                    {card.entry.language && (
                      <span className="flex items-center gap-1">
                        <span
                          className={`inline-block h-2 w-2 rounded-full ${card.entry.languageColor}`}
                        />
                        {card.entry.language}
                      </span>
                    )}
                    <span>{card.entry.lastCommit}</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        )}

        {/* Hit popups */}
        {hitPops.map((pop) => (
          <span
            key={pop.id}
            className={`${styles.scorePop} ${
              pop.action === "Archived" ? "text-warning" : "text-danger"
            }`}
            style={{ left: pop.x, top: pop.y }}
          >
            {pop.action}! +{pop.points}
          </span>
        ))}
      </div>

      {/* Game Over */}
      {state.phase === "game-over" && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className={`absolute inset-0 z-30 flex flex-col items-center justify-center bg-background/95 ${styles.arena}`}
        >
          <motion.div
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="text-center"
          >
            <p className="font-mono text-6xl font-bold text-foreground">
              {state.score}
            </p>
            <p className="mt-4 text-xl text-default-500">
              You cleaned{" "}
              <span className="font-semibold text-foreground">
                {state.totalCleaned} repos
              </span>{" "}
              in {state.round} round{state.round > 1 ? "s" : ""}!
            </p>
            <p className="mt-2 text-default-400">
              Now clean your <em>real</em> ones.
            </p>

            <div className="mt-10 flex flex-wrap justify-center gap-3">
              <Button size="lg" onClick={handlePlayAgain}>
                Play Again
              </Button>
              <div className="relative">
                <Button
                  size="lg"
                  variant="outline"
                  onClick={() => setShowShareMenu((v) => !v)}
                >
                  Share
                </Button>
                {/* Share popup */}
                <AnimatePresence>
                  {showShareMenu && (
                    <motion.div
                      initial={{ opacity: 0, y: 8, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 8, scale: 0.95 }}
                      transition={{ duration: 0.15 }}
                      className="absolute bottom-full left-1/2 mb-2 -translate-x-1/2 rounded-lg bg-card p-2 shadow-xl ring-1 ring-foreground/10"
                    >
                      <div className="flex gap-1">
                        <button
                          onClick={() =>
                            shareToTwitter(
                              state.score,
                              state.totalCleaned,
                              state.round,
                            )
                          }
                          className="cursor-pointer rounded-md px-3 py-2 text-sm font-medium text-foreground hover:bg-default-100 transition-colors whitespace-nowrap"
                        >
                          X / Twitter
                        </button>
                        <button
                          onClick={() =>
                            shareToLinkedIn(window.location.origin)
                          }
                          className="cursor-pointer rounded-md px-3 py-2 text-sm font-medium text-foreground hover:bg-default-100 transition-colors whitespace-nowrap"
                        >
                          LinkedIn
                        </button>
                        <button
                          onClick={() => {
                            void copyShareLink(
                              state.score,
                              state.totalCleaned,
                              state.round,
                            ).then(() => {
                              setCopied(true);
                              setTimeout(() => setCopied(false), 2000);
                            });
                          }}
                          className="cursor-pointer rounded-md px-3 py-2 text-sm font-medium text-foreground hover:bg-default-100 transition-colors whitespace-nowrap flex items-center gap-1.5"
                        >
                          {copied ? (
                            <>
                              <Check className="h-3.5 w-3.5 text-success" />
                              Copied!
                            </>
                          ) : (
                            <>
                              <Link2 className="h-3.5 w-3.5" />
                              Copy Link
                            </>
                          )}
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              <Button
                size="lg"
                variant="outline"
                onClick={() => {
                  handleExit();
                  setTimeout(() => {
                    document
                      .getElementById("get-started")
                      ?.scrollIntoView({ behavior: "smooth" });
                  }, 100);
                }}
              >
                Get Started
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}
