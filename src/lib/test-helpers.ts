/**
 * Shared fixtures for the automated tests. Not part of the shipped UI.
 */

import type { Player, PlayerId, PlayerRoundOutcome, RoundInput } from './types';

export const PLAYER_NAMES = ['أحمد', 'سعود', 'خالد', 'فهد', 'ناصر'] as const;

export const PLAYERS: Player[] = PLAYER_NAMES.map((name, index) => ({
  id: `p${index + 1}`,
  name,
  order: index,
}));

export const [P1, P2, P3, P4, P5] = PLAYERS.map((p) => p.id) as [
  PlayerId,
  PlayerId,
  PlayerId,
  PlayerId,
  PlayerId,
];

export interface RoundSpec {
  /** Hearts per player. Missing players get 0. */
  hearts?: Partial<Record<PlayerId, number>>;
  /** Players who won a harmless trick on top of those implied by captures. */
  tricks?: PlayerId[];
  queen: PlayerId;
  diamond: PlayerId;
  mils?: PlayerId[];
  queenDoubled?: boolean;
  diamondDoubled?: boolean;
  id?: string;
  players?: Player[];
}

/**
 * Builds a round, deriving `wonAnyTrick` the way the UI does: anyone holding a
 * scoring card won a trick, plus anyone listed in `tricks`.
 */
export function makeRound(spec: RoundSpec): RoundInput {
  const players = spec.players ?? PLAYERS;
  const hearts = spec.hearts ?? {};
  const extraTricks = new Set(spec.tricks ?? []);
  const outcomes: PlayerRoundOutcome[] = players.map((player) => {
    const heartCount = hearts[player.id] ?? 0;
    const wonAnyTrick =
      heartCount > 0 ||
      player.id === spec.queen ||
      player.id === spec.diamond ||
      extraTricks.has(player.id);
    return { playerId: player.id, hearts: heartCount, wonAnyTrick };
  });

  return {
    id: spec.id ?? 'r1',
    createdAt: 1_700_000_000_000,
    declarations: {
      milsPlayerIds: spec.mils ?? [],
      queenDoubled: spec.queenDoubled ?? false,
      diamondDoubled: spec.diamondDoubled ?? false,
    },
    outcomes,
    queenCaptorId: spec.queen,
    diamondCaptorId: spec.diamond,
  };
}

/** Convenience: the delta of one player in a calculated round. */
export function deltaOf(deltas: Record<PlayerId, number>, playerId: PlayerId): number {
  const value = deltas[playerId];
  if (value === undefined) throw new Error(`missing delta for ${playerId}`);
  return value;
}
