import { describe, expect, it } from 'vitest';
import {
  RULES,
  calculateRound,
  checkGameOver,
  computeTotals,
  expectedDistributedPoints,
  findKabootPlayerId,
} from './scoring';
import { RoundValidationError, validateRound } from './validation';
import { P1, P2, P3, P4, P5, PLAYERS, deltaOf, makeRound } from './test-helpers';
import type { RoundInput } from './types';

function deltas(round: RoundInput) {
  return calculateRound(PLAYERS, round).deltas;
}

describe('players without ميلس', () => {
  it('scores -5 for a player who won no trick and captured nothing', () => {
    const round = makeRound({ hearts: { [P1]: 13 }, queen: P1, diamond: P1 });
    /* P1 takes everything: كبوت. Use a spread instead so P5 stays clean. */
    const spread = makeRound({ hearts: { [P1]: 7, [P2]: 6 }, queen: P3, diamond: P4 });
    expect(deltaOf(deltas(spread), P5)).toBe(-5);
    expect(calculateRound(PLAYERS, round).isKaboot).toBe(true);
  });

  it('scores 0 for a harmless trick with no scoring cards', () => {
    const round = makeRound({
      hearts: { [P1]: 7, [P2]: 6 },
      queen: P3,
      diamond: P4,
      tricks: [P5],
    });
    const result = deltas(round);
    expect(deltaOf(result, P5)).toBe(0);
  });

  it('never infers wonAnyTrick from captured points being zero', () => {
    const round = makeRound({
      hearts: { [P1]: 13 },
      queen: P2,
      diamond: P3,
      tricks: [P4],
    });
    const calculated = calculateRound(PLAYERS, round);
    const p4 = calculated.results.find((r) => r.playerId === P4);
    const p5 = calculated.results.find((r) => r.playerId === P5);
    expect(p4?.capturedPoints).toBe(0);
    expect(p4?.delta).toBe(0);
    expect(p5?.capturedPoints).toBe(0);
    expect(p5?.delta).toBe(-5);
  });

  it('scores each heart as one point', () => {
    const round = makeRound({ hearts: { [P1]: 5, [P2]: 8 }, queen: P3, diamond: P4 });
    const result = deltas(round);
    expect(deltaOf(result, P1)).toBe(5);
    expect(deltaOf(result, P2)).toBe(8);
    expect(RULES.HEART_VALUE).toBe(1);
  });

  it('adds hearts to the normal and doubled special cards', () => {
    const round = makeRound({
      hearts: { [P1]: 5, [P2]: 8 },
      queen: P1,
      diamond: P2,
      queenDoubled: true,
      diamondDoubled: true,
    });
    const result = deltas(round);
    expect(deltaOf(result, P1)).toBe(5 + 26);
    expect(deltaOf(result, P2)).toBe(8 + 20);
  });
});

describe('ميلس', () => {
  it('scores -25 for a successful ميلس', () => {
    const round = makeRound({ hearts: { [P1]: 7, [P2]: 6 }, queen: P3, diamond: P4, mils: [P5] });
    expect(deltaOf(deltas(round), P5)).toBe(-25);
  });

  it('scores +25 when ميلس fails through a harmless trick', () => {
    const round = makeRound({
      hearts: { [P1]: 7, [P2]: 6 },
      queen: P3,
      diamond: P4,
      mils: [P5],
      tricks: [P5],
    });
    expect(deltaOf(deltas(round), P5)).toBe(25);
  });

  it('adds hearts to a failed ميلس', () => {
    const round = makeRound({ hearts: { [P1]: 10, [P5]: 3 }, queen: P2, diamond: P3, mils: [P5] });
    expect(deltaOf(deltas(round), P5)).toBe(25 + 3);
  });

  it('adds a normal بنت السبيت to a failed ميلس', () => {
    const round = makeRound({ hearts: { [P1]: 13 }, queen: P5, diamond: P2, mils: [P5] });
    expect(deltaOf(deltas(round), P5)).toBe(25 + 13);
  });

  it('adds a doubled بنت السبيت to a failed ميلس', () => {
    const round = makeRound({
      hearts: { [P1]: 13 },
      queen: P5,
      diamond: P2,
      mils: [P5],
      queenDoubled: true,
    });
    expect(deltaOf(deltas(round), P5)).toBe(25 + 26);
  });

  it('adds a normal عشرة الديمن to a failed ميلس', () => {
    const round = makeRound({ hearts: { [P1]: 13 }, queen: P2, diamond: P5, mils: [P5] });
    expect(deltaOf(deltas(round), P5)).toBe(25 + 10);
  });

  it('adds a doubled عشرة الديمن to a failed ميلس', () => {
    const round = makeRound({
      hearts: { [P1]: 13 },
      queen: P2,
      diamond: P5,
      mils: [P5],
      diamondDoubled: true,
    });
    expect(deltaOf(deltas(round), P5)).toBe(25 + 20);
  });

  it('matches the worked example: ميلس with two hearts and a doubled queen', () => {
    const round = makeRound({
      hearts: { [P1]: 11, [P5]: 2 },
      queen: P5,
      diamond: P2,
      mils: [P5],
      queenDoubled: true,
    });
    expect(deltaOf(deltas(round), P5)).toBe(53);
  });

  it('allows all five players to declare ميلس', () => {
    const round = makeRound({
      hearts: { [P1]: 13 },
      queen: P1,
      diamond: P2,
      mils: [P1, P2, P3, P4, P5],
    });
    expect(validateRound(PLAYERS, round)).toEqual([]);
    const result = deltas(round);
    expect(deltaOf(result, P1)).toBe(25 + 13 + 13);
    expect(deltaOf(result, P2)).toBe(25 + 10);
    expect(deltaOf(result, P3)).toBe(-25);
    expect(deltaOf(result, P4)).toBe(-25);
    expect(deltaOf(result, P5)).toBe(-25);
  });
});

