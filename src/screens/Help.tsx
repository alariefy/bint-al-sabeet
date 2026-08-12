import { Card, Screen } from '../components/Screen';
import { HELP_SECTIONS, STRINGS } from '../lib/strings';
import type { GameApi } from '../hooks/useGame';

export function Help({ api }: { api: GameApi }) {
  return (
    <Screen
      title={STRINGS.helpTitle}
      onBack={() => api.setRoute({ name: 'home' })}
      backLabel={STRINGS.helpBackToHome}
    >
      <div className="flex flex-col gap-3">
        {HELP_SECTIONS.map((section) => (
          <Card key={section.title}>
            <h2 className="mb-2 text-base font-bold text-gold">{section.title}</h2>
            <ul className="flex list-disc flex-col gap-1 pe-5">
              {section.lines.map((line) => (
                <li key={line} className="num text-sm leading-relaxed text-ink">
                  {line}
                </li>
              ))}
            </ul>
          </Card>
        ))}
      </div>
    </Screen>
  );
}
