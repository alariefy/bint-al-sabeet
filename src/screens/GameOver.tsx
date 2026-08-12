import { useState } from 'react';
import { Button } from '../components/Button';
import { Card, Screen, SectionTitle } from '../components/Screen';
import { ScoreTable } from '../components/ScoreTable';
import { formatNumber } from '../lib/format';
import { STRINGS } from '../lib/strings';
import { buildResultText, shareText } from '../lib/share';
import type { GameApi } from '../hooks/useGame';
import type { Game } from '../lib/types';

export function GameOver({ api, game }: { api: GameApi; game: Game }) {
  const { totals, status, setRoute, editRound, newGameSamePlayers, notify } = api;
  const [shareFallback, setShareFallback] = useState<string | null>(null);

  const players = [...game.players].sort((a, b) => a.order - b.order);
  const winners = players.filter((p) => status.winnerIds.includes(p.id));
  const lastRound = game.rounds.at(-1);

  return (
    <Screen
      title={STRINGS.gameOverTitle}
      subtitle={STRINGS.completedRounds(game.rounds.length)}
      onBack={() => setRoute({ name: 'home' })}
      backLabel={STRINGS.backHome}
      footer={
        <Button variant="primary" block onClick={newGameSamePlayers}>
          {STRINGS.newGameSamePlayers}
        </Button>
      }
    >
      <div className="flex flex-col gap-4">
        <div className="rounded-card border-2 border-gold bg-gold-soft/20 p-5 text-center">
          <p className="text-sm font-bold tracking-wide text-gold">
            {winners.length > 1 ? STRINGS.jointWinnersLabel : STRINGS.winnerLabel}
          </p>
          <p className="mt-2 text-2xl font-bold text-ink">
            {winners.map((p) => p.name).join('، ')}
          </p>
          <p className="num mt-1 text-lg text-ink-dim">
            {formatNumber(winners[0] ? (totals[winners[0].id] ?? 0) : 0)}
          </p>
        </div>

        <section>
          <SectionTitle>{STRINGS.finalScores}</SectionTitle>
          <ul className="flex flex-col gap-2">
            {players.map((player) => {
              const isWinner = status.winnerIds.includes(player.id);
              return (
                <li
                  key={player.id}
                  className={[
                    'flex items-center justify-between gap-3 rounded-card border bg-surface p-4',
                    isWinner ? 'border-gold' : 'border-line',
                  ].join(' ')}
                >
                  <span className="flex items-center gap-2 text-base text-ink">
                    {player.name}
                    {isWinner ? (
                      <span className="rounded-md border border-gold px-2 py-0.5 text-xs font-bold text-gold">
                        {STRINGS.winnerLabel}
                      </span>
                    ) : null}
                  </span>
                  <span className="num text-2xl font-bold text-ink">
                    {formatNumber(totals[player.id] ?? 0)}
                  </span>
                </li>
              );
            })}
          </ul>
        </section>

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
          {lastRound ? (
            <Button variant="secondary" block onClick={() => editRound(lastRound.id)}>
              {STRINGS.fixLastRound}
            </Button>
          ) : null}
          <Button variant="secondary" block onClick={() => setRoute({ name: 'newGame' })}>
            {STRINGS.newGame}
          </Button>
          <Button variant="ghost" block onClick={() => setRoute({ name: 'home' })}>
            {STRINGS.backHome}
          </Button>
        </div>

        {shareFallback ? (
          <Card>
            <SectionTitle>{STRINGS.shareFallbackTitle}</SectionTitle>
            <p className="text-sm whitespace-pre-line text-ink select-all">{shareFallback}</p>
          </Card>
        ) : null}
      </div>
    </Screen>
  );
}
