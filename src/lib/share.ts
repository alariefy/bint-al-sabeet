/**
 * Sharing helpers. Web Share first, clipboard second, selectable text last.
 */

import { formatNumber } from './format';
import { STRINGS } from './strings';
import type { Game, GameOverStatus, PlayerId } from './types';

export type ShareOutcome = 'shared' | 'copied' | 'manual';

export function buildResultText(
  game: Game,
  totals: Record<PlayerId, number>,
  status: GameOverStatus,
): string {
  const lines: string[] = [STRINGS.appName];
  lines.push(STRINGS.shareRoundsLine(game.rounds.length));
  lines.push('');
  for (const player of [...game.players].sort((a, b) => a.order - b.order)) {
    lines.push(`${player.name}: ${formatNumber(totals[player.id] ?? 0)}`);
  }
  lines.push('');
  const names = game.players
    .filter((p) => status.winnerIds.includes(p.id))
    .map((p) => p.name)
    .join('، ');
  lines.push(status.isOver ? STRINGS.shareWinnerLine(names) : STRINGS.shareLeaderLine(names));
  return lines.join('\n');
}

async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    /* Fall through to the manual path. */
  }
  return false;
}

/** Tries Web Share, then the clipboard, then reports that manual copy is needed. */
export async function shareText(text: string, title: string): Promise<ShareOutcome> {
  try {
    if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
      await navigator.share({ title, text });
      return 'shared';
    }
  } catch (error) {
    /* A cancelled share should not fall back to a surprise clipboard write. */
    if (error instanceof DOMException && error.name === 'AbortError') return 'shared';
  }
  return (await copyToClipboard(text)) ? 'copied' : 'manual';
}

export async function shareAppLink(): Promise<ShareOutcome> {
  const url = typeof window !== 'undefined' ? window.location.href : '';
  try {
    if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
      await navigator.share({ title: STRINGS.appName, url });
      return 'shared';
    }
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') return 'shared';
  }
  return (await copyToClipboard(url)) ? 'copied' : 'manual';
}
