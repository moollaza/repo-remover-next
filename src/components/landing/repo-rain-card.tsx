import { motion } from "framer-motion";
import { Star } from "lucide-react";

import { type RepoRainEntry } from "./repo-rain-data";

const dismissVariants = {
  shrink: {
    scale: 0,
    opacity: 0,
    rotate: -8,
    transition: {
      type: "spring" as const,
      stiffness: 400,
      damping: 35,
      mass: 0.8,
    },
  },
  sweep: {
    x: 300,
    opacity: 0,
    rotate: 5,
    transition: { type: "spring" as const, stiffness: 300, damping: 30 },
  },
};

type DismissStyle = keyof typeof dismissVariants;

interface RepoRainCardProps {
  entry: RepoRainEntry;
  dismissStyle: DismissStyle;
  onDismiss: () => void;
}

export function RepoRainCard({
  entry,
  dismissStyle,
  onDismiss,
}: RepoRainCardProps) {
  return (
    <motion.div
      layout={false}
      exit={dismissVariants[dismissStyle]}
      className="w-48 rounded-lg bg-card/60 px-3 py-2 ring-1 ring-foreground/5"
      onClick={onDismiss}
      role="presentation"
    >
      <p className="truncate text-sm text-default-500">{entry.name}</p>
      <div className="mt-1 flex items-center gap-2 text-xs text-default-400">
        {entry.language && (
          <span className="flex items-center gap-1">
            <span
              className={`inline-block h-2 w-2 rounded-full ${entry.languageColor}`}
            />
            {entry.language}
          </span>
        )}
        <span className="flex items-center gap-0.5">
          <Star className="h-3 w-3" />
          {entry.stars}
        </span>
      </div>
      <p className="mt-0.5 text-xs text-default-400">{entry.lastCommit}</p>
    </motion.div>
  );
}

export type { DismissStyle };
