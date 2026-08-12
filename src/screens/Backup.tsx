import { useRef, useState } from 'react';
import { Button } from '../components/Button';
import { Dialog } from '../components/Dialog';
import { Card, Screen, SectionTitle } from '../components/Screen';
import { STRINGS } from '../lib/strings';
import { parseBackup, serializeBackup } from '../lib/storage';
import type { GameApi } from '../hooks/useGame';
import type { PersistedAppState } from '../lib/types';

function downloadFileName(): string {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `bint-al-sabeet-${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}.json`;
}

export function Backup({ api }: { api: GameApi }) {
  const { state, setRoute, replaceState, notify } = api;
  const fileInput = useRef<HTMLInputElement | null>(null);
  const [pendingImport, setPendingImport] = useState<PersistedAppState | null>(null);
  const [manualText, setManualText] = useState<string | null>(null);

  const exportBackup = () => {
    const text = serializeBackup(state);
    try {
      const blob = new Blob([text], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = downloadFileName();
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
      URL.revokeObjectURL(url);
      notify(STRINGS.exportSuccess, 'success');
    } catch {
      /* Some in-app browsers block downloads; show the text instead. */
      setManualText(text);
      notify(STRINGS.exportFailed, 'error');
    }
  };

  const handleFile = async (file: File) => {
    let text: string;
    try {
      text = await file.text();
    } catch {
      notify(STRINGS.importFailed, 'error');
      return;
    }
    const result = parseBackup(text);
    if (!result.ok) {
      notify(STRINGS.importFailed, 'error');
      return;
    }
    setPendingImport(result.state);
  };

  return (
    <Screen title={STRINGS.backupTitle} onBack={() => setRoute({ name: 'home' })}>
      <div className="flex flex-col gap-4">
        <Card>
          <p className="text-sm leading-relaxed text-ink-dim">{STRINGS.backupIntro}</p>
        </Card>

        <Button variant="primary" block onClick={exportBackup}>
          {STRINGS.exportBackup}
        </Button>

        <Card>
          <SectionTitle>{STRINGS.importBackup}</SectionTitle>
          <label className="mb-2 block text-sm text-ink-dim" htmlFor="backup-file">
            {STRINGS.importPickFile}
          </label>
          <input
            id="backup-file"
            ref={fileInput}
            type="file"
            accept="application/json,.json"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) void handleFile(file);
              event.target.value = '';
            }}
            className="min-h-12 w-full rounded-xl border border-line bg-night px-3 py-2 text-sm text-ink"
          />
        </Card>

        {manualText ? (
          <Card>
            <SectionTitle>{STRINGS.shareFallbackTitle}</SectionTitle>
            <p className="max-h-64 overflow-auto text-xs break-all text-ink select-all">
              {manualText}
            </p>
          </Card>
        ) : null}
      </div>

      <Dialog
        open={pendingImport !== null}
        title={STRINGS.importConfirmTitle}
        body={STRINGS.importConfirmBody}
        confirmLabel={STRINGS.importBackup}
        destructive
        onConfirm={() => {
          if (pendingImport) {
            replaceState(pendingImport);
            notify(STRINGS.importSuccess, 'success');
          }
          setPendingImport(null);
        }}
        onCancel={() => setPendingImport(null)}
      />
    </Screen>
  );
}
