/**
 * The single game-state hook. Owns the persisted state, exposes derived
 * totals, and writes the complete next state on every meaningful mutation.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createId } from '../lib/id';
import { loadState, saveState } from '../lib/storage';
import {
  RULES,
  checkGameOver,
  computeTotals,
  findKabootPlayerId,
  scoreRoundUnchecked,
} from '../lib/scoring';
import { validateRound } from '../lib/validation';
import type {
  CalculatedRound,
  Game,
  GameOverStatus,
  PersistedAppState,
  Player,
  PlayerId,
  RoundDeclarations,
  RoundDraft,
  RoundInput,
  ValidationError,
} from '../lib/types';

export type RouteName = 'home' | 'newGame' | 'game' | 'history' | 'historyGame' | 'help' | 'backup';

export type Route =
  { name: Exclude<RouteName, 'historyGame'> } | { name: 'historyGame'; gameId: string };

export type ToastTone = 'info' | 'success' | 'error';

export interface Toast {
  id: number;
  message: string;
  tone: ToastTone;
  actionLabel?: string;
  onAction?: () => void;
}

export interface PendingUndo {
  round: RoundInput;
  index: number;
}

export const UNDO_TIMEOUT_MS = 10_000;

function emptyOutcomes(players: Player[]) {
  return players.map((p) => ({ playerId: p.id, hearts: 0, wonAnyTrick: false }));
}

function upsertFinished(state: PersistedAppState, game: Game): Game[] {
  const totals = computeTotals(game.players, game.rounds);
  const isOver = checkGameOver(game.players, totals).isOver;
  const index = state.finishedGames.findIndex((g) => g.id === game.id);
  const next = state.finishedGames.slice();
  if (isOver) {
    if (index >= 0) next[index] = game;
    else next.unshift(game);
  } else if (index >= 0) {
    next.splice(index, 1);
  }
  return next;
}

/** Replaces the active game and keeps the finished-game archive in step. */
function withGame(state: PersistedAppState, game: Game): PersistedAppState {
  return { ...state, activeGame: game, finishedGames: upsertFinished(state, game) };
}

