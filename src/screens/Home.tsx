import { useState } from 'react';
import { Button } from '../components/Button';
import { Card, SectionTitle } from '../components/Screen';
import { STRINGS } from '../lib/strings';
import { shareAppLink } from '../lib/share';
import type { GameApi } from '../hooks/useGame';

export function Home({ api }: { api: GameApi }) {
  const { activeGame, status, setRoute, notify } = api;
  const [shareFallback, setShareFallback] = useState<string | null>(null);

  const nextRoundNumber = activeGame ? activeGame.rounds.length + 1 : 1;

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-2xl flex-col">
      <header className="safe-top safe-x pb-6 text-center">
        <h1 className="text-3xl font-bold text-gold">{STRINGS.appName}</h1>
        <p className="mt-2 text-sm text-ink-dim">{STRINGS.tagline}</p>
      </header>

      <main
        aria-label={STRINGS.mainLandmark}
        className="safe-x safe-bottom flex flex-1 flex-col gap-3"
      >
        {activeGame ? (
          <Card>
            <SectionTitle>{STRINGS.currentGamePlayers}</SectionTitle>
            <p className="text-base leading-relaxed text-ink">
              {[...activeGame.players]
                .sort((a, b) => a.order - b.order)
                .map((p) => p.name)
                .join('، ')}
            </p>
            <p className="num mt-2 text-sm text-ink-dim">
              {status.isOver ? STRINGS.finishedGameBadge : STRINGS.nextRoundLine(nextRoundNumber)}
            </p>
            <Button
              variant="primary"
              block
              className="mt-4"
              onClick={() => setRoute({ name: 'game' })}
            >
              {STRINGS.continueGame}
            </Button>
          </Card>
        ) : null}

        <Button
          variant={activeGame ? 'secondary' : 'primary'}
          block
          onClick={() => setRoute({ name: 'newGame' })}
        >
          {STRINGS.newGame}
        </Button>
        <Button variant="secondary" block onClick={() => setRoute({ name: 'history' })}>
          {STRINGS.previousGames}
        </Button>
        <Button variant="secondary" block onClick={() => setRoute({ name: 'help' })}>
          {STRINGS.howScoringWorks}
        </Button>
        <Button variant="secondary" block onClick={() => setRoute({ name: 'backup' })}>
          {STRINGS.backup}
        </Button>

        <Card className="mt-2">
          <SectionTitle>{STRINGS.installTitle}</SectionTitle>
          <p className="text-sm leading-relaxed text-ink-dim">{STRINGS.installHint}</p>
          <p className="mt-2 text-sm text-good">{STRINGS.offlineReady}</p>
          <Button
            variant="ghost"
            block
            className="mt-2"
            onClick={() => {
              void shareAppLink().then((outcome) => {
                if (outcome === 'copied') notify(STRINGS.shareAppCopied, 'success');
                else if (outcome === 'manual') setShareFallback(window.location.href);
              });
            }}
          >
            {STRINGS.shareApp}
          </Button>
          {shareFallback ? (
            <p className="mt-2 rounded-lg border border-line bg-night p-2 text-xs break-all text-ink select-all">
              {shareFallback}
            </p>
          ) : null}
        </Card>
      </main>
    </div>
  );
}
