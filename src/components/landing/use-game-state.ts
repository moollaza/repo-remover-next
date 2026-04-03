import { useReducer } from "react";

// ── Constants ──

export const REPOS_PER_ROUND = 10;
export const MAX_MISSES = 4;
export const BASE_FLIGHT_DURATION = 6; // seconds — very comfortable in round 1
export const SPEED_MULTIPLIER = 0.86; // ~14% faster each round
export const LURE_INTERVAL_MS = 10_000;
export const LURE_FLIGHT_DURATION = 4;
export const SPAWN_INTERVAL_MS = 1800; // ms between spawns — leisurely in round 1
export const ROUND_TRANSITION_MS = 2000;

// ── Types ──

export type GamePhase = "idle" | "playing" | "round-transition" | "game-over";

export interface GameState {
  phase: GamePhase;
  score: number;
  round: number;
  misses: number;
  resolvedThisRound: number;
  totalCleaned: number;
}

export type GameAction =
  | { type: "START" }
  | { type: "HIT" }
  | { type: "MISS" }
  | { type: "ADVANCE_ROUND" }
  | { type: "NEXT_ROUND" }
  | { type: "EXIT" };

// ── Reducer ──

const initialState: GameState = {
  phase: "idle",
  score: 0,
  round: 1,
  misses: 0,
  resolvedThisRound: 0,
  totalCleaned: 0,
};

export function gameReducer(state: GameState, action: GameAction): GameState {
  switch (state.phase) {
    case "idle":
      if (action.type === "START") {
        return { ...initialState, phase: "playing" };
      }
      return state;

    case "playing": {
      if (action.type === "HIT") {
        return {
          ...state,
          score: state.score + state.round * 10,
          totalCleaned: state.totalCleaned + 1,
          resolvedThisRound: state.resolvedThisRound + 1,
        };
      }
      if (action.type === "MISS") {
        const misses = state.misses + 1;
        if (misses >= MAX_MISSES) {
          return {
            ...state,
            misses,
            resolvedThisRound: state.resolvedThisRound + 1,
            phase: "game-over",
          };
        }
        return {
          ...state,
          misses,
          resolvedThisRound: state.resolvedThisRound + 1,
        };
      }
      // Dispatched by component when all cards are off screen
      if (action.type === "ADVANCE_ROUND") {
        return { ...state, phase: "round-transition" };
      }
      if (action.type === "EXIT") {
        return initialState;
      }
      return state;
    }

    case "round-transition":
      if (action.type === "NEXT_ROUND") {
        return {
          ...state,
          phase: "playing",
          round: state.round + 1,
          misses: 0,
          resolvedThisRound: 0,
        };
      }
      if (action.type === "EXIT") {
        return initialState;
      }
      return state;

    case "game-over":
      if (action.type === "START") {
        return { ...initialState, phase: "playing" };
      }
      if (action.type === "EXIT") {
        return initialState;
      }
      return state;

    default:
      return state;
  }
}

export function useGameState() {
  return useReducer(gameReducer, initialState);
}
