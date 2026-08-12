import { calculateRound } from '../lib/scoring';
import { formatCount, formatNumber, formatSignedNumber } from '../lib/format';
import { STRINGS } from '../lib/strings';
import type { Game, PlayerId } from '../lib/types';

export interface ScoreTableProps {
  game: Game;
  totals: Record<PlayerId, number>;
  leaderIds: PlayerId[];
}

/** Full round-by-round table. Players keep their original seating order. */
export function ScoreTable({ game, totals, leaderIds }: ScoreTableProps) {
  const players = [...game.players].sort((a, b) => a.order - b.order);
  const rows = game.rounds.map((round, index) => ({
    number: index + 1,
    deltas: calculateRound(game.players, round).deltas,
  }));

  return (
    <div className="overflow-x-auto rounded-card border border-line bg-surface">
      <table className="w-full min-w-max text-right">
        <caption className="sr-only">{STRINGS.scoreTableCaption}</caption>
        <thead>
          <tr className="border-b border-line">
            <th scope="col" className="px-3 py-2 text-xs font-bold text-ink-dim">
              {STRINGS.roundColumn}
            </th>
            {players.map((player) => (
              <th
                key={player.id}
                scope="col"
                className="px-3 py-2 text-sm font-bold whitespace-nowrap text-ink"
              >
                {player.name}
                {leaderIds.includes(player.id) ? (
                  <span className="block text-[0.65rem] font-normal text-gold">
                    {STRINGS.leaderBadge}
                  </span>
                ) : null}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.number} className="border-b border-line/60">
              <th scope="row" className="num px-3 py-2 text-xs font-normal text-ink-dim">
                {formatCount(row.number)}
              </th>
              {players.map((player) => {
                const delta = row.deltas[player.id] ?? 0;
                return (
                  <td
                    key={player.id}
                    className={[
                      'num px-3 py-2 text-sm',
                      delta < 0 ? 'text-good' : delta > 0 ? 'text-bad' : 'text-ink-dim',
                    ].join(' ')}
                  >
                    {formatSignedNumber(delta)}
                  </td>
                );
              })}
            </tr>
          ))}
          <tr className="bg-raised">
            <th scope="row" className="px-3 py-3 text-xs font-bold text-ink-dim">
              {STRINGS.totalColumn}
            </th>
            {players.map((player) => (
              <td key={player.id} className="num px-3 py-3 text-lg font-bold text-ink">
                {formatNumber(totals[player.id] ?? 0)}
              </td>
            ))}
          </tr>
        </tbody>
      </table>
    </div>
  );
}
