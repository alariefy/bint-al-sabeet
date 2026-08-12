import { Button } from '../components/Button';
import { Card, Screen, SectionTitle } from '../components/Screen';
import { formatCount, formatNumber, formatSignedNumber } from '../lib/format';
import { GLYPH, STRINGS, explanationText } from '../lib/strings';
import { diamondValue, queenValue } from '../lib/scoring';
import type { GameApi } from '../hooks/useGame';
import type { Game, RoundDraft } from '../lib/types';

export function Review({ api, game, draft }: { api: GameApi; game: Game; draft: RoundDraft }) {
  const { draftRoundNumber, draftPreview, draftErrors, totals, setPhase, confirmRound, notify } =
    api;

  const players = [...game.players].sort((a, b) => a.order - b.order);
  const valid = draftErrors.length === 0 && draftPreview !== null;

  return (
    <Screen
      title={STRINGS.reviewTitle(draftRoundNumber)}
      subtitle={STRINGS.reviewIntro}
      onBack={() => setPhase('entry')}
      backLabel={STRINGS.backToEdit}
      footer={
        <div className="flex flex-col gap-2">
          {!valid ? (
            <p role="alert" className="text-sm text-bad">
              {STRINGS.cannotSaveInvalid}
            </p>
          ) : null}
          <Button
            variant="primary"
            block
            disabled={!valid}
            onClick={() => {
              if (confirmRound()) notify(STRINGS.roundSaved, 'success');
            }}
          >
            {STRINGS.confirmRound}
          </Button>
          <Button variant="ghost" block onClick={() => setPhase('entry')}>
            {STRINGS.backToEdit}
          </Button>
        </div>
      }
    >
      <div className="flex flex-col gap-4">
        <Card>
          <SectionTitle>{STRINGS.declarationsSummary}</SectionTitle>
          <p className="text-sm text-ink">
            {STRINGS.milsPlayersLine(
              players
                .filter((p) => draft.declarations.milsPlayerIds.includes(p.id))
                .map((p) => p.name)
                .join('، ') || STRINGS.milsNone,
            )}
          </p>
          <p className="num mt-1 text-sm text-ink-dim">
            <span className="glyph" aria-hidden="true">
              {GLYPH.spade}
            </span>{' '}
            {STRINGS.queenValueLine(queenValue(draft.declarations.queenDoubled))}
          </p>
          <p className="num mt-1 text-sm text-ink-dim">
            <span className="glyph" aria-hidden="true">
              {GLYPH.diamond}
            </span>{' '}
            {STRINGS.diamondValueLine(diamondValue(draft.declarations.diamondDoubled))}
          </p>
        </Card>

        {draftPreview?.isKaboot ? (
          <div className="rounded-card border-2 border-gold bg-gold-soft/25 p-4">
            <p className="text-lg font-bold text-gold">{STRINGS.kabootBannerTitle}</p>
            <p className="mt-1 text-sm text-ink">
              {STRINGS.kabootBannerBody(
                game.players.find((p) => p.id === draftPreview.kabootPlayerId)?.name ?? '',
              )}
            </p>
          </div>
        ) : null}

        <ul className="flex flex-col gap-3">
          {players.map((player) => {
            const result = draftPreview?.results.find((r) => r.playerId === player.id);
            const delta = result?.delta ?? 0;
            const newTotal = (totals[player.id] ?? 0) + delta;
            return (
              <li key={player.id} className="rounded-card border border-line bg-surface p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-lg font-bold text-ink">{player.name}</h3>
                    {result?.declaredMils ? (
                      <span className="rounded-md border border-gold px-2 py-0.5 text-xs font-bold text-gold">
                        {STRINGS.milsBadge}
                      </span>
                    ) : null}
                  </div>
                  <p className="shrink-0 text-left">
                    <span className="block text-[0.65rem] text-ink-dim">{STRINGS.roundDelta}</span>
                    <span className="num text-2xl font-bold text-ink">
                      {formatSignedNumber(delta)}
                    </span>
                  </p>
                </div>

                <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-1 text-sm">
                  <dt className="text-ink-dim">{STRINGS.heartsLabel}</dt>
                  <dd className="num text-ink">{formatCount(result?.hearts ?? 0)}</dd>

                  <dt className="text-ink-dim">{STRINGS.wonTrickQuestion}</dt>
                  <dd className="text-ink">{result?.wonAnyTrick ? STRINGS.yes : STRINGS.no}</dd>

                  {result?.capturedQueen ? (
                    <>
                      <dt className="text-ink-dim">بنت السبيت</dt>
                      <dd className="num text-ink">{formatCount(result.queenPoints)}</dd>
                    </>
                  ) : null}

                  {result?.capturedDiamond ? (
                    <>
                      <dt className="text-ink-dim">عشرة الديمن</dt>
                      <dd className="num text-ink">{formatCount(result.diamondPoints)}</dd>
                    </>
                  ) : null}

                  <dt className="text-ink-dim">{STRINGS.newTotal}</dt>
                  <dd className="num font-bold text-ink">{formatNumber(newTotal)}</dd>
                </dl>

                <p className="num mt-2 border-t border-line pt-2 text-sm text-ink-dim">
                  {result ? explanationText(result.explanation) : ''}
                </p>
              </li>
            );
          })}
        </ul>
      </div>
    </Screen>
  );
}
