import { useState } from 'react';
import { Button } from '../components/Button';
import { Dialog } from '../components/Dialog';
import { Card, Screen, SectionTitle } from '../components/Screen';
import { ScoreTable } from '../components/ScoreTable';
import { formatNumber, formatSignedNumber } from '../lib/format';
import { GLYPH, STRINGS } from '../lib/strings';
import { RULES, calculateRound, diamondValue, queenValue } from '../lib/scoring';
import { buildResultText, shareText } from '../lib/share';
import type { GameApi } from '../hooks/useGame';
import type { Game } from '../lib/types';

type PickerMode = 'edit' | 'delete' | null;

export function Scoreboard({ api, game }: { api: GameApi; game: Game }) {
  const { totals, status, setRoute, startRound, editRound, deleteRound, notify } = api;
  const [picker, setPicker] = useState<PickerMode>(null);
  const [confirmDelete, setConfirmDelete] = useState<{ id: string; number: number } | null>(null);
  const [shareFallback, setShareFallback] = useState<string | null>(null);

  const players = [...game.players].sort((a, b) => a.order - b.order);
  const lastRound = game.rounds.at(-1);
  const lastDeltas = lastRound ? calculateRound(game.players, lastRound).deltas : null;
  const warned = players.filter((p) => (totals[p.id] ?? 0) >= RULES.WARNING_SCORE);

  return (
    <Screen
      title={STRINGS.scoreboardTitle}
      subtitle={STRINGS.roundNumberLine(game.rounds.length)}
      onBack={() => setRoute({ name: 'home' })}
      footer={
        <Button variant="primary" block onClick={startRound}>
          {STRINGS.startNewRound}
        </Button>
      }
    >
      <div className="flex flex-col gap-4">
        <Card>
          <SectionTitle>
            {status.winnerIds.length > 1 ? STRINGS.leadersLabel : STRINGS.leaderLabel}
          </SectionTitle>
          <p className="text-lg font-bold text-gold">
            {players
              .filter((p) => status.winnerIds.includes(p.id))
              .map((p) => p.name)
              .join('، ')}
          </p>
        </Card>

        {warned.length > 0 ? (
          <p
            role="status"
            className="rounded-xl border border-bad bg-surface px-4 py-3 text-sm text-ink"
          >
            {STRINGS.warningNearEnd(warned.map((p) => p.name).join('، '))}
          </p>
        ) : null}

        <ul className="flex flex-col gap-2">
          {players.map((player) => {
            const total = totals[player.id] ?? 0;
            const isLeader = status.winnerIds.includes(player.id);
            const delta = lastDeltas?.[player.id];
            const remaining = RULES.TARGET_SCORE - total;
            return (
              <li
                key={player.id}
                className={[
                  'flex items-center justify-between gap-3 rounded-card border bg-surface p-4',
                  isLeader ? 'border-gold' : 'border-line',
                ].join(' ')}
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-lg font-bold text-ink">{player.name}</h3>
                    {isLeader ? (
                      <span className="rounded-md border border-gold px-2 py-0.5 text-xs font-bold text-gold">
                        {STRINGS.leaderBadge}
                      </span>
                    ) : null}
                  </div>
                  <p className="num mt-1 text-xs text-ink-dim">
                    {remaining > 0 ? STRINGS.distanceToTarget(remaining) : STRINGS.reachedTarget}
                  </p>
                </div>
                <div className="shrink-0 text-left">
                  <p className="num text-3xl font-bold text-ink">{formatNumber(total)}</p>
                  {delta !== undefined ? (
                    <p
                      className={[
                        'num text-sm',
                        delta < 0 ? 'text-good' : delta > 0 ? 'text-bad' : 'text-ink-dim',
                      ].join(' ')}
                    >
                      {STRINGS.lastRoundChange} {formatSignedNumber(delta)}
                    </p>
                  ) : null}
                </div>
              </li>
            );
          })}
        </ul>

        {lastRound ? (
          <Card>
            <SectionTitle>{STRINGS.lastDeclarations}</SectionTitle>
            <p className="text-sm text-ink">
              {STRINGS.milsPlayersLine(
                players
                  .filter((p) => lastRound.declarations.milsPlayerIds.includes(p.id))
                  .map((p) => p.name)
                  .join('، ') || STRINGS.milsNone,
              )}
            </p>
            <p className="num mt-1 text-sm text-ink-dim">
              <span className="glyph" aria-hidden="true">
                {GLYPH.spade}
              </span>{' '}
              {STRINGS.queenValueLine(queenValue(lastRound.declarations.queenDoubled))}
            </p>
            <p className="num mt-1 text-sm text-ink-dim">
              <span className="glyph" aria-hidden="true">
                {GLYPH.diamond}
              </span>{' '}
              {STRINGS.diamondValueLine(diamondValue(lastRound.declarations.diamondDoubled))}
            </p>
          </Card>
        ) : (
          <Card>
            <p className="text-sm text-ink-dim">{STRINGS.noRoundsYet}</p>
          </Card>
        )}

        {game.rounds.length > 0 ? (
          <section>
            <SectionTitle>{STRINGS.roundHistory}</SectionTitle>
            <ScoreTable game={game} totals={totals} leaderIds={status.winnerIds} />
          </section>
        ) : null}

        <div className="flex flex-col gap-2">
          <Button
            variant="secondary"
            block
            onClick={() => {
              const text = buildResultText(game, totals, status);
              void shareText(text, STRINGS.appName).then((outcome) => {
                if (outcome === 'copied') notify(STRINGS.shareCopied, 'success');
                else if (outcome === 'manual') setShareFallback(text);
              });
            }}
          >
            {STRINGS.shareResult}
          </Button>
          {game.rounds.length > 0 ? (
            <>
              <Button variant="secondary" block onClick={() => setPicker('edit')}>
                {STRINGS.editRound}
              </Button>
              <Button variant="danger" block onClick={() => setPicker('delete')}>
                {STRINGS.deleteRound}
              </Button>
            </>
          ) : null}
          <Button variant="ghost" block onClick={() => setRoute({ name: 'newGame' })}>
            {STRINGS.newGame}
          </Button>
        </div>

        {shareFallback ? (
          <Card>
            <SectionTitle>{STRINGS.shareFallbackTitle}</SectionTitle>
            <p className="text-sm whitespace-pre-line text-ink select-all">{shareFallback}</p>
          </Card>
        ) : null}

        {picker ? (
          <Card>
            <SectionTitle>
              {picker === 'edit' ? STRINGS.chooseRoundToEdit : STRINGS.chooseRoundToDelete}
            </SectionTitle>
            <ul className="flex flex-col gap-2">
              {game.rounds.map((round, index) => (
                <li key={round.id}>
                  <Button
                    variant={picker === 'delete' ? 'danger' : 'secondary'}
                    block
                    onClick={() => {
                      setPicker(null);
                      if (picker === 'edit') editRound(round.id);
                      else setConfirmDelete({ id: round.id, number: index + 1 });
                    }}
                  >
                    <span className="num">{STRINGS.roundLabel(index + 1)}</span>
                  </Button>
                </li>
              ))}
            </ul>
            <Button variant="ghost" block className="mt-2" onClick={() => setPicker(null)}>
              {STRINGS.cancel}
            </Button>
          </Card>
        ) : null}
      </div>

      <Dialog
        open={confirmDelete !== null}
        title={STRINGS.deleteRoundTitle}
        body={confirmDelete ? STRINGS.deleteRoundBody(confirmDelete.number) : ''}
        confirmLabel={STRINGS.delete}
        destructive
        onConfirm={() => {
          if (confirmDelete) {
            deleteRound(
              confirmDelete.id,
              STRINGS.roundDeleted(confirmDelete.number),
              STRINGS.undo,
              STRINGS.roundRestored,
            );
          }
          setConfirmDelete(null);
        }}
        onCancel={() => setConfirmDelete(null)}
      />
    </Screen>
  );
}