export function useGame() {
  const [state, setState] = useState<PersistedAppState>(() => loadState());
  const [route, setRoute] = useState<Route>({ name: 'home' });
  const [toast, setToast] = useState<Toast | null>(null);
  const [storageWorks, setStorageWorks] = useState(true);
  const [pendingUndo, setPendingUndo] = useState<PendingUndo | null>(null);

  const stateRef = useRef(state);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const undoTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const toastId = useRef(0);

  /** Writes the whole next state synchronously so no tap is ever lost. */
  const commit = useCallback((updater: (prev: PersistedAppState) => PersistedAppState) => {
    const next = updater(stateRef.current);
    stateRef.current = next;
    setState(next);
    if (!saveState(next)) setStorageWorks(false);
  }, []);

  const clearUndo = useCallback(() => {
    if (undoTimer.current) clearTimeout(undoTimer.current);
    undoTimer.current = null;
    setPendingUndo(null);
  }, []);

  const notify = useCallback(
    (message: string, tone: ToastTone = 'info', action?: { label: string; run: () => void }) => {
      toastId.current += 1;
      if (toastTimer.current) clearTimeout(toastTimer.current);
      setToast({
        id: toastId.current,
        message,
        tone,
        ...(action ? { actionLabel: action.label, onAction: action.run } : {}),
      });
      toastTimer.current = setTimeout(() => setToast(null), action ? UNDO_TIMEOUT_MS : 4000);
    },
    [],
  );

  const dismissToast = useCallback(() => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast(null);
  }, []);

  useEffect(
    () => () => {
      if (toastTimer.current) clearTimeout(toastTimer.current);
      if (undoTimer.current) clearTimeout(undoTimer.current);
    },
    [],
  );

  /* ---------------------------------------------------------------- */
  /* Derived values                                                    */
  /* ---------------------------------------------------------------- */

  const activeGame = state.activeGame;
  const draft = state.activeRoundDraft;

  const totals = useMemo<Record<PlayerId, number>>(
    () => (activeGame ? computeTotals(activeGame.players, activeGame.rounds) : {}),
    [activeGame],
  );

  const status = useMemo<GameOverStatus>(
    () =>
      activeGame ? checkGameOver(activeGame.players, totals) : { isOver: false, winnerIds: [] },
    [activeGame, totals],
  );

  const editingIndex = useMemo(() => {
    if (!activeGame || !draft?.editingRoundId) return -1;
    return activeGame.rounds.findIndex((r) => r.id === draft.editingRoundId);
  }, [activeGame, draft]);

  /** The human-facing number of the round currently being entered. */
  const draftRoundNumber = useMemo(() => {
    if (!activeGame) return 1;
    if (editingIndex >= 0) return editingIndex + 1;
    return activeGame.rounds.length + 1;
  }, [activeGame, editingIndex]);

  const draftRoundInput = useMemo<RoundInput | null>(() => {
    if (!activeGame || !draft) return null;
    const existing = editingIndex >= 0 ? activeGame.rounds[editingIndex] : undefined;
    return {
      id: existing?.id ?? 'draft',
      /* Only used for validation and the preview; the real timestamp is
         stamped when the round is confirmed. */
      createdAt: existing?.createdAt ?? 0,
      declarations: draft.declarations,
      outcomes: draft.outcomes,
      queenCaptorId: draft.queenCaptorId ?? '',
      diamondCaptorId: draft.diamondCaptorId ?? '',
    };
  }, [activeGame, draft, editingIndex]);

  const draftErrors = useMemo<ValidationError[]>(() => {
    if (!activeGame || !draftRoundInput) return [];
    return validateRound(activeGame.players, draftRoundInput);
  }, [activeGame, draftRoundInput]);

  /** Live preview. Tolerates an incomplete round so scores update as you type. */
  const draftPreview = useMemo<CalculatedRound | null>(() => {
    if (!activeGame || !draft) return null;
    return scoreRoundUnchecked(activeGame.players, {
      id: 'draft',
      declarations: draft.declarations,
      outcomes: draft.outcomes,
      queenCaptorId: draft.queenCaptorId,
      diamondCaptorId: draft.diamondCaptorId,
    });
  }, [activeGame, draft]);

  const draftKabootPlayerId = useMemo(() => {
    if (!draft) return null;
    return findKabootPlayerId({
      id: 'draft',
      declarations: draft.declarations,
      outcomes: draft.outcomes,
      queenCaptorId: draft.queenCaptorId,
      diamondCaptorId: draft.diamondCaptorId,
    });
  }, [draft]);

  const heartsAssigned = useMemo(
    () => (draft ? draft.outcomes.reduce((sum, o) => sum + o.hearts, 0) : 0),
    [draft],
  );
  const heartsRemaining = Math.max(0, RULES.HEARTS_TOTAL - heartsAssigned);

  /* ---------------------------------------------------------------- */
  /* Game lifecycle                                                    */
  /* ---------------------------------------------------------------- */

  const startGame = useCallback(
    (names: string[]) => {
      const players: Player[] = names.map((name, index) => ({
        id: createId('pl'),
        name: name.trim(),
        order: index,
      }));
      const game: Game = { id: createId('gm'), createdAt: Date.now(), players, rounds: [] };
      clearUndo();
      commit((prev) => ({
        ...prev,
        activeGame: game,
        activeRoundDraft: null,
        previousPlayerNames: players.map((p) => p.name),
      }));
      setRoute({ name: 'game' });
    },
    [clearUndo, commit],
  );

  const startRound = useCallback(() => {
    const game = stateRef.current.activeGame;
    if (!game) return;
    clearUndo();
    commit((prev) => ({
      ...prev,
      activeRoundDraft: {
        gameId: game.id,
        phase: 'declarations',
        declarations: { milsPlayerIds: [], queenDoubled: false, diamondDoubled: false },
        outcomes: emptyOutcomes(game.players),
        queenCaptorId: null,
        diamondCaptorId: null,
        editingRoundId: null,
      },
    }));
  }, [clearUndo, commit]);

  const updateDraft = useCallback(
    (updater: (draft: RoundDraft) => RoundDraft) => {
      commit((prev) =>
        prev.activeRoundDraft
          ? { ...prev, activeRoundDraft: updater(prev.activeRoundDraft) }
          : prev,
      );
    },
    [commit],
  );

  const setDeclarations = useCallback(
    (next: RoundDeclarations) => updateDraft((d) => ({ ...d, declarations: next })),
    [updateDraft],
  );

  const toggleMils = useCallback(
    (playerId: PlayerId) =>
      updateDraft((d) => {
        const has = d.declarations.milsPlayerIds.includes(playerId);
        return {
          ...d,
          declarations: {
            ...d.declarations,
            milsPlayerIds: has
              ? d.declarations.milsPlayerIds.filter((id) => id !== playerId)
              : [...d.declarations.milsPlayerIds, playerId],
          },
        };
      }),
    [updateDraft],
  );

  const setPhase = useCallback(
    (phase: RoundDraft['phase']) => updateDraft((d) => ({ ...d, phase })),
    [updateDraft],
  );

  const setHearts = useCallback(
    (playerId: PlayerId, hearts: number) =>
      updateDraft((d) => {
        const others = d.outcomes
          .filter((o) => o.playerId !== playerId)
          .reduce((sum, o) => sum + o.hearts, 0);
        const capped = Math.max(0, Math.min(hearts, RULES.HEARTS_TOTAL - others));
        return {
          ...d,
          outcomes: d.outcomes.map((o) =>
            o.playerId === playerId
              ? /* Taking a heart always means a trick was won; losing every
                   heart never clears the flag, because a harmless trick may
                   still have been won. */
                { ...o, hearts: capped, wonAnyTrick: capped > 0 ? true : o.wonAnyTrick }
              : o,
          ),
        };
      }),
    [updateDraft],
  );

  const giveRemainingHearts = useCallback(
    (playerId: PlayerId) =>
      updateDraft((d) => {
        const assigned = d.outcomes.reduce((sum, o) => sum + o.hearts, 0);
        const remaining = Math.max(0, RULES.HEARTS_TOTAL - assigned);
        if (remaining === 0) return d;
        return {
          ...d,
          outcomes: d.outcomes.map((o) =>
            o.playerId === playerId ? { ...o, hearts: o.hearts + remaining, wonAnyTrick: true } : o,
          ),
        };
      }),
    [updateDraft],
  );

  const setWonTrick = useCallback(
    (playerId: PlayerId, wonAnyTrick: boolean) =>
      updateDraft((d) => ({
        ...d,
        outcomes: d.outcomes.map((o) => (o.playerId === playerId ? { ...o, wonAnyTrick } : o)),
      })),
    [updateDraft],
  );

  const setQueenCaptor = useCallback(
    (playerId: PlayerId) =>
      updateDraft((d) => ({
        ...d,
        queenCaptorId: playerId,
        outcomes: d.outcomes.map((o) =>
          o.playerId === playerId ? { ...o, wonAnyTrick: true } : o,
        ),
      })),
    [updateDraft],
  );

  const setDiamondCaptor = useCallback(
    (playerId: PlayerId) =>
      updateDraft((d) => ({
        ...d,
        diamondCaptorId: playerId,
        outcomes: d.outcomes.map((o) =>
          o.playerId === playerId ? { ...o, wonAnyTrick: true } : o,
        ),
      })),
    [updateDraft],
  );

  const cancelDraft = useCallback(() => {
    commit((prev) => ({ ...prev, activeRoundDraft: null }));
  }, [commit]);

  /** Saves the reviewed round and clears the draft. Rejects invalid rounds. */
  const confirmRound = useCallback((): boolean => {
    const current = stateRef.current;
    const game = current.activeGame;
    const currentDraft = current.activeRoundDraft;
    if (!game || !currentDraft) return false;
    if (currentDraft.queenCaptorId === null || currentDraft.diamondCaptorId === null) return false;

    const index = currentDraft.editingRoundId
      ? game.rounds.findIndex((r) => r.id === currentDraft.editingRoundId)
      : -1;
    const existing = index >= 0 ? game.rounds[index] : undefined;

    const round: RoundInput = {
      id: existing?.id ?? createId('rd'),
      createdAt: existing?.createdAt ?? Date.now(),
      declarations: currentDraft.declarations,
      outcomes: currentDraft.outcomes,
      queenCaptorId: currentDraft.queenCaptorId,
      diamondCaptorId: currentDraft.diamondCaptorId,
    };

    if (validateRound(game.players, round).length > 0) return false;

    const rounds = game.rounds.slice();
    if (index >= 0) rounds[index] = round;
    else rounds.push(round);

    const nextGame: Game = { ...game, rounds };
    clearUndo();
    commit((prev) => ({ ...withGame(prev, nextGame), activeRoundDraft: null }));
    return true;
  }, [clearUndo, commit]);

  const editRound = useCallback(
    (roundId: string) => {
      const game = stateRef.current.activeGame;
      if (!game) return;
      const round = game.rounds.find((r) => r.id === roundId);
      if (!round) return;
      clearUndo();
      commit((prev) => ({
        ...prev,
        activeRoundDraft: {
          gameId: game.id,
          phase: 'entry',
          declarations: round.declarations,
          outcomes: round.outcomes.map((o) => ({ ...o })),
          queenCaptorId: round.queenCaptorId,
          diamondCaptorId: round.diamondCaptorId,
          editingRoundId: round.id,
        },
      }));
    },
    [clearUndo, commit],
  );

  const restoreRound = useCallback(
    (round: RoundInput, index: number, message?: string) => {
      const game = stateRef.current.activeGame;
      if (!game) return;
      const rounds = game.rounds.slice();
      rounds.splice(Math.min(index, rounds.length), 0, round);
      commit((prev) => withGame(prev, { ...game, rounds }));
      clearUndo();
      if (message) notify(message, 'success');
    },
    [clearUndo, commit, notify],
  );

  const deleteRound = useCallback(
    (roundId: string, message: string, undoLabel: string, restoredMessage?: string) => {
      const game = stateRef.current.activeGame;
      if (!game) return;
      const index = game.rounds.findIndex((r) => r.id === roundId);
      if (index < 0) return;
      const removed = game.rounds[index]!;
      const rounds = game.rounds.filter((r) => r.id !== roundId);
      clearUndo();
      commit((prev) => ({
        ...withGame(prev, { ...game, rounds }),
        activeRoundDraft:
          prev.activeRoundDraft?.editingRoundId === roundId ? null : prev.activeRoundDraft,
      }));
      setPendingUndo({ round: removed, index });
      undoTimer.current = setTimeout(() => setPendingUndo(null), UNDO_TIMEOUT_MS);
      notify(message, 'info', {
        label: undoLabel,
        run: () => restoreRound(removed, index, restoredMessage),
      });
    },
    [clearUndo, commit, notify, restoreRound],
  );

  const deleteFinishedGame = useCallback(
    (gameId: string) => {
      clearUndo();
      commit((prev) => ({
        ...prev,
        finishedGames: prev.finishedGames.filter((g) => g.id !== gameId),
        activeGame: prev.activeGame?.id === gameId ? null : prev.activeGame,
        activeRoundDraft: prev.activeGame?.id === gameId ? null : prev.activeRoundDraft,
      }));
    },
    [clearUndo, commit],
  );

  const newGameSamePlayers = useCallback(() => {
    const game = stateRef.current.activeGame;
    if (!game) return;
    startGame(game.players.map((p) => p.name));
  }, [startGame]);

  const replaceState = useCallback(
    (next: PersistedAppState) => {
      clearUndo();
      commit(() => next);
      setRoute({ name: 'home' });
    },
    [clearUndo, commit],
  );

  return {
    state,
    route,
    setRoute,
    activeGame,
    draft,
    totals,
    status,
    storageWorks,
    toast,
    notify,
    dismissToast,
    pendingUndo,

    draftRoundNumber,
    draftRoundInput,
    draftErrors,
    draftPreview,
    draftKabootPlayerId,
    heartsAssigned,
    heartsRemaining,

    startGame,
    startRound,
    setDeclarations,
    toggleMils,
    setPhase,
    setHearts,
    giveRemainingHearts,
    setWonTrick,
    setQueenCaptor,
    setDiamondCaptor,
    cancelDraft,
    confirmRound,
    editRound,
    deleteRound,
    deleteFinishedGame,
    newGameSamePlayers,
    replaceState,
  };
}

export type GameApi = ReturnType<typeof useGame>;
