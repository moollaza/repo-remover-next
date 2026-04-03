import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";

import { Button } from "@/components/ui/button";

import { REPO_RAIN_POOL, type RepoRainEntry } from "./repo-rain-data";
import {
  BASE_FLIGHT_DURATION,
  MAX_MISSES,
  REPOS_PER_ROUND,
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

let nextCardId = 0;

function createFlyingCard(): FlyingCard {
  const entry =
    REPO_RAIN_POOL[Math.floor(Math.random() * REPO_RAIN_POOL.length)];
  return {
    id: `hunt-${nextCardId++}`,
    entry,
    topPercent: 10 + Math.random() * 75,
    driftY: (Math.random() - 0.5) * 40,
    rotate: (Math.random() - 0.5) * 6,
    flipped: Math.random() > 0.5,
    hitStyle: nextCardId % 2 === 0 ? "archive" : "delete",
  };
}

// ── Hit animation variants ──

const hitVariants = {
  archive: {
    opacity: 0,
    scale: 0.8,
    y: 40,
    transition: { duration: 0.3 },
  },
  delete: {
    scale: [1, 1.2, 0],
    opacity: [1, 1, 0],
    transition: { duration: 0.35 },
  },
};

// ── Main Component ──

interface RepoHuntProps {
  onExit: () => void;
}

export default function RepoHunt({ onExit }: RepoHuntProps) {
  const [state, dispatch] = useGameState();
  const [cards, setCards] = useState<FlyingCard[]>([]);
  const spawnedRef = useRef(0);
  const hitCountRef = useRef(0);
  const intervalsRef = useRef<Set<number>>(new Set());

  const flightDuration =
    BASE_FLIGHT_DURATION * Math.pow(SPEED_MULTIPLIER, state.round - 1);
  const spawnInterval =
    SPAWN_INTERVAL_MS * Math.pow(SPEED_MULTIPLIER, state.round - 1);

  // Start game immediately on mount
  const startedRef = useRef(false);
  if (!startedRef.current && state.phase === "idle") {
    startedRef.current = true;
    dispatch({ type: "START" });
  }

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

  const handleHit = useCallback(
    (cardId: string) => {
      hitCountRef.current++;
      setCards((prev) => prev.filter((c) => c.id !== cardId));
      dispatch({ type: "HIT" });
    },
    [dispatch],
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

  return (
    <div
      className="relative min-h-[400px] md:min-h-[500px] cursor-crosshair"
      aria-hidden="true"
      role="presentation"
      data-testid="repo-hunt-arena"
    >
      {/* HUD */}
      {state.phase === "playing" && (
        <div className="absolute inset-x-0 top-0 z-20 flex items-center justify-between px-4 py-3 font-mono text-sm">
          <span className="text-default-500">
            SCORE: {String(state.score).padStart(3, "0")}
          </span>
          <span className="font-semibold text-foreground">
            ROUND {state.round}
          </span>
          <div className="flex items-center gap-2">
            {Array.from({ length: MAX_MISSES }, (_, i) => (
              <span
                key={i}
                className={`h-2.5 w-2.5 rounded-full transition-colors ${
                  i < state.misses ? "bg-danger" : "bg-default-300"
                }`}
              />
            ))}
            <button
              onClick={handleExit}
              className="ml-3 rounded p-1 text-default-400 hover:bg-default-100 hover:text-foreground transition-colors"
              aria-label="Exit game"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

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
              onClick={() => handleHit(card.id)}
              onAnimationEnd={() => handleMiss(card.id)}
            >
              <div className="w-44 rounded-lg bg-card/80 px-3 py-2 ring-1 ring-foreground/10 shadow-sm">
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

      {/* Game Over */}
      {state.phase === "game-over" && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-background/90"
        >
          <p className="font-mono text-5xl font-bold text-foreground">
            {state.score}
          </p>
          <p className="mt-3 text-lg text-default-500">
            You cleaned{" "}
            <span className="font-semibold text-foreground">
              {state.totalCleaned} repos
            </span>{" "}
            in {state.round} round{state.round > 1 ? "s" : ""}!
          </p>
          <p className="mt-1 text-sm text-default-400">
            Now clean your <em>real</em> ones.
          </p>
          <div className="mt-8 flex gap-3">
            <Button onClick={() => dispatch({ type: "START" })}>
              Play Again
            </Button>
            <Button
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
      )}
    </div>
  );
}
