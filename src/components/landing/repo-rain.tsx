import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence } from "framer-motion";

import { RepoRainCard, type DismissStyle } from "./repo-rain-card";
import { REPO_RAIN_POOL, type RepoRainEntry } from "./repo-rain-data";
import styles from "./repo-rain.module.css";

const TARGET_COUNT = 10;
const DISMISS_STYLES: DismissStyle[] = ["shrink", "sweep"];

interface CardSlot {
  id: string;
  entry: RepoRainEntry;
  left: number;
  duration: number;
  delay: number;
  driftX: number;
  driftRotate: number;
}

let nextId = 0;

function pickRandomEntry(exclude: Set<string>): RepoRainEntry {
  const available = REPO_RAIN_POOL.filter((e) => !exclude.has(e.name));
  const pool = available.length > 0 ? available : REPO_RAIN_POOL;
  return pool[Math.floor(Math.random() * pool.length)];
}

function createCard(
  activeNames: Set<string>,
  delayOverride?: number,
): CardSlot {
  const id = `rain-${nextId++}`;
  return {
    id,
    entry: pickRandomEntry(activeNames),
    left: 5 + Math.random() * 85,
    duration: 25 + Math.random() * 15,
    delay: delayOverride ?? Math.random() * 8,
    driftX: (Math.random() - 0.5) * 60,
    driftRotate: (Math.random() - 0.5) * 4,
  };
}

function generateInitialCards(): CardSlot[] {
  const cards: CardSlot[] = [];
  const names = new Set<string>();
  for (let i = 0; i < TARGET_COUNT; i++) {
    const card = createCard(names, (i / TARGET_COUNT) * 10);
    cards.push(card);
    names.add(card.entry.name);
  }
  return cards;
}

export default function RepoRain() {
  const [cards, setCards] = useState<CardSlot[]>(generateInitialCards);
  const dismissCountRef = useRef(0);
  const timeoutsRef = useRef<Set<number>>(new Set());

  const scheduleRespawn = useCallback((delay: number) => {
    const id = window.setTimeout(() => {
      timeoutsRef.current.delete(id);
      setCards((prev) => {
        if (prev.length >= TARGET_COUNT) return prev;
        const names = new Set(prev.map((c) => c.entry.name));
        return [...prev, createCard(names, 0)];
      });
    }, delay);
    timeoutsRef.current.add(id);
  }, []);

  // Recycle cards when below target count
  useEffect(() => {
    if (cards.length >= TARGET_COUNT) return;
    scheduleRespawn(2000 + Math.random() * 2000);
  }, [cards.length, scheduleRespawn]);

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      timeoutsRef.current.forEach((id) => clearTimeout(id));
    };
  }, []);

  const handleDismiss = useCallback((cardId: string) => {
    dismissCountRef.current++;
    setCards((prev) => prev.filter((c) => c.id !== cardId));
  }, []);

  const handleAnimationIteration = useCallback((cardId: string) => {
    setCards((prev) => prev.filter((c) => c.id !== cardId));
  }, []);

  return (
    <div
      className={styles.container}
      aria-hidden="true"
      role="presentation"
      data-testid="repo-rain-container"
    >
      <AnimatePresence>
        {cards.map((card) => (
          <div
            key={card.id}
            className={styles.card}
            style={
              {
                left: `${card.left}%`,
                "--duration": `${card.duration}s`,
                "--delay": `${card.delay}s`,
                "--drift-x": `${card.driftX}px`,
                "--drift-rotate": `${card.driftRotate}deg`,
              } as React.CSSProperties
            }
            onAnimationIteration={() => handleAnimationIteration(card.id)}
          >
            <RepoRainCard
              entry={card.entry}
              dismissStyle={
                DISMISS_STYLES[dismissCountRef.current % DISMISS_STYLES.length]
              }
              onDismiss={() => handleDismiss(card.id)}
            />
          </div>
        ))}
      </AnimatePresence>
    </div>
  );
}