describe('doubling', () => {
  it('doubles each card independently', () => {
    const base = { hearts: { [P1]: 13 }, queen: P2, diamond: P3 } as const;
    expect(deltaOf(deltas(makeRound({ ...base })), P2)).toBe(13);
    expect(deltaOf(deltas(makeRound({ ...base, queenDoubled: true })), P2)).toBe(26);
    expect(deltaOf(deltas(makeRound({ ...base })), P3)).toBe(10);
    expect(deltaOf(deltas(makeRound({ ...base, diamondDoubled: true })), P3)).toBe(20);
  });

  it('distributes 36 points when neither card is doubled', () => {
    const round = makeRound({ hearts: { [P1]: 13 }, queen: P2, diamond: P3 });
    expect(expectedDistributedPoints(false, false)).toBe(36);
    expect(calculateRound(PLAYERS, round).distributedPoints).toBe(36);
  });

  it('distributes 46 points when only عشرة الديمن is doubled', () => {
    const round = makeRound({ hearts: { [P1]: 13 }, queen: P2, diamond: P3, diamondDoubled: true });
    expect(expectedDistributedPoints(false, true)).toBe(46);
    expect(calculateRound(PLAYERS, round).distributedPoints).toBe(46);
  });

  it('distributes 49 points when only بنت السبيت is doubled', () => {
    const round = makeRound({ hearts: { [P1]: 13 }, queen: P2, diamond: P3, queenDoubled: true });
    expect(expectedDistributedPoints(true, false)).toBe(49);
    expect(calculateRound(PLAYERS, round).distributedPoints).toBe(49);
  });

  it('distributes 59 points when both cards are doubled', () => {
    const round = makeRound({
      hearts: { [P1]: 13 },
      queen: P2,
      diamond: P3,
      queenDoubled: true,
      diamondDoubled: true,
    });
    expect(expectedDistributedPoints(true, true)).toBe(59);
    expect(calculateRound(PLAYERS, round).distributedPoints).toBe(59);
  });
});

