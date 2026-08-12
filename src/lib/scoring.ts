/**
 * Pure scoring engine for بنت السبيت.
 *
 * No React, no browser APIs, no storage, no side effects, integers only.
 */

import type {
  CalculatedRound,
  Game,
  GameOverStatus,
  Player,
  PlayerId,
  PlayerRoundOutcome,
  PlayerRoundResult,
  RoundDeclarations,
  RoundExplanation,
  RoundInput,
} from './types';
import { validateRound } from './validation';
import { RoundValidationError } from './validation';

export const RULES = {
  PLAYER_COUNT: 5,
  HEARTS_TOTAL: 13,
  HEART_VALUE: 1,
  QUEEN_VALUE: 13,
  QUEEN_DOUBLED_VALUE: 26,
  DIAMOND_VALUE: 10,
  DIAMOND_DOUBLED_VALUE: 20,
  MILS_SUCCESS: -25,
  MILS_FAILURE_PENALTY: 25,
  CLEAN_ROUND_BONUS: -5,
  KABOOT_TAKER_SCORE: 0,
  KABOOT_OTHERS_PENALTY: 25,
  TARGET_SCORE: 152,
  /** A gentle warning is shown once a cumulative total reaches this value. */
  WARNING_SCORE: 130,
} as const;

export function queenValue(doubled: boolean): number {
  return doubled ? RULES.QUEEN_DOUBLED_VALUE : RULES.QUEEN_VALUE;
}

export function diamondValue(doubled: boolean): number {
  return doubled ? RULES.DIAMOND_DOUBLED_VALUE : RULES.DIAMOND_VALUE;
}

/**
 * Total scoring-card points distributed in a round:
 * 36 (neither doubled), 46 (10♦ only), 49 (Q♠ only), 59 (both).
 */
export function expectedDistributedPoints(queenDoubled: boolean, diamondDoubled: boolean): number {
  return (
    RULES.HEARTS_TOTAL * RULES.HEART_VALUE + queenValue(queenDoubled) + diamondValue(diamondDoubled)
  );
}

/**
 * A round shape that tolerates missing captors, used for the live preview
 * while the round is still being entered.
 */
export interface RoundLike {
  id: string;
  declarations: RoundDeclarations;
  outcomes: PlayerRoundOutcome[];
  queenCaptorId: PlayerId | null;
  diamondCaptorId: PlayerId | null;
}

/**
 * كبوت: the same player captured all 13 hearts, Q♠ and 10♦.
 * Detected automatically, never entered by hand.
 */
export function findKabootPlayerId(input: RoundLike): PlayerId | null {
  if (input.queenCaptorId === null) return null;
  if (input.queenCaptorId !== input.diamondCaptorId) return null;
  const candidate = input.queenCaptorId;
  const outcome = input.outcomes.find((o) => o.playerId === candidate);
  if (!outcome) return null;
  return outcome.hearts === RULES.HEARTS_TOTAL ? candidate : null;
}

/**
 * Calculates one round. Throws `RoundValidationError` for invalid input
 * instead of silently repairing it.
 */
export function calculateRound(players: Player[], input: RoundInput): CalculatedRound {
  const errors = validateRound(players, input);
  if (errors.length > 0) throw new RoundValidationError(errors);
  return scoreRoundUnchecked(players, input);
}

/**
 * Applies the scoring rules without validating first. Only used for the live
 * preview during entry; saved rounds always go through `calculateRound`.
 */
