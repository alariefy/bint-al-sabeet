/**
 * Versioned local-storage repository.
 *
 * Every meaningful mutation writes the complete next state synchronously so
 * the final tap before the app closes is never lost. Reading is defensive:
 * malformed data degrades to a usable state instead of crashing.
 */

import type {
  Game,
  PersistedAppState,
  Player,
  PlayerRoundOutcome,
  RoundDeclarations,
  RoundDraft,
  RoundDraftPhase,
  RoundInput,
} from './types';
import { validateRound } from './validation';

export const STORAGE_KEY = 'bint-al-sabeet:state';
export const SCHEMA_VERSION = 1 as const;
export const BACKUP_FORMAT = 'bint-al-sabeet-backup' as const;

const DRAFT_PHASES: RoundDraftPhase[] = ['declarations', 'playing', 'entry', 'review'];

export function createEmptyState(): PersistedAppState {
  return {
    schemaVersion: SCHEMA_VERSION,
    activeGame: null,
    activeRoundDraft: null,
    finishedGames: [],
    previousPlayerNames: [],
  };
}

/* ------------------------------------------------------------------ */
/* Defensive parsing                                                   */
/* ------------------------------------------------------------------ */

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function isFiniteInteger(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && Number.isInteger(value);
}

function parsePlayers(value: unknown): Player[] | null {
  if (!Array.isArray(value)) return null;
  const players: Player[] = [];
  const seen = new Set<string>();
  for (const raw of value) {
    if (!isRecord(raw)) return null;
    if (!isNonEmptyString(raw.id) || typeof raw.name !== 'string') return null;
    if (!isFiniteInteger(raw.order)) return null;
    if (seen.has(raw.id)) return null;
    seen.add(raw.id);
    players.push({ id: raw.id, name: raw.name, order: raw.order });
  }
  return players;
}

function parseDeclarations(value: unknown, playerIds: Set<string>): RoundDeclarations | null {
  if (!isRecord(value)) return null;
  if (typeof value.queenDoubled !== 'boolean') return null;
  if (typeof value.diamondDoubled !== 'boolean') return null;
  if (!Array.isArray(value.milsPlayerIds)) return null;
  const mils: string[] = [];
  for (const id of value.milsPlayerIds) {
    if (typeof id !== 'string' || !playerIds.has(id)) return null;
    if (!mils.includes(id)) mils.push(id);
  }
  return {
    milsPlayerIds: mils,
    queenDoubled: value.queenDoubled,
    diamondDoubled: value.diamondDoubled,
  };
}

function parseOutcomes(value: unknown, playerIds: Set<string>): PlayerRoundOutcome[] | null {
  if (!Array.isArray(value)) return null;
  const outcomes: PlayerRoundOutcome[] = [];
  const seen = new Set<string>();
  for (const raw of value) {
    if (!isRecord(raw)) return null;
    if (typeof raw.playerId !== 'string' || !playerIds.has(raw.playerId)) return null;
    if (seen.has(raw.playerId)) return null;
    if (!isFiniteInteger(raw.hearts)) return null;
    if (typeof raw.wonAnyTrick !== 'boolean') return null;
    seen.add(raw.playerId);
    outcomes.push({ playerId: raw.playerId, hearts: raw.hearts, wonAnyTrick: raw.wonAnyTrick });
  }
  return outcomes;
}

function parseRound(value: unknown, players: Player[]): RoundInput | null {
  if (!isRecord(value)) return null;
  if (!isNonEmptyString(value.id)) return null;
  if (!isFiniteInteger(value.createdAt)) return null;
  const playerIds = new Set(players.map((p) => p.id));
  const declarations = parseDeclarations(value.declarations, playerIds);
  if (!declarations) return null;
  const outcomes = parseOutcomes(value.outcomes, playerIds);
  if (!outcomes) return null;
  if (typeof value.queenCaptorId !== 'string' || !playerIds.has(value.queenCaptorId)) return null;
  if (typeof value.diamondCaptorId !== 'string' || !playerIds.has(value.diamondCaptorId)) {
    return null;
  }
  const round: RoundInput = {
    id: value.id,
    createdAt: value.createdAt,
    declarations,
    outcomes,
    queenCaptorId: value.queenCaptorId,
    diamondCaptorId: value.diamondCaptorId,
  };
  /* A saved round that cannot be scored would corrupt every later total. */
  if (validateRound(players, round).length > 0) return null;
  return round;
}

function parseGame(value: unknown): Game | null {
  if (!isRecord(value)) return null;
  if (!isNonEmptyString(value.id)) return null;
  if (!isFiniteInteger(value.createdAt)) return null;
  const players = parsePlayers(value.players);
  if (!players || players.length !== 5) return null;
  if (!Array.isArray(value.rounds)) return null;
  const rounds: RoundInput[] = [];
  for (const rawRound of value.rounds) {
    const round = parseRound(rawRound, players);
    if (!round) return null;
    rounds.push(round);
  }
  return { id: value.id, createdAt: value.createdAt, players, rounds };
}