describe('validation', () => {
  it('rejects hearts totalling 12', () => {
    const round = makeRound({ hearts: { [P1]: 6, [P2]: 6 }, queen: P3, diamond: P4 });
    const errors = validateRound(PLAYERS, round);
    expect(errors.map((e) => e.code)).toContain('heartsTotal');
    expect(() => calculateRound(PLAYERS, round)).toThrow(RoundValidationError);
  });

  it('rejects hearts totalling 14', () => {
    const round = makeRound({ hearts: { [P1]: 7, [P2]: 7 }, queen: P3, diamond: P4 });
    expect(validateRound(PLAYERS, round).map((e) => e.code)).toContain('heartsTotal');
  });

  it('rejects negative, fractional and non-finite heart values', () => {
    const negative = makeRound({ hearts: { [P1]: 13 }, queen: P2, diamond: P3 });
    negative.outcomes[4] = { playerId: P5, hearts: -1, wonAnyTrick: false };
    expect(validateRound(PLAYERS, negative).map((e) => e.code)).toContain('heartsRange');

    const fractional = makeRound({ hearts: { [P1]: 13 }, queen: P2, diamond: P3 });
    fractional.outcomes[4] = { playerId: P5, hearts: 1.5, wonAnyTrick: true };
    expect(validateRound(PLAYERS, fractional).map((e) => e.code)).toContain('heartsNotInteger');

    const nan = makeRound({ hearts: { [P1]: 13 }, queen: P2, diamond: P3 });
    nan.outcomes[4] = { playerId: P5, hearts: Number.NaN, wonAnyTrick: true };
    expect(validateRound(PLAYERS, nan).map((e) => e.code)).toContain('heartsNotInteger');

    const infinite = makeRound({ hearts: { [P1]: 13 }, queen: P2, diamond: P3 });
    infinite.outcomes[4] = { playerId: P5, hearts: Number.POSITIVE_INFINITY, wonAnyTrick: true };
    expect(validateRound(PLAYERS, infinite).map((e) => e.code)).toContain('heartsNotInteger');
  });

  it('rejects a missing بنت السبيت captor', () => {
    const round = makeRound({ hearts: { [P1]: 13 }, queen: P2, diamond: P3 });
    const broken = { ...round, queenCaptorId: '' };
    expect(validateRound(PLAYERS, broken).map((e) => e.code)).toContain('queenCaptorMissing');
  });

  it('rejects a missing عشرة الديمن captor', () => {
    const round = makeRound({ hearts: { [P1]: 13 }, queen: P2, diamond: P3 });
    const broken = { ...round, diamondCaptorId: '' };
    expect(validateRound(PLAYERS, broken).map((e) => e.code)).toContain('diamondCaptorMissing');
  });

  it('rejects an unknown captor id', () => {
    const round = makeRound({ hearts: { [P1]: 13 }, queen: P2, diamond: P3 });
    const broken = { ...round, queenCaptorId: 'ghost' };
    expect(validateRound(PLAYERS, broken).map((e) => e.code)).toContain('queenCaptorInvalid');
  });

  it('rejects duplicated and unknown player outcomes', () => {
    const duplicated = makeRound({ hearts: { [P1]: 13 }, queen: P2, diamond: P3 });
    duplicated.outcomes[4] = { playerId: P1, hearts: 0, wonAnyTrick: true };
    const duplicateCodes = validateRound(PLAYERS, duplicated).map((e) => e.code);
    expect(duplicateCodes).toContain('duplicateOutcome');
    expect(duplicateCodes).toContain('outcomeMismatch');

    const unknown = makeRound({ hearts: { [P1]: 13 }, queen: P2, diamond: P3 });
    unknown.outcomes[4] = { playerId: 'ghost', hearts: 0, wonAnyTrick: true };
    expect(validateRound(PLAYERS, unknown).map((e) => e.code)).toContain('outcomeMismatch');

    const short = makeRound({ hearts: { [P1]: 13 }, queen: P2, diamond: P3 });
    short.outcomes = short.outcomes.slice(0, 4);
    expect(validateRound(PLAYERS, short).map((e) => e.code)).toContain('outcomeCount');
  });

  it('rejects a scoring-card captor marked as having won no trick', () => {
    const round = makeRound({ hearts: { [P1]: 13 }, queen: P2, diamond: P3 });
    round.outcomes[1] = { playerId: P2, hearts: 0, wonAnyTrick: false };
    expect(validateRound(PLAYERS, round).map((e) => e.code)).toContain('captorWithoutTrick');

    const withHearts = makeRound({ hearts: { [P1]: 13 }, queen: P2, diamond: P3 });
    withHearts.outcomes[0] = { playerId: P1, hearts: 13, wonAnyTrick: false };
    expect(validateRound(PLAYERS, withHearts).map((e) => e.code)).toContain('heartsWithoutTrick');
  });

  it('rejects a round where nobody won a trick', () => {
    const round = makeRound({ hearts: { [P1]: 13 }, queen: P2, diamond: P3 });
    round.outcomes = round.outcomes.map((o) => ({ ...o, wonAnyTrick: false }));
    expect(validateRound(PLAYERS, round).map((e) => e.code)).toContain('noTrickWinner');
  });

  it('rejects a ميلس id that does not belong to the game', () => {
    const round = makeRound({ hearts: { [P1]: 13 }, queen: P2, diamond: P3, mils: ['ghost'] });
    expect(validateRound(PLAYERS, round).map((e) => e.code)).toContain('milsUnknownPlayer');
  });

  it('rejects non-boolean doubling declarations', () => {
    const round = makeRound({ hearts: { [P1]: 13 }, queen: P2, diamond: P3 });
    const broken = {
      ...round,
      declarations: {
        ...round.declarations,
        queenDoubled: 'yes' as unknown as boolean,
      },
    };
    expect(validateRound(PLAYERS, broken).map((e) => e.code)).toContain('doublingNotBoolean');
  });

  it('rejects a game that does not have exactly five players', () => {
    const four = PLAYERS.slice(0, 4);
    const round = makeRound({ hearts: { [P1]: 13 }, queen: P2, diamond: P3, players: four });
    expect(validateRound(four, round).map((e) => e.code)).toContain('playerCount');
  });

  it('accepts a harmless trick that captured zero points', () => {
    const round = makeRound({
      hearts: { [P1]: 13 },
      queen: P2,
      diamond: P3,
      tricks: [P4, P5],
    });
    expect(validateRound(PLAYERS, round)).toEqual([]);
    const result = deltas(round);
    expect(deltaOf(result, P4)).toBe(0);
    expect(deltaOf(result, P5)).toBe(0);
  });
});

