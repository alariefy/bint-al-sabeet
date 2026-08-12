import { Button } from '../components/Button';
import { Card, Screen, SectionTitle } from '../components/Screen';
import { PlayerRoundCard } from '../components/PlayerRoundCard';
import { formatCount, formatSignedNumber } from '../lib/format';
import { GLYPH, STRINGS, validationMessage } from '../lib/strings';
import { diamondValue, queenValue } from '../lib/scoring';
import type { GameApi } from '../hooks/useGame';
import type { Game, PlayerId, RoundDraft } from '../lib/types';

function CaptorPicker({
  legend,
  glyph,
  valueLine,
  players,
  selected,
  onSelect,
}: {
  legend: string;
  glyph: string;
  valueLine: string;
  players: { id: PlayerId; name: string }[];
  selected: PlayerId | null;
  onSelect: (id: PlayerId) => void;
}) {
  return (
    <Card>
      <SectionTitle>
        <span className="glyph" aria-hidden="true">
          {glyph}
        </span>{' '}
        {legend}
      </SectionTitle>
      <p className="num mb-3 text-xs text-ink-dim">{valueLine}</p>
      <div role="radiogroup" aria-label={legend} className="flex flex-wrap gap-2">
        {players.map((player) => {
          const checked = selected === player.id;
          return (
            <button
              key={player.id}
              type="button"
              role="radio"
              aria-checked={checked}
              onClick={() => onSelect(player.id)}
              className={[
                'min-h-12 flex-1 basis-[45%] rounded-xl border px-3 py-3 text-sm transition-colors',
                checked
                  ? 'border-gold bg-gold font-bold text-night'
                  : 'border-line bg-raised text-ink',
              ].join(' ')}
            >
              {player.name}
            </button>
          );
        })}
      </div>
      {selected === null ? (
        <p className="mt-2 text-xs text-ink-dim">{STRINGS.captorNotChosen}</p>
      ) : null}
    </Card>
  );
}

export function RoundEntry({ api, game, draft }: { api: GameApi; game: Game; draft: RoundDraft }) {
  const {
    draftRoundNumber,
    draftErrors,
    draftPreview,
    draftKabootPlayerId,
    heartsRemaining,
    setHearts,
    giveRemainingHearts,
    setWonTrick,
    setQueenCaptor,
    setDiamondCaptor,
    setPhase,
    cancelDraft,
  } = api;

  const players = [...game.players].sort((a, b) => a.order - b.order);
  const playerName = (id: PlayerId | null | undefined) =>
    game.players.find((p) => p.id === id)?.name ?? '';

  const blockingError = draftErrors[0];
  const canReview = draftErrors.length === 0;

  return (
    <Screen
      title={STRINGS.roundEntryTitle(draftRoundNumber)}
      subtitle={
        heartsRemaining > 0 ? STRINGS.heartsRemaining(heartsRemaining) : STRINGS.heartsRemainingNone
      }
      onBack={draft.editingRoundId ? cancelDraft : () => setPhase('playing')}
      backLabel={draft.editingRoundId ? STRINGS.cancel : STRINGS.back}
      footer={
        <div className="flex flex-col gap-2">
          <p role="status" aria-live="polite" className="min-h-5 text-sm text-bad">
            {blockingError
              ? validationMessage(blockingError.code, {
                  playerName: playerName(blockingError.playerId),
                  ...(blockingError.expected === undefined
                    ? {}
                    : { expected: blockingError.expected }),
                  ...(blockingError.actual === undefined ? {} : { actual: blockingError.actual }),
                })
              : ''}
          </p>
          <Button variant="primary" block disabled={!canReview} onClick={() => setPhase('review')}>
            {STRINGS.reviewRound}
          </Button>
        </div>
      }
    >
      <div className="flex flex-col gap-4">
        {draftKabootPlayerId ? (
          <div className="rounded-card border-2 border-gold bg-gold-soft/25 p-4">
            <p className="text-lg font-bold text-gold">{STRINGS.kabootBannerTitle}</p>
            <p className="mt-1 text-sm text-ink">
              {STRINGS.kabootBannerBody(playerName(draftKabootPlayerId))}
            </p>
            <p className="mt-1 text-xs text-ink-dim">{STRINGS.kabootBannerRule}</p>
          </div>
        ) : null}

        <CaptorPicker
          legend={STRINGS.queenCaptorQuestion}
          glyph={GLYPH.spade}
          valueLine={STRINGS.queenValueLine(queenValue(draft.declarations.queenDoubled))}
          players={players}
          selected={draft.queenCaptorId}
          onSelect={setQueenCaptor}
        />

        <CaptorPicker
          legend={STRINGS.diamondCaptorQuestion}
          glyph={GLYPH.diamond}
          valueLine={STRINGS.diamondValueLine(diamondValue(draft.declarations.diamondDoubled))}
          players={players}
          selected={draft.diamondCaptorId}
          onSelect={setDiamondCaptor}
        />

        <ul className="flex flex-col gap-4">
          {players.map((player) => {
            const outcome = draft.outcomes.find((o) => o.playerId === player.id) ?? {
              playerId: player.id,
              hearts: 0,
              wonAnyTrick: false,
            };
            return (
              <PlayerRoundCard
                key={player.id}
                player={player}
                outcome={outcome}
                declaredMils={draft.declarations.milsPlayerIds.includes(player.id)}
                capturedQueen={draft.queenCaptorId === player.id}
                capturedDiamond={draft.diamondCaptorId === player.id}
                heartsRemaining={heartsRemaining}
                previewDelta={draftPreview?.deltas[player.id] ?? 0}
                onHeartsChange={(next) => setHearts(player.id, next)}
                onGiveRemaining={() => giveRemainingHearts(player.id)}
                onWonTrickChange={(next) => setWonTrick(player.id, next)}
              />
            );
          })}
        </ul>

        <Card>
          <SectionTitle>{STRINGS.livePreviewTitle}</SectionTitle>
          <ul className="flex flex-col gap-1">
            {players.map((player) => (
              <li key={player.id} className="flex items-baseline justify-between gap-3">
                <span className="text-sm text-ink">{player.name}</span>
                <span className="num text-base font-bold text-ink">
                  {formatSignedNumber(draftPreview?.deltas[player.id] ?? 0)}
                </span>
              </li>
            ))}
          </ul>
          <p className="num mt-3 text-xs text-ink-dim">
            {STRINGS.heartsAssigned(13 - heartsRemaining, 13)}{' '}
            {heartsRemaining > 0 ? `(${formatCount(heartsRemaining)})` : ''}
          </p>
        </Card>
      </div>
    </Screen>
  );
}
