import { useReducer } from "react";

// ── Constants ──

export const REPOS_PER_ROUND = 10;
export const MAX_MISSES = 4;
export const BASE_FLIGHT_DURATION = 5; // seconds — slow enough to click comfortably in round 1
export const SPEED_MULTIPLIER = 0.88; // gentler speed ramp between rounds
export const LURE_INTERVAL_MS = 10_000;
export const LURE_FLIGHT_DURATION = 4;
export const SPAWN_INTERVAL_MS = 1400; // ms between card spawns — gives breathing room

// ── Types ──

export type GamePhase = "idle" | "playing" | "game-over";

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
        const resolved = state.resolvedThisRound + 1;
        const nextState = {
          ...state,
          score: state.score + state.round * 10,
          totalCleaned: state.totalCleaned + 1,
          resolvedThisRound: resolved,
        };
        // Advance round when all cards resolved
        if (resolved >= REPOS_PER_ROUND) {
          return {
            ...nextState,
            round: state.round + 1,
            misses: 0,
            resolvedThisRound: 0,
          };
        }
        return nextState;
      }
      if (action.type === "MISS") {
        const misses = state.misses + 1;
        const resolved = state.resolvedThisRound + 1;
        if (misses >= MAX_MISSES) {
          return {
            ...state,
            misses,
            resolvedThisRound: resolved,
            phase: "game-over",
          };
        }
        // Advance round when all cards resolved (even with misses)
        if (resolved >= REPOS_PER_ROUND) {
          return {
            ...state,
            misses: 0,
            resolvedThisRound: 0,
            round: state.round + 1,
          };
        }
        return { ...state, misses, resolvedThisRound: resolved };
      }
      if (action.type === "EXIT") {
        return initialState;
      }
      return state;
    }

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
