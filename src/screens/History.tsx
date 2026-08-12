import { useState } from 'react';
import { Button } from '../components/Button';
import { Dialog } from '../components/Dialog';
import { Card, Screen, SectionTitle } from '../components/Screen';
import { ScoreTable } from '../components/ScoreTable';
import { formatDate, formatNumber } from '../lib/format';
import { STRINGS } from '../lib/strings';
import { computeGameSummary } from '../lib/scoring';
import type { GameApi } from '../hooks/useGame';

export function History({ api }: { api: GameApi }) {
  const { state, setRoute, deleteFinishedGame, notify } = api;
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const games = state.finishedGames;

  return (
    <Screen title={STRINGS.historyTitle} onBack={() => setRoute({ name: 'home' })}>
      {games.length === 0 ? (
        <Card>
          <p className="text-sm text-ink-dim">{STRINGS.historyEmpty}</p>
        </Card>
      ) : (
        <ul className="flex flex-col gap-3">
          {games.map((game) => {
            const { totals, status, roundCount } = computeGameSummary(game);
            const winners = game.players
              .filter((p) => status.winnerIds.includes(p.id))
              .map((p) => p.name)
              .join('، ');
            return (
              <Card as="li" key={game.id}>
                <div className="flex items-baseline justify-between gap-3">
                  <p className="num text-sm text-ink-dim">{formatDate(game.createdAt)}</p>
                  <p className="num text-sm text-ink-dim">
                    {STRINGS.historyRoundCount(roundCount)}
                  </p>
                </div>
                <p className="mt-2 text-base text-ink">
                  {[...game.players]
                    .sort((a, b) => a.order - b.order)
                    .map((p) => p.name)
                    .join('، ')}
                </p>
                <p className="mt-1 text-sm font-bold text-gold">
                  {status.winnerIds.length > 1
                    ? `${STRINGS.jointWinnersLabel}: ${winners}`
                    : `${STRINGS.winnerLabel}: ${winners}`}
                </p>
                <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1">
                  {[...game.players]
                    .sort((a, b) => a.order - b.order)
                    .map((player) => (
                      <li key={player.id} className="text-sm text-ink-dim">
                        {player.name}{' '}
                        <span className="num font-bold text-ink">
                          {formatNumber(totals[player.id] ?? 0)}
                        </span>
                      </li>
                    ))}
                </ul>
                <div className="mt-3 flex flex-col gap-2">
                  <Button
                    variant="secondary"
                    block
                    onClick={() => setRoute({ name: 'historyGame', gameId: game.id })}
                  >
                    {STRINGS.openGame}
                  </Button>
                  <Button variant="danger" block onClick={() => setConfirmId(game.id)}>
                    {STRINGS.deleteGame}
                  </Button>
                </div>
              </Card>
            );
          })}
        </ul>
      )}

      <Dialog
        open={confirmId !== null}
        title={STRINGS.deleteGameTitle}
        body={STRINGS.deleteGameBody}
        confirmLabel={STRINGS.delete}
        destructive
        onConfirm={() => {
          if (confirmId) {
            deleteFinishedGame(confirmId);
            notify(STRINGS.gameDeleted, 'info');
          }
          setConfirmId(null);
        }}
        onCancel={() => setConfirmId(null)}
      />
    </Screen>
  );
}

export function HistoryGame({ api, gameId }: { api: GameApi; gameId: string }) {
  const { state, setRoute } = api;
  const game = state.finishedGames.find((g) => g.id === gameId);

  if (!game) {
    return (
      <Screen title={STRINGS.historyGameTitle} onBack={() => setRoute({ name: 'history' })}>
        <Card>
          <p className="text-sm text-ink-dim">{STRINGS.historyEmpty}</p>
        </Card>
      </Screen>
    );
  }

  const { totals, status, roundCount } = computeGameSummary(game);

  return (
    <Screen
      title={STRINGS.historyGameTitle}
      subtitle={`${formatDate(game.createdAt)} · ${STRINGS.historyRoundCount(roundCount)}`}
      onBack={() => setRoute({ name: 'history' })}
    >
      <div className="flex flex-col gap-4">
        <Card>
          <SectionTitle>{STRINGS.finalScores}</SectionTitle>
          <ul className="flex flex-col gap-2">
            {[...game.players]
              .sort((a, b) => a.order - b.order)
              .map((player) => (
                <li key={player.id} className="flex items-baseline justify-between gap-3">
                  <span className="flex items-center gap-2 text-base text-ink">
                    {player.name}
                    {status.winnerIds.includes(player.id) ? (
                      <span className="rounded-md border border-gold px-2 py-0.5 text-xs font-bold text-gold">
                        {STRINGS.winnerLabel}
                      </span>
                    ) : null}
                  </span>
                  <span className="num text-xl font-bold text-ink">
                    {formatNumber(totals[player.id] ?? 0)}
                  </span>
                </li>
              ))}
          </ul>
          <p className="mt-3 text-xs text-ink-dim">{STRINGS.readOnlyNote}</p>
        </Card>

        {game.rounds.length > 0 ? (
          <section>
            <SectionTitle>{STRINGS.roundHistory}</SectionTitle>
            <ScoreTable game={game} totals={totals} leaderIds={status.winnerIds} />
          </section>
        ) : null}
      </div>
    </Screen>
  );
}
