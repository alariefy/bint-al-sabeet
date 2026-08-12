import { Button } from '../components/Button';
import { Card, Screen, SectionTitle } from '../components/Screen';
import { Toggle } from '../components/Toggle';
import { STRINGS } from '../lib/strings';
import { RULES, diamondValue, queenValue } from '../lib/scoring';
import type { GameApi } from '../hooks/useGame';
import type { Game, RoundDraft } from '../lib/types';

export function RoundSetup({ api, game, draft }: { api: GameApi; game: Game; draft: RoundDraft }) {
  const { draftRoundNumber, toggleMils, setDeclarations, setPhase, cancelDraft } = api;
  const players = [...game.players].sort((a, b) => a.order - b.order);
  const { declarations } = draft;

  return (
    <Screen
      title={STRINGS.roundSetupTitle(draftRoundNumber)}
      subtitle={STRINGS.roundSetupIntro}
      onBack={cancelDraft}
      footer={
        <Button variant="primary" block onClick={() => setPhase('playing')}>
          {STRINGS.startRound}
        </Button>
      }
    >
      <div className="flex flex-col gap-4">
        <Card>
          <SectionTitle>{STRINGS.milsSectionTitle}</SectionTitle>
          <p className="mb-3 text-xs leading-relaxed text-ink-dim">{STRINGS.milsSectionHint}</p>
          <ul className="flex flex-col gap-2">
            {players.map((player) => {
              const checked = declarations.milsPlayerIds.includes(player.id);
              return (
                <li key={player.id}>
                  <button
                    type="button"
                    role="checkbox"
                    aria-checked={checked}
                    aria-label={player.name}
                    onClick={() => toggleMils(player.id)}
                    className={[
                      'flex min-h-14 w-full items-center justify-between gap-3 rounded-xl border px-4 py-3 text-right transition-colors',
                      checked ? 'border-gold bg-gold-soft/20' : 'border-line bg-raised',
                    ].join(' ')}
                  >
                    <span className="text-base text-ink">{player.name}</span>
                    <span
                      className={checked ? 'text-sm font-bold text-gold' : 'text-sm text-ink-dim'}
                    >
                      {checked ? STRINGS.milsBadge : STRINGS.no}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
          {declarations.milsPlayerIds.length === 0 ? (
            <p className="mt-3 text-xs text-ink-dim">{STRINGS.milsNone}</p>
          ) : null}
        </Card>

        <Card>
          <SectionTitle>{STRINGS.doublingSectionTitle}</SectionTitle>
          <div className="flex flex-col gap-2">
            <Toggle
              accessibleLabel={STRINGS.queenDoubleLabel}
              label={STRINGS.queenDoubleLabel}
              hint={STRINGS.queenValueLine(queenValue(declarations.queenDoubled))}
              checked={declarations.queenDoubled}
              onChange={(next) => setDeclarations({ ...declarations, queenDoubled: next })}
              onText={STRINGS.doubledBadge}
              offText={STRINGS.normalBadge}
            />
            <Toggle
              accessibleLabel={STRINGS.diamondDoubleLabel}
              label={STRINGS.diamondDoubleLabel}
              hint={STRINGS.diamondValueLine(diamondValue(declarations.diamondDoubled))}
              checked={declarations.diamondDoubled}
              onChange={(next) => setDeclarations({ ...declarations, diamondDoubled: next })}
              onText={STRINGS.doubledBadge}
              offText={STRINGS.normalBadge}
            />
          </div>
          <p className="num mt-3 text-xs text-ink-dim">
            {STRINGS.heartsTotalNote(RULES.HEARTS_TOTAL)}
          </p>
        </Card>
      </div>
    </Screen>
  );
}