export function scoreRoundUnchecked(players: Player[], input: RoundLike): CalculatedRound {
  const qPoints = queenValue(input.declarations.queenDoubled);
  const dPoints = diamondValue(input.declarations.diamondDoubled);
  const kabootPlayerId = findKabootPlayerId(input);
  const milsSet = new Set(input.declarations.milsPlayerIds);

  const results: PlayerRoundResult[] = players
    .slice()
    .sort((a, b) => a.order - b.order)
    .map((player) => {
      const outcome = input.outcomes.find((o) => o.playerId === player.id);
      /* validateRound guarantees exactly one outcome per player. */
      const hearts = outcome ? outcome.hearts : 0;
      const wonAnyTrick = outcome ? outcome.wonAnyTrick : false;
      const capturedQueen = input.queenCaptorId === player.id;
      const capturedDiamond = input.diamondCaptorId === player.id;
      const queenPoints = capturedQueen ? qPoints : 0;
      const diamondPoints = capturedDiamond ? dPoints : 0;
      const heartPoints = hearts * RULES.HEART_VALUE;
      const capturedPoints = heartPoints + queenPoints + diamondPoints;
      const declaredMils = milsSet.has(player.id);

      let delta: number;
      let explanation: RoundExplanation;

      if (kabootPlayerId !== null) {
        /* كبوت overrides ميلس, the no-trick bonus and every doubling value. */
        if (player.id === kabootPlayerId) {
          delta = RULES.KABOOT_TAKER_SCORE;
          explanation = { kind: 'kabootTaker' };
        } else {
          delta = RULES.KABOOT_OTHERS_PENALTY;
          explanation = { kind: 'kabootOther' };
        }
      } else if (declaredMils) {
        if (!wonAnyTrick) {
          delta = RULES.MILS_SUCCESS;
          explanation = { kind: 'milsSuccess' };
        } else {
          delta = RULES.MILS_FAILURE_PENALTY + capturedPoints;
          explanation = {
            kind: 'milsFailure',
            hearts: heartPoints,
            queen: queenPoints,
            diamond: diamondPoints,
            total: delta,
          };
        }
      } else if (!wonAnyTrick) {
        delta = RULES.CLEAN_ROUND_BONUS;
        explanation = { kind: 'noTrick' };
      } else if (capturedPoints === 0) {
        /* Won at least one harmless trick. Never inferred from points alone. */
        delta = 0;
        explanation = { kind: 'harmlessTrick' };
      } else {
        delta = capturedPoints;
        explanation = {
          kind: 'captured',
          hearts: heartPoints,
          queen: queenPoints,
          diamond: diamondPoints,
          total: delta,
        };
      }

      return {
        playerId: player.id,
        hearts,
        wonAnyTrick,
        declaredMils,
        capturedQueen,
        capturedDiamond,
        queenPoints,
        diamondPoints,
        capturedPoints,
        delta,
        explanation,
      };
    });

  const deltas: Record<PlayerId, number> = {};
  for (const r of results) deltas[r.playerId] = r.delta;

  return {
    roundId: input.id,
    isKaboot: kabootPlayerId !== null,
    kabootPlayerId,
    queenPoints: qPoints,
    diamondPoints: dPoints,
    distributedPoints: results.reduce((sum, r) => sum + r.capturedPoints, 0),
    results,
    deltas,
  };
}

/** Replays every saved round to derive cumulative totals. */
export function computeTotals(players: Player[], rounds: RoundInput[]): Record<PlayerId, number> {
  const totals: Record<PlayerId, number> = {};
  for (const p of players) totals[p.id] = 0;
  for (const round of rounds) {
    const calculated = calculateRound(players, round);
    for (const result of calculated.results) {
      totals[result.playerId] = (totals[result.playerId] ?? 0) + result.delta;
    }
  }
  return totals;
}

/**
 * A game ends once any cumulative total reaches 152. The lowest total wins;
 * every player tied for the lowest total is a joint winner. Totals are never
 * clamped, so negative totals stay negative.
 */
export function checkGameOver(players: Player[], totals: Record<PlayerId, number>): GameOverStatus {
  if (players.length === 0) return { isOver: false, winnerIds: [] };
  const scores = players.map((p) => totals[p.id] ?? 0);
  const isOver = scores.some((s) => s >= RULES.TARGET_SCORE);
  const lowest = Math.min(...scores);
  const winnerIds = players.filter((p) => (totals[p.id] ?? 0) === lowest).map((p) => p.id);
  return { isOver, winnerIds };
}

/** Players currently tied for the lowest total. Used for the live leader badge. */
export function leaderIds(players: Player[], totals: Record<PlayerId, number>): PlayerId[] {
  return checkGameOver(players, totals).winnerIds;
}

export function computeGameSummary(game: Game): {
  totals: Record<PlayerId, number>;
  status: GameOverStatus;
  roundCount: number;
} {
  const totals = computeTotals(game.players, game.rounds);
  return {
    totals,
    status: checkGameOver(game.players, totals),
    roundCount: game.rounds.length,
  };
}