function parseDraft(value: unknown, activeGame: Game | null): RoundDraft | null {
  if (!isRecord(value) || !activeGame) return null;
  if (value.gameId !== activeGame.id) return null;
  const phase = value.phase;
  if (typeof phase !== 'string' || !DRAFT_PHASES.includes(phase as RoundDraftPhase)) return null;
  const playerIds = new Set(activeGame.players.map((p) => p.id));
  const declarations = parseDeclarations(value.declarations, playerIds);
  if (!declarations) return null;
  const outcomes = parseOutcomes(value.outcomes, playerIds);
  if (!outcomes) return null;
  const queenCaptorId =
    typeof value.queenCaptorId === 'string' && playerIds.has(value.queenCaptorId)
      ? value.queenCaptorId
      : null;
  const diamondCaptorId =
    typeof value.diamondCaptorId === 'string' && playerIds.has(value.diamondCaptorId)
      ? value.diamondCaptorId
      : null;
  const editingRoundId =
    typeof value.editingRoundId === 'string' &&
    activeGame.rounds.some((r) => r.id === value.editingRoundId)
      ? value.editingRoundId
      : null;
  return {
    gameId: activeGame.id,
    phase: phase as RoundDraftPhase,
    declarations,
    outcomes,
    queenCaptorId,
    diamondCaptorId,
    editingRoundId,
  };
}

function parseNames(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((n): n is string => typeof n === 'string').slice(0, 5);
}

/** Turns unknown parsed JSON into a usable state, dropping unreadable parts. */
export function sanitizeState(value: unknown): PersistedAppState {
  const empty = createEmptyState();
  if (!isRecord(value)) return empty;
  if (value.schemaVersion !== SCHEMA_VERSION) return empty;

  const activeGame = value.activeGame === null ? null : parseGame(value.activeGame);
  const finishedGames: Game[] = [];
  if (Array.isArray(value.finishedGames)) {
    for (const rawGame of value.finishedGames) {
      const game = parseGame(rawGame);
      if (game) finishedGames.push(game);
    }
  }

  return {
    schemaVersion: SCHEMA_VERSION,
    activeGame,
    activeRoundDraft: parseDraft(value.activeRoundDraft, activeGame),
    finishedGames,
    previousPlayerNames: parseNames(value.previousPlayerNames),
  };
}

/* ------------------------------------------------------------------ */
/* Storage access                                                      */
/* ------------------------------------------------------------------ */

function getStorage(): Storage | null {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return null;
    return window.localStorage;
  } catch {
    return null;
  }
}

export function loadState(): PersistedAppState {
  const storage = getStorage();
  if (!storage) return createEmptyState();
  try {
    const raw = storage.getItem(STORAGE_KEY);
    if (raw === null) return createEmptyState();
    return sanitizeState(JSON.parse(raw));
  } catch {
    return createEmptyState();
  }
}

/** Returns false when the browser refused the write. */
export function saveState(state: PersistedAppState): boolean {
  const storage = getStorage();
  if (!storage) return false;
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(state));
    return true;
  } catch {
    return false;
  }
}

/* ------------------------------------------------------------------ */
/* Backup                                                              */
/* ------------------------------------------------------------------ */

export interface BackupEnvelope {
  format: typeof BACKUP_FORMAT;
  schemaVersion: typeof SCHEMA_VERSION;
  exportedAt: number;
  state: PersistedAppState;
}

export function serializeBackup(state: PersistedAppState, now: number = Date.now()): string {
  const envelope: BackupEnvelope = {
    format: BACKUP_FORMAT,
    schemaVersion: SCHEMA_VERSION,
    exportedAt: now,
    state,
  };
  return JSON.stringify(envelope, null, 2);
}

export type ImportResult =
  { ok: true; state: PersistedAppState } | { ok: false; reason: 'parse' | 'format' | 'empty' };

/**
 * Validates a backup file before it is allowed to replace anything. An invalid
 * file never touches the current data.
 */
export function parseBackup(text: string): ImportResult {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    return { ok: false, reason: 'parse' };
  }
  if (!isRecord(parsed)) return { ok: false, reason: 'format' };
  if (parsed.format !== BACKUP_FORMAT) return { ok: false, reason: 'format' };
  if (parsed.schemaVersion !== SCHEMA_VERSION) return { ok: false, reason: 'format' };
  if (!isRecord(parsed.state)) return { ok: false, reason: 'format' };

  const rawState = parsed.state;
  const sanitized = sanitizeState(rawState);

  /* Reject files whose content was entirely unreadable. */
  const claimedSomething =
    rawState.activeGame !== null ||
    (Array.isArray(rawState.finishedGames) && rawState.finishedGames.length > 0);
  const recoveredSomething = sanitized.activeGame !== null || sanitized.finishedGames.length > 0;
  if (claimedSomething && !recoveredSomething) return { ok: false, reason: 'format' };
  if (!claimedSomething && !recoveredSomething) return { ok: false, reason: 'empty' };

  return { ok: true, state: sanitized };
}