describe('كبوت', () => {
  it('is detected when one player captures every scoring card', () => {
    const round = makeRound({ hearts: { [P1]: 13 }, queen: P1, diamond: P1 });
    expect(findKabootPlayerId(round)).toBe(P1);
    expect(calculateRound(PLAYERS, round).isKaboot).toBe(true);
  });

  it('is not triggered by all hearts plus only one special card', () => {
    const queenOnly = makeRound({ hearts: { [P1]: 13 }, queen: P1, diamond: P2 });
    expect(findKabootPlayerId(queenOnly)).toBeNull();
    expect(calculateRound(PLAYERS, queenOnly).isKaboot).toBe(false);

    const diamondOnly = makeRound({ hearts: { [P1]: 13 }, queen: P2, diamond: P1 });
    expect(findKabootPlayerId(diamondOnly)).toBeNull();

    const bothCardsNoHearts = makeRound({ hearts: { [P2]: 13 }, queen: P1, diamond: P1 });
    expect(findKabootPlayerId(bothCardsNoHearts)).toBeNull();
  });

  it('produces one 0 and four +25 results in the correct player positions', () => {
    const round = makeRound({ hearts: { [P3]: 13 }, queen: P3, diamond: P3 });
    const calculated = calculateRound(PLAYERS, round);
    expect(calculated.kabootPlayerId).toBe(P3);
    expect(calculated.results.map((r) => r.delta)).toEqual([25, 25, 0, 25, 25]);
    expect(calculated.results.map((r) => r.playerId)).toEqual([P1, P2, P3, P4, P5]);
  });

  it('ignores doubling', () => {
    const round = makeRound({
      hearts: { [P1]: 13 },
      queen: P1,
      diamond: P1,
      queenDoubled: true,
      diamondDoubled: true,
    });
    const calculated = calculateRound(PLAYERS, round);
    expect(calculated.results.map((r) => r.delta)).toEqual([0, 25, 25, 25, 25]);
  });

  it('overrides both successful and failed ميلس', () => {
    const round = makeRound({
      hearts: { [P1]: 13 },
      queen: P1,
      diamond: P1,
      mils: [P2, P3],
      tricks: [P3],
    });
    const result = deltas(round);
    expect(deltaOf(result, P1)).toBe(0);
    /* P2 would have scored -25 and P3 +25 without كبوت. */
    expect(deltaOf(result, P2)).toBe(25);
    expect(deltaOf(result, P3)).toBe(25);
  });

  it('overrides ميلس even for the كبوت player', () => {
    const round = makeRound({ hearts: { [P1]: 13 }, queen: P1, diamond: P1, mils: [P1] });
    expect(deltaOf(deltas(round), P1)).toBe(0);
  });
});

