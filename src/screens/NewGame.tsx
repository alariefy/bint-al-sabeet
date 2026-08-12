import { useId, useState } from 'react';
import { Button } from '../components/Button';
import { Dialog } from '../components/Dialog';
import { Card, Screen } from '../components/Screen';
import { STRINGS } from '../lib/strings';
import { RULES } from '../lib/scoring';
import type { GameApi } from '../hooks/useGame';

export function NewGame({ api }: { api: GameApi }) {
  const { state, activeGame, startGame, setRoute } = api;
  const previous = state.previousPlayerNames;
  const [names, setNames] = useState<string[]>(() => [...STRINGS.defaultPlayerNames]);
  const [error, setError] = useState<string | null>(null);
  const [confirmReplace, setConfirmReplace] = useState(false);
  const errorId = useId();

  const setName = (index: number, value: string) => {
    setNames((prev) => prev.map((n, i) => (i === index ? value : n)));
    setError(null);
  };

  const move = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= names.length) return;
    setNames((prev) => {
      const next = prev.slice();
      const a = next[index]!;
      next[index] = next[target]!;
      next[target] = a;
      return next;
    });
  };

  const validate = (): string[] | null => {
    const trimmed = names.map((n) => n.trim());
    if (trimmed.length !== RULES.PLAYER_COUNT || trimmed.some((n) => n.length === 0)) {
      setError(STRINGS.errorBlankName);
      return null;
    }
    if (new Set(trimmed).size !== trimmed.length) {
      setError(STRINGS.errorDuplicateName);
      return null;
    }
    setError(null);
    return trimmed;
  };

  const submit = () => {
    const trimmed = validate();
    if (!trimmed) return;
    if (activeGame) {
      setConfirmReplace(true);
      return;
    }
    startGame(trimmed);
  };

  return (
    <Screen
      title={STRINGS.newGameTitle}
      subtitle={STRINGS.newGameIntro}
      onBack={() => setRoute({ name: 'home' })}
      footer={
        <Button variant="primary" block onClick={submit}>
          {STRINGS.startGame}
        </Button>
      }
    >
      <form
        onSubmit={(event) => {
          event.preventDefault();
          submit();
        }}
        className="flex flex-col gap-3"
      >
        {previous.length === RULES.PLAYER_COUNT ? (
          <Button
            variant="secondary"
            block
            onClick={() => {
              setNames([...previous]);
              setError(null);
            }}
          >
            {STRINGS.reusePreviousNames}
          </Button>
        ) : null}

        <ol className="flex flex-col gap-3">
          {names.map((name, index) => (
            <Card as="li" key={index} className="flex items-center gap-2">
              <div className="flex-1">
                <label className="mb-1 block text-xs text-ink-dim" htmlFor={`player-name-${index}`}>
                  {STRINGS.playerNameLabel(index + 1)}
                </label>
                <input
                  id={`player-name-${index}`}
                  value={name}
                  onChange={(event) => setName(index, event.target.value)}
                  autoComplete="off"
                  aria-invalid={error !== null}
                  aria-describedby={error ? errorId : undefined}
                  className="min-h-12 w-full rounded-xl border border-line bg-night px-3 py-2 text-ink"
                />
              </div>
              <div className="flex shrink-0 flex-col gap-1">
                <button
                  type="button"
                  aria-label={`${STRINGS.moveUp}: ${name}`}
                  disabled={index === 0}
                  onClick={() => move(index, -1)}
                  className="h-11 w-11 rounded-lg border border-line bg-raised text-ink disabled:opacity-35"
                >
                  <span aria-hidden="true">▲</span>
                </button>
                <button
                  type="button"
                  aria-label={`${STRINGS.moveDown}: ${name}`}
                  disabled={index === names.length - 1}
                  onClick={() => move(index, 1)}
                  className="h-11 w-11 rounded-lg border border-line bg-raised text-ink disabled:opacity-35"
                >
                  <span aria-hidden="true">▼</span>
                </button>
              </div>
            </Card>
          ))}
        </ol>

        <p id={errorId} role="alert" className="min-h-6 text-sm text-bad">
          {error}
        </p>
      </form>

      <Dialog
        open={confirmReplace}
        title={STRINGS.replaceGameTitle}
        body={STRINGS.replaceGameBody}
        confirmLabel={STRINGS.replaceGameConfirm}
        destructive
        onConfirm={() => {
          const trimmed = validate();
          setConfirmReplace(false);
          if (trimmed) startGame(trimmed);
        }}
        onCancel={() => setConfirmReplace(false)}
      />
    </Screen>
  );
}
