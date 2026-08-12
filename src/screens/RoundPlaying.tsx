import { Button } from '../components/Button';
import { Card, Screen, SectionTitle } from '../components/Screen';
import { GLYPH, STRINGS } from '../lib/strings';
import { diamondValue, queenValue } from '../lib/scoring';
import { formatCount } from '../lib/format';
import type { GameApi } from '../hooks/useGame';
import type { Game, RoundDraft } from '../lib/types';

/**
 * Shown while the physical round is being played. Its only job is to keep the
 * public declarations visible and survive the app being closed.
 */
export function RoundPlaying({
  api,
  game,
  draft,
}: {
  api: GameApi;
  game: Game;
  draft: RoundDraft;
}) {
  const { draftRoundNumber, setPhase } = api;
  const milsNames = game.players
    .filter((p) => draft.declarations.milsPlayerIds.includes(p.id))
    .sort((a, b) => a.order - b.order)
    .map((p) => p.name);

  return (
    <Screen
      title={STRINGS.playingTitle(draftRoundNumber)}
      subtitle={STRINGS.playingIntro}
      footer={
        <div className="flex flex-col gap-2">
          <Button variant="primary" block onClick={() => setPhase('entry')}>
            {STRINGS.enterRoundResult}
          </Button>
          <Button variant="ghost" block onClick={() => setPhase('declarations')}>
            {STRINGS.editDeclarations}
          </Button>
        </div>
      }
    >
      <Card>
        <SectionTitle>{STRINGS.declarationsSummary}</SectionTitle>
        <dl className="flex flex-col gap-3">
          <div className="flex items-baseline justify-between gap-3 border-b border-line pb-2">
            <dt className="text-sm text-ink-dim">{STRINGS.milsSectionTitle}</dt>
            <dd className="text-base font-bold text-ink">
              {milsNames.length > 0 ? milsNames.join('، ') : STRINGS.milsNone}
            </dd>
          </div>
          <div className="flex items-baseline justify-between gap-3 border-b border-line pb-2">
            <dt className="text-sm text-ink-dim">
              <span className="glyph" aria-hidden="true">
                {GLYPH.spade}
              </span>{' '}
              بنت السبيت
            </dt>
            <dd className="num text-base font-bold text-ink">
              {formatCount(queenValue(draft.declarations.queenDoubled))}{' '}
              <span className="text-xs font-normal text-gold">
                {draft.declarations.queenDoubled ? STRINGS.doubledBadge : STRINGS.normalBadge}
              </span>
            </dd>
          </div>
          <div className="flex items-baseline justify-between gap-3">
            <dt className="text-sm text-ink-dim">
              <span className="glyph" aria-hidden="true">
                {GLYPH.diamond}
              </span>{' '}
              عشرة الديمن
            </dt>
            <dd className="num text-base font-bold text-ink">
              {formatCount(diamondValue(draft.declarations.diamondDoubled))}{' '}
              <span className="text-xs font-normal text-gold">
                {draft.declarations.diamondDoubled ? STRINGS.doubledBadge : STRINGS.normalBadge}
              </span>
            </dd>
          </div>
        </dl>
      </Card>
    </Screen>
  );
}
