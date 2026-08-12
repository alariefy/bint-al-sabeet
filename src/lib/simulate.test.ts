import { describe, expect, it } from 'vitest';
import { RULES, calculateRound, checkGameOver, computeTotals } from './scoring';
import { RoundValidationError, validateRound } from './validation';
import { PLAYERS } from './test-helpers';
import type { PlayerId, RoundInput } from './types';

/** Deterministic PRNG so a failing seed always reproduces. */
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const ids = PLAYERS.map((p) => p.id);

function pick(random: () => number): PlayerId {
  return ids[Math.floor(random() * ids.length)]!;
}

function makeValidRound(random: () => number, index: number): RoundInput {
  const hearts: Record<PlayerId, number> = {};
  for (const id of ids) hearts[id] = 0;
  for (let i = 0; i < RULES.HEARTS_TOTAL; i += 1) {
    const id = pick(random);
    hearts[id] = (hearts[id] ?? 0) + 1;
  }

  const queenCaptorId = pick(random);
  const diamondCaptorId = pick(random);

  const outcomes = ids.map((id) => {
    const heartCount = hearts[id] ?? 0;
    const forced = heartCount > 0 || id === queenCaptorId || id === diamondCaptorId;
    /* Harmless tricks are independent of captured points. */
    const harmless = random() < 0.4;
    return { playerId: id, hearts: heartCount, wonAnyTrick: forced || harmless };
  });

  const milsPlayerIds = ids.filter(() => random() < 0.25);

  return {
    id: `sim_${index}`,
    createdAt: 1_700_000_000_000 + index,
    declarations: {
      milsPlayerIds,
      queenDoubled: random() < 0.35,
      diamondDoubled: random() < 0.35,
    },
    outcomes,
    queenCaptorId,
    diamondCaptorId,
  };
}

const SEEDS = [1, 7, 42, 1337, 20260812];

describe('deterministic simulation', () => {
  it('generates thousands of valid rounds that validate and score consistently', () => {
    for (const seed of SEEDS) {
      const random = mulberry32(seed);
      const rounds: RoundInput[] = [];
      let running: Record<PlayerId, number> = Object.fromEntries(ids.map((id) => [id, 0]));

      for (let i = 0; i < 400; i += 1) {
        const round = makeValidRound(random, i);
        const errors = validateRound(PLAYERS, round);
        expect(errors, `seed ${seed} round ${i}`).toEqual([]);

        const calculated = calculateRound(PLAYERS, round);

        /* Every player appears exactly once with a finite integer delta. */
        expect(calculated.results).toHaveLength(RULES.PLAYER_COUNT);
        expect(new Set(calculated.results.map((r) => r.playerId)).size).toBe(RULES.PLAYER_COUNT);
        for (const result of calculated.results) {
          expect(Number.isFinite(result.delta), `seed ${seed} round ${i}`).toBe(true);
          expect(Number.isInteger(result.delta)).toBe(true);
          expect(result.delta).not.toBeNaN();
          expect(result.delta).toBeDefined();
        }

        /* Distributed card points always match the doubling declaration. */
        const expectedPoints =
          RULES.HEARTS_TOTAL +
          (round.declarations.queenDoubled ? RULES.QUEEN_DOUBLED_VALUE : RULES.QUEEN_VALUE) +
          (round.declarations.diamondDoubled ? RULES.DIAMOND_DOUBLED_VALUE : RULES.DIAMOND_VALUE);
        expect(calculated.distributedPoints).toBe(expectedPoints);
        expect([36, 46, 49, 59]).toContain(expectedPoints);

        /* كبوت is all or nothing. */
        if (calculated.isKaboot) {
          const zeros = calculated.results.filter((r) => r.delta === 0);
          const penalties = calculated.results.filter((r) => r.delta === 25);
          expect(zeros).toHaveLength(1);
          expect(penalties).toHaveLength(4);
          expect(zeros[0]!.playerId).toBe(calculated.kabootPlayerId);
        }

        rounds.push(round);
        running = Object.fromEntries(
          ids.map((id) => [id, (running[id] ?? 0) + (calculated.deltas[id] ?? 0)]),
        );

        /* Incremental accumulation always equals a full replay. */
        expect(computeTotals(PLAYERS, rounds), `seed ${seed} round ${i}`).toEqual(running);

        const status = checkGameOver(PLAYERS, running);
        const scores = ids.map((id) => running[id] ?? 0);
        expect(status.isOver).toBe(scores.some((s) => s >= RULES.TARGET_SCORE));
        const lowest = Math.min(...scores);
        expect(status.winnerIds.length).toBeGreaterThanOrEqual(1);
        for (const winnerId of status.winnerIds) {
          expect(running[winnerId]).toBe(lowest);
        }
      }
    }
  });

  it('rejects mutated rounds instead of scoring them', () => {
    const random = mulberry32(99);
    for (let i = 0; i < 200; i += 1) {
      const round = makeValidRound(random, i);
      const mutation = Math.floor(random() * 4);
      const broken: RoundInput = structuredClone(round);

      if (mutation === 0) {
        broken.outcomes[0]!.hearts += 1;
      } else if (mutation === 1) {
        broken.queenCaptorId = 'ghost';
      } else if (mutation === 2) {
        broken.outcomes = broken.outcomes.map((o) => ({ ...o, wonAnyTrick: false }));
      } else {
        broken.outcomes[0]!.hearts = -1;
      }

      expect(validateRound(PLAYERS, broken).length).toBeGreaterThan(0);
      expect(() => calculateRound(PLAYERS, broken)).toThrow(RoundValidationError);
    }
  });

  it('reproduces the same totals for the same seed', () => {
    const build = () => {
      const random = mulberry32(2026);
      const rounds: RoundInput[] = [];
      for (let i = 0; i < 50; i += 1) rounds.push(makeValidRound(random, i));
      return computeTotals(PLAYERS, rounds);
    };
    expect(build()).toEqual(build());
  });
});
