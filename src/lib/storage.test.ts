import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  BACKUP_FORMAT,
  SCHEMA_VERSION,
  STORAGE_KEY,
  createEmptyState,
  loadState,
  parseBackup,
  sanitizeState,
  saveState,
  serializeBackup,
} from './storage';
import { P1, P2, P3, P4, P5, PLAYERS, makeRound } from './test-helpers';
import type { Game, PersistedAppState, RoundDraft } from './types';
import { computeTotals } from './scoring';

function makeGame(): Game {
  return {
    id: 'g1',
    createdAt: 1_700_000_000_000,
    players: PLAYERS,
    rounds: [
      makeRound({ hearts: { [P1]: 13 }, queen: P2, diamond: P3, id: 'a' }),
      makeRound({ hearts: { [P4]: 13 }, queen: P4, diamond: P5, id: 'b', mils: [P1] }),
    ],
  };
}

function makeDraft(gameId: string): RoundDraft {
  return {
    gameId,
    phase: 'entry',
    declarations: { milsPlayerIds: [P2], queenDoubled: true, diamondDoubled: false },
    outcomes: [
      { playerId: P1, hearts: 4, wonAnyTrick: true },
      { playerId: P2, hearts: 0, wonAnyTrick: false },
      { playerId: P3, hearts: 0, wonAnyTrick: true },
      { playerId: P4, hearts: 0, wonAnyTrick: false },
      { playerId: P5, hearts: 0, wonAnyTrick: false },
    ],
    queenCaptorId: P3,
    diamondCaptorId: null,
    editingRoundId: null,
  };
}

function makeState(): PersistedAppState {
  const game = makeGame();
  return {
    schemaVersion: SCHEMA_VERSION,
    activeGame: game,
    activeRoundDraft: makeDraft(game.id),
    finishedGames: [{ ...makeGame(), id: 'g0' }],
    previousPlayerNames: PLAYERS.map((p) => p.name),
  };
}

beforeEach(() => {
  window.localStorage.clear();
});

describe('round trip', () => {
  it('preserves the active game and the partially entered round exactly', () => {
    const state = makeState();
    expect(saveState(state)).toBe(true);
    const loaded = loadState();
    expect(loaded).toEqual(state);
    expect(loaded.activeRoundDraft?.phase).toBe('entry');
    expect(loaded.activeRoundDraft?.declarations.queenDoubled).toBe(true);
    expect(loaded.activeRoundDraft?.diamondCaptorId).toBeNull();
  });

  it('preserves declarations made before the physical round', () => {
    const game = makeGame();
    const state: PersistedAppState = {
      ...createEmptyState(),
      activeGame: game,
      activeRoundDraft: { ...makeDraft(game.id), phase: 'playing' },
    };
    saveState(state);
    const loaded = loadState();
    expect(loaded.activeRoundDraft?.phase).toBe('playing');
    expect(loaded.activeRoundDraft?.declarations.milsPlayerIds).toEqual([P2]);
  });

  it('returns an empty state when nothing is stored', () => {
    expect(loadState()).toEqual(createEmptyState());
  });

  it('preserves totals derived from replayed rounds', () => {
    const state = makeState();
    saveState(state);
    const loaded = loadState();
    expect(computeTotals(loaded.activeGame!.players, loaded.activeGame!.rounds)).toEqual(
      computeTotals(state.activeGame!.players, state.activeGame!.rounds),
    );
  });
});

describe('malformed data recovery', () => {
  it('recovers from invalid JSON without crashing', () => {
    window.localStorage.setItem(STORAGE_KEY, '{not json');
    expect(loadState()).toEqual(createEmptyState());
  });

  it('recovers from an unknown schema version', () => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ schemaVersion: 99, activeGame: {} }));
    expect(loadState()).toEqual(createEmptyState());
  });

  it('drops a game whose rounds cannot be scored, keeping the readable ones', () => {
    const good = makeGame();
    const broken = makeGame();
    broken.id = 'g-broken';
    broken.rounds[0]!.outcomes[0]!.hearts = 99;
    const state = {
      schemaVersion: SCHEMA_VERSION,
      activeGame: null,
      activeRoundDraft: null,
      finishedGames: [good, broken],
      previousPlayerNames: [],
    };
    const sanitized = sanitizeState(state);
    expect(sanitized.finishedGames.map((g) => g.id)).toEqual(['g1']);
  });

  it('drops a draft that belongs to a different game', () => {
    const state = makeState();
    state.activeRoundDraft = makeDraft('some-other-game');
    saveState(state);
    expect(loadState().activeRoundDraft).toBeNull();
  });

  it('handles primitives, arrays and null', () => {
    expect(sanitizeState(null)).toEqual(createEmptyState());
    expect(sanitizeState(42)).toEqual(createEmptyState());
    expect(sanitizeState([1, 2, 3])).toEqual(createEmptyState());
    expect(sanitizeState('hello')).toEqual(createEmptyState());
  });

  it('reports a failed write instead of throwing', () => {
    const spy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('quota');
    });
    expect(saveState(createEmptyState())).toBe(false);
    spy.mockRestore();
  });

  it('never drops completed games because of a history limit', () => {
    const many: Game[] = [];
    for (let i = 0; i < 40; i += 1) many.push({ ...makeGame(), id: `g${i}` });
    const state: PersistedAppState = { ...createEmptyState(), finishedGames: many };
    saveState(state);
    expect(loadState().finishedGames).toHaveLength(40);
  });
});

describe('backup', () => {
  it('exports and re-imports a state unchanged', () => {
    const state = makeState();
    const text = serializeBackup(state, 1_700_000_100_000);
    const result = parseBackup(text);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.state).toEqual(state);
  });

  it('writes an identifiable envelope', () => {
    const parsed = JSON.parse(serializeBackup(makeState(), 5)) as Record<string, unknown>;
    expect(parsed.format).toBe(BACKUP_FORMAT);
    expect(parsed.schemaVersion).toBe(SCHEMA_VERSION);
    expect(parsed.exportedAt).toBe(5);
  });

  it('rejects invalid JSON', () => {
    const result = parseBackup('nope');
    expect(result).toEqual({ ok: false, reason: 'parse' });
  });

  it('rejects a file that is not a backup envelope', () => {
    expect(parseBackup(JSON.stringify({ hello: 'world' })).ok).toBe(false);
    expect(parseBackup(JSON.stringify(makeState())).ok).toBe(false);
  });

  it('rejects an envelope from an unknown schema version', () => {
    const text = JSON.stringify({
      format: BACKUP_FORMAT,
      schemaVersion: 2,
      exportedAt: 1,
      state: makeState(),
    });
    expect(parseBackup(text).ok).toBe(false);
  });

  it('rejects a backup whose games are all unreadable rather than wiping data', () => {
    const broken = makeState();
    broken.activeGame!.rounds[0]!.outcomes[0]!.hearts = 99;
    broken.finishedGames[0]!.rounds[0]!.outcomes[0]!.hearts = 99;
    const text = serializeBackup(broken, 1);
    const result = parseBackup(text);
    expect(result.ok).toBe(false);
  });

  it('rejects an empty backup so current data is never replaced by nothing', () => {
    const text = serializeBackup(createEmptyState(), 1);
    expect(parseBackup(text)).toEqual({ ok: false, reason: 'empty' });
  });
});