describe('totals and game completion', () => {
  const cleanSweep = (id: string) =>
    makeRound({ hearts: { [P1]: 13 }, queen: P1, diamond: P1, id });

  it('keeps negative totals negative', () => {
    const rounds = [
      makeRound({ hearts: { [P1]: 7, [P2]: 6 }, queen: P3, diamond: P4, id: 'a' }),
      makeRound({ hearts: { [P1]: 7, [P2]: 6 }, queen: P3, diamond: P4, id: 'b' }),
    ];
    const totals = computeTotals(PLAYERS, rounds);
    expect(totals[P5]).toBe(-10);
    expect(checkGameOver(PLAYERS, totals).winnerIds).toEqual([P5]);
  });

  it('ends the game at exactly 152', () => {
    const totals = { [P1]: 152, [P2]: 10, [P3]: 20, [P4]: 30, [P5]: 40 };
    expect(checkGameOver(PLAYERS, totals).isOver).toBe(true);
  });

  it('does not end the game below 152', () => {
    const totals = { [P1]: 151, [P2]: 10, [P3]: 20, [P4]: 30, [P5]: 40 };
    expect(checkGameOver(PLAYERS, totals).isOver).toBe(false);
  });

  it('does not treat the threshold-triggering player as the winner', () => {
    const totals = { [P1]: 160, [P2]: 40, [P3]: 12, [P4]: 90, [P5]: 33 };
    const status = checkGameOver(PLAYERS, totals);
    expect(status.isOver).toBe(true);
    expect(status.winnerIds).toEqual([P3]);
  });

  it('gives the win to the lowest total', () => {
    const totals = { [P1]: 152, [P2]: -8, [P3]: 20, [P4]: 30, [P5]: 40 };
    expect(checkGameOver(PLAYERS, totals).winnerIds).toEqual([P2]);
  });

  it('produces joint winners for tied lowest totals', () => {
    const totals = { [P1]: 152, [P2]: -8, [P3]: -8, [P4]: 30, [P5]: -8 };
    expect(checkGameOver(PLAYERS, totals).winnerIds).toEqual([P2, P3, P5]);
  });

  it('recomputes later totals when a round is edited', () => {
    const rounds = [
      makeRound({ hearts: { [P1]: 13 }, queen: P2, diamond: P3, id: 'a' }),
      makeRound({ hearts: { [P4]: 13 }, queen: P4, diamond: P5, id: 'b' }),
    ];
    const before = computeTotals(PLAYERS, rounds);
    expect(before[P1]).toBe(13 - 5);

    const edited = rounds.map((r) =>
      r.id === 'a'
        ? makeRound({ hearts: { [P1]: 3, [P5]: 10 }, queen: P2, diamond: P3, id: 'a' })
        : r,
    );
    const after = computeTotals(PLAYERS, edited);
    expect(after[P1]).toBe(3 - 5);
    expect(after[P5]).toBe(10 + 10);
  });

  it('recomputes later totals when a round is deleted, and restores them on undo', () => {
    const rounds = [
      makeRound({ hearts: { [P1]: 13 }, queen: P2, diamond: P3, id: 'a' }),
      makeRound({ hearts: { [P4]: 13 }, queen: P4, diamond: P5, id: 'b' }),
      makeRound({ hearts: { [P5]: 13 }, queen: P5, diamond: P1, id: 'c' }),
    ];
    const original = computeTotals(PLAYERS, rounds);

    const withoutSecond = rounds.filter((r) => r.id !== 'b');
    const afterDelete = computeTotals(PLAYERS, withoutSecond);
    expect(afterDelete).not.toEqual(original);
    expect(afterDelete[P4]).toBe(-5 + -5);

    const restored = [...withoutSecond];
    restored.splice(1, 0, rounds[1]!);
    expect(computeTotals(PLAYERS, restored)).toEqual(original);
  });

  it('reopens a game when the threshold-crossing round is removed', () => {
    const heavy: RoundInput[] = [];
    for (let i = 0; i < 6; i += 1) {
      heavy.push(cleanSweep(`k${i}`));
    }
    /* Each كبوت gives every other player +25, so after six rounds P2 is at 150. */
    let totals = computeTotals(PLAYERS, heavy);
    expect(totals[P2]).toBe(150);
    expect(checkGameOver(PLAYERS, totals).isOver).toBe(false);

    heavy.push(cleanSweep('k6'));
    totals = computeTotals(PLAYERS, heavy);
    expect(totals[P2]).toBe(175);
    expect(checkGameOver(PLAYERS, totals).isOver).toBe(true);

    const reopened = heavy.slice(0, -1);
    const reopenedTotals = computeTotals(PLAYERS, reopened);
    expect(checkGameOver(PLAYERS, reopenedTotals).isOver).toBe(false);
  });

  it('derives totals only by replaying raw rounds', () => {
    const rounds = [makeRound({ hearts: { [P1]: 13 }, queen: P1, diamond: P1, id: 'a' })];
    expect(computeTotals(PLAYERS, rounds)).toEqual({
      [P1]: 0,
      [P2]: 25,
      [P3]: 25,
      [P4]: 25,
      [P5]: 25,
    });
  });

  it('starts every player at zero', () => {
    expect(computeTotals(PLAYERS, [])).toEqual({
      [P1]: 0,
      [P2]: 0,
      [P3]: 0,
      [P4]: 0,
      [P5]: 0,
    });
  });
});
