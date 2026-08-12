/**
 * Domain types for the بنت السبيت scorekeeper.
 *
 * Raw round inputs are the only source of truth. Every cumulative total,
 * winner and game-over decision is derived by replaying saved rounds.
 */

export type PlayerId = string;

export interface Player {
  id: PlayerId;
  name: string;
  order: number;
}

/** Public declarations made before the physical round starts. */
export interface RoundDeclarations {
  milsPlayerIds: PlayerId[];
  queenDoubled: boolean;
  diamondDoubled: boolean;
}

export interface PlayerRoundOutcome {
  playerId: PlayerId;
  hearts: number;
  wonAnyTrick: boolean;
}

export interface RoundInput {
  id: string;
  createdAt: number;
  declarations: RoundDeclarations;
  outcomes: PlayerRoundOutcome[];
  queenCaptorId: PlayerId;
  diamondCaptorId: PlayerId;
}

export interface Game {
  id: string;
  createdAt: number;
  players: Player[];
  rounds: RoundInput[];
}

export type RoundDraftPhase = 'declarations' | 'playing' | 'entry' | 'review';

export interface RoundDraft {
  gameId: string;
  phase: RoundDraftPhase;
  declarations: RoundDeclarations;
  outcomes: PlayerRoundOutcome[];
  queenCaptorId: PlayerId | null;
  diamondCaptorId: PlayerId | null;
  /** Set when the draft is a correction of an already saved round. */
  editingRoundId: string | null;
}

export interface PersistedAppState {
  schemaVersion: 1;
  activeGame: Game | null;
  activeRoundDraft: RoundDraft | null;
  finishedGames: Game[];
  previousPlayerNames: string[];
}

/* ------------------------------------------------------------------ */
/* Validation                                                          */
/* ------------------------------------------------------------------ */

export type ValidationCode =
  | 'playerCount'
  | 'duplicatePlayerId'
  | 'outcomeCount'
  | 'outcomeMismatch'
  | 'duplicateOutcome'
  | 'heartsNotInteger'
  | 'heartsRange'
  | 'heartsTotal'
  | 'queenCaptorMissing'
  | 'queenCaptorInvalid'
  | 'diamondCaptorMissing'
  | 'diamondCaptorInvalid'
  | 'captorWithoutTrick'
  | 'heartsWithoutTrick'
  | 'noTrickWinner'
  | 'milsUnknownPlayer'
  | 'milsDuplicate'
  | 'doublingNotBoolean'
  | 'pointsTotalMismatch';

export interface ValidationError {
  code: ValidationCode;
  /** Player the error belongs to, when it is player specific. */
  playerId?: PlayerId;
  expected?: number;
  actual?: number;
}

/* ------------------------------------------------------------------ */
/* Calculated round                                                    */
/* ------------------------------------------------------------------ */

/**
 * Structured reason for a player's round delta. The scoring engine stays
 * language free; Arabic wording lives in `strings.ts`.
 */
export type RoundExplanation =
  | { kind: 'kabootTaker' }
  | { kind: 'kabootOther' }
  | { kind: 'milsSuccess' }
  | { kind: 'milsFailure'; hearts: number; queen: number; diamond: number; total: number }
  | { kind: 'noTrick' }
  | { kind: 'harmlessTrick' }
  | { kind: 'captured'; hearts: number; queen: number; diamond: number; total: number };

export interface PlayerRoundResult {
  playerId: PlayerId;
  hearts: number;
  wonAnyTrick: boolean;
  declaredMils: boolean;
  capturedQueen: boolean;
  capturedDiamond: boolean;
  /** Point value of the queen for this player (0 when not captured). */
  queenPoints: number;
  /** Point value of the ten of diamonds for this player (0 when not captured). */
  diamondPoints: number;
  capturedPoints: number;
  delta: number;
  explanation: RoundExplanation;
}

export interface CalculatedRound {
  roundId: string;
  isKaboot: boolean;
  kabootPlayerId: PlayerId | null;
  queenPoints: number;
  diamondPoints: number;
  distributedPoints: number;
  results: PlayerRoundResult[];
  deltas: Record<PlayerId, number>;
}

export interface GameOverStatus {
  isOver: boolean;
  winnerIds: PlayerId[];
}
