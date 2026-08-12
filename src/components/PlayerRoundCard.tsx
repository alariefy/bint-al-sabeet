import { Button } from './Button';
import { Stepper } from './Stepper';
import { YesNoChoice } from './Toggle';
import { formatCount, formatSignedNumber } from '../lib/format';
import { GLYPH, STRINGS } from '../lib/strings';
import { RULES } from '../lib/scoring';
import type { Player, PlayerRoundOutcome } from '../lib/types';

export interface PlayerRoundCardProps {
  player: Player;
  outcome: PlayerRoundOutcome;
  declaredMils: boolean;
  capturedQueen: boolean;
  capturedDiamond: boolean;
  heartsRemaining: number;
  previewDelta: number;
  onHeartsChange: (next: number) => void;
  onGiveRemaining: () => void;
  onWonTrickChange: (next: boolean) => void;
}

export function PlayerRoundCard({
  player,
  outcome,
  declaredMils,
  capturedQueen,
  capturedDiamond,
  heartsRemaining,
  previewDelta,
  onHeartsChange,
  onGiveRemaining,
  onWonTrickChange,
}: PlayerRoundCardProps) {
  const maxHearts = outcome.hearts + heartsRemaining;

  return (
    <li className="rounded-card border border-line bg-surface p-4">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="text-lg font-bold text-ink">{player.name}</h3>
          {declaredMils ? (
            <span className="rounded-md border border-gold px-2 py-0.5 text-xs font-bold text-gold">
              {STRINGS.milsBadge}
            </span>
          ) : null}
          {capturedQueen ? (
            <span className="rounded-md border border-line px-2 py-0.5 text-xs text-ink-dim">
              <span className="glyph" aria-hidden="true">
                {GLYPH.spade}
              </span>{' '}
              بنت السبيت
            </span>
          ) : null}
          {capturedDiamond ? (
            <span className="rounded-md border border-line px-2 py-0.5 text-xs text-ink-dim">
              <span className="glyph" aria-hidden="true">
                {GLYPH.diamond}
              </span>{' '}
              عشرة الديمن
            </span>
          ) : null}
        </div>
        <p className="num shrink-0 text-xl font-bold text-ink" aria-label={STRINGS.roundDelta}>
          {formatSignedNumber(previewDelta)}
        </p>
      </div>

      <div className="mb-3">
        <div className="mb-2 flex items-baseline justify-between gap-2">
          <span className="text-sm text-ink-dim">
            {STRINGS.heartsLabel}{' '}
            <span className="glyph" aria-hidden="true">
              {GLYPH.heart}
            </span>
          </span>
          <span className="num text-sm text-ink-dim">
            {STRINGS.heartsAssigned(outcome.hearts, RULES.HEARTS_TOTAL)}
          </span>
        </div>
        <Stepper
          label={STRINGS.heartsStepperName(player.name)}
          value={outcome.hearts}
          min={0}
          max={maxHearts}
          valueText={`${formatCount(outcome.hearts)} من ${formatCount(RULES.HEARTS_TOTAL)}`}
          onChange={onHeartsChange}
        />
        <Button
          variant="secondary"
          block
          className="mt-2 min-h-11 text-sm"
          disabled={heartsRemaining === 0}
          onClick={onGiveRemaining}
        >
          {STRINGS.giveRemainingHearts}
          {heartsRemaining > 0 ? (
            <span className="num">({formatCount(heartsRemaining)})</span>
          ) : null}
        </Button>
      </div>

      <div>
        <p className="mb-2 text-sm text-ink-dim">{STRINGS.wonTrickQuestion}</p>
        <YesNoChoice
          legend={STRINGS.wonTrickName(player.name)}
          value={outcome.wonAnyTrick}
          onChange={onWonTrickChange}
        />
      </div>
    </li>
  );
}
