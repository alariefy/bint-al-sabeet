/**
 * Pure round validation. No React, no browser APIs, no storage.
 */

import type { Player, PlayerId, RoundInput, ValidationError } from './types';

export const HEARTS_TOTAL = 13;
export const PLAYER_COUNT = 5;
const QUEEN_VALUE = 13;
const QUEEN_DOUBLED_VALUE = 26;
const DIAMOND_VALUE = 10;
const DIAMOND_DOUBLED_VALUE = 20;

export class RoundValidationError extends Error {
  readonly errors: ValidationError[];

  constructor(errors: ValidationError[]) {
    super(`Invalid round: ${errors.map((e) => e.code).join(', ')}`);
    this.name = 'RoundValidationError';
    this.errors = errors;
  }
}

function isPlainInteger(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && Number.isInteger(value);
}

/**
 * Returns every reason a completed round is invalid. An empty array means the
 * round may be saved and scored.
 */
export function validateRound(players: Player[], input: RoundInput): ValidationError[] {
  const errors: ValidationError[] = [];

  if (players.length !== PLAYER_COUNT) {
    errors.push({ code: 'playerCount', expected: PLAYER_COUNT, actual: players.length });
  }

  const playerIds = players.map((p) => p.id);
  const uniquePlayerIds = new Set(playerIds);
  if (uniquePlayerIds.size !== players.length) {
    errors.push({ code: 'duplicatePlayerId' });
  }

  const outcomes = Array.isArray(input.outcomes) ? input.outcomes : [];

  if (outcomes.length !== players.length) {
    errors.push({ code: 'outcomeCount', expected: players.length, actual: outcomes.length });
  }

  const seenOutcomeIds = new Set<PlayerId>();
  for (const outcome of outcomes) {
    if (!uniquePlayerIds.has(outcome.playerId)) {
      errors.push({ code: 'outcomeMismatch', playerId: outcome.playerId });
      continue;
    }
    if (seenOutcomeIds.has(outcome.playerId)) {
      errors.push({ code: 'duplicateOutcome', playerId: outcome.playerId });
      continue;
    }
    seenOutcomeIds.add(outcome.playerId);
  }
  for (const id of uniquePlayerIds) {
    if (!seenOutcomeIds.has(id)) errors.push({ code: 'outcomeMismatch', playerId: id });
  }

  let heartsSum = 0;
  let heartsUsable = true;
  for (const outcome of outcomes) {
    if (!isPlainInteger(outcome.hearts)) {
      errors.push({ code: 'heartsNotInteger', playerId: outcome.playerId });
      heartsUsable = false;
      continue;
    }
    if (outcome.hearts < 0 || outcome.hearts > HEARTS_TOTAL) {
      errors.push({
        code: 'heartsRange',
        playerId: outcome.playerId,
        actual: outcome.hearts,
      });
      heartsUsable = false;
      continue;
    }
    heartsSum += outcome.hearts;
  }
  if (heartsUsable && heartsSum !== HEARTS_TOTAL) {
    errors.push({ code: 'heartsTotal', expected: HEARTS_TOTAL, actual: heartsSum });
  }

  const queenCaptorId = input.queenCaptorId;
  if (typeof queenCaptorId !== 'string' || queenCaptorId.length === 0) {
    errors.push({ code: 'queenCaptorMissing' });
  } else if (!uniquePlayerIds.has(queenCaptorId)) {
    errors.push({ code: 'queenCaptorInvalid', playerId: queenCaptorId });
  }

  const diamondCaptorId = input.diamondCaptorId;
  if (typeof diamondCaptorId !== 'string' || diamondCaptorId.length === 0) {
    errors.push({ code: 'diamondCaptorMissing' });
  } else if (!uniquePlayerIds.has(diamondCaptorId)) {
    errors.push({ code: 'diamondCaptorInvalid', playerId: diamondCaptorId });
  }

  /* Anyone holding a scoring card must have won at least one trick. */
  for (const outcome of outcomes) {
    if (outcome.wonAnyTrick) continue;
    const heldHeart = isPlainInteger(outcome.hearts) && outcome.hearts > 0;
    const heldSpecial = outcome.playerId === queenCaptorId || outcome.playerId === diamondCaptorId;
    if (heldHeart) {
      errors.push({ code: 'heartsWithoutTrick', playerId: outcome.playerId });
    } else if (heldSpecial) {
      errors.push({ code: 'captorWithoutTrick', playerId: outcome.playerId });
    }
  }

  if (outcomes.length > 0 && !outcomes.some((o) => o.wonAnyTrick === true)) {
    errors.push({ code: 'noTrickWinner' });
  }

  const mils = Array.isArray(input.declarations?.milsPlayerIds)
    ? input.declarations.milsPlayerIds
    : [];
  const seenMils = new Set<PlayerId>();
  for (const id of mils) {
    if (!uniquePlayerIds.has(id)) {
      errors.push({ code: 'milsUnknownPlayer', playerId: id });
      continue;
    }
    if (seenMils.has(id)) {
      errors.push({ code: 'milsDuplicate', playerId: id });
      continue;
    }
    seenMils.add(id);
  }

  const queenDoubled = input.declarations?.queenDoubled;
  const diamondDoubled = input.declarations?.diamondDoubled;
  const doublingValid = typeof queenDoubled === 'boolean' && typeof diamondDoubled === 'boolean';
  if (!doublingValid) {
    errors.push({ code: 'doublingNotBoolean' });
  }

  /* Distributed card points must equal 36 / 46 / 49 / 59. */
  if (doublingValid && errors.length === 0) {
    const expected =
      HEARTS_TOTAL +
      (queenDoubled ? QUEEN_DOUBLED_VALUE : QUEEN_VALUE) +
      (diamondDoubled ? DIAMOND_DOUBLED_VALUE : DIAMOND_VALUE);
    const actual =
      heartsSum +
      (queenDoubled ? QUEEN_DOUBLED_VALUE : QUEEN_VALUE) +
      (diamondDoubled ? DIAMOND_DOUBLED_VALUE : DIAMOND_VALUE);
    if (actual !== expected) {
      errors.push({ code: 'pointsTotalMismatch', expected, actual });
    }
  }

  return errors;
}

export function isRoundValid(players: Player[], input: RoundInput): boolean {
  return validateRound(players, input).length === 0;
}
