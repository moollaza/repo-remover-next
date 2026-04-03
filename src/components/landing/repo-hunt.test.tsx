import { describe, expect, test } from "vitest";

import {
  gameReducer,
  MAX_MISSES,
  REPOS_PER_ROUND,
  type GameState,
} from "./use-game-state";

const initialState: GameState = {
  phase: "idle",
  score: 0,
  round: 1,
  misses: 0,
  resolvedThisRound: 0,
  totalCleaned: 0,
};

describe("gameReducer", () => {
  test("START from idle transitions to playing", () => {
    const state = gameReducer(initialState, { type: "START" });
    expect(state.phase).toBe("playing");
    expect(state.score).toBe(0);
    expect(state.round).toBe(1);
  });

  test("HIT increments score and totalCleaned", () => {
    const playing: GameState = { ...initialState, phase: "playing" };
    const state = gameReducer(playing, { type: "HIT" });
    expect(state.score).toBe(10);
    expect(state.totalCleaned).toBe(1);
    expect(state.resolvedThisRound).toBe(1);
  });

  test("HIT in round 3 gives 30 points", () => {
    const playing: GameState = { ...initialState, phase: "playing", round: 3 };
    const state = gameReducer(playing, { type: "HIT" });
    expect(state.score).toBe(30);
  });

  test("MISS increments misses", () => {
    const playing: GameState = { ...initialState, phase: "playing" };
    const state = gameReducer(playing, { type: "MISS" });
    expect(state.misses).toBe(1);
    expect(state.phase).toBe("playing");
  });

  test("4th MISS triggers game-over", () => {
    const playing: GameState = {
      ...initialState,
      phase: "playing",
      misses: MAX_MISSES - 1,
    };
    const state = gameReducer(playing, { type: "MISS" });
    expect(state.misses).toBe(MAX_MISSES);
    expect(state.phase).toBe("game-over");
  });

  test("resolving all cards does NOT auto-transition (waits for ADVANCE_ROUND)", () => {
    const playing: GameState = {
      ...initialState,
      phase: "playing",
      resolvedThisRound: REPOS_PER_ROUND - 1,
    };
    const state = gameReducer(playing, { type: "HIT" });
    expect(state.phase).toBe("playing");
    expect(state.resolvedThisRound).toBe(REPOS_PER_ROUND);
  });

  test("ADVANCE_ROUND from playing transitions to round-transition", () => {
    const playing: GameState = {
      ...initialState,
      phase: "playing",
      resolvedThisRound: REPOS_PER_ROUND,
    };
    const state = gameReducer(playing, { type: "ADVANCE_ROUND" });
    expect(state.phase).toBe("round-transition");
  });

  test("NEXT_ROUND from round-transition advances round and resets", () => {
    const transition: GameState = {
      ...initialState,
      phase: "round-transition",
      round: 1,
      misses: 2,
      resolvedThisRound: REPOS_PER_ROUND,
      score: 80,
    };
    const state = gameReducer(transition, { type: "NEXT_ROUND" });
    expect(state.phase).toBe("playing");
    expect(state.round).toBe(2);
    expect(state.misses).toBe(0);
    expect(state.resolvedThisRound).toBe(0);
    expect(state.score).toBe(80); // score preserved
  });

  test("EXIT from playing returns to idle", () => {
    const playing: GameState = {
      ...initialState,
      phase: "playing",
      score: 50,
    };
    const state = gameReducer(playing, { type: "EXIT" });
    expect(state.phase).toBe("idle");
    expect(state.score).toBe(0);
  });

  test("START from game-over resets and starts playing", () => {
    const gameOver: GameState = {
      ...initialState,
      phase: "game-over",
      score: 100,
      round: 3,
    };
    const state = gameReducer(gameOver, { type: "START" });
    expect(state.phase).toBe("playing");
    expect(state.score).toBe(0);
    expect(state.round).toBe(1);
  });

  test("EXIT from game-over returns to idle", () => {
    const gameOver: GameState = { ...initialState, phase: "game-over" };
    const state = gameReducer(gameOver, { type: "EXIT" });
    expect(state.phase).toBe("idle");
  });

  test("invalid actions in idle are ignored", () => {
    const state = gameReducer(initialState, { type: "HIT" });
    expect(state).toBe(initialState);
  });

  test("invalid actions in game-over are ignored", () => {
    const gameOver: GameState = { ...initialState, phase: "game-over" };
    const state = gameReducer(gameOver, { type: "HIT" });
    expect(state).toBe(gameOver);
  });
});
