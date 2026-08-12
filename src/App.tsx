import { useGame } from './hooks/useGame';
import { useWakeLock } from './hooks/useWakeLock';
import { ToastHost } from './components/Toast';
import { Home } from './screens/Home';
import { NewGame } from './screens/NewGame';
import { RoundSetup } from './screens/RoundSetup';
import { RoundPlaying } from './screens/RoundPlaying';
import { RoundEntry } from './screens/RoundEntry';
import { Review } from './screens/Review';
import { Scoreboard } from './screens/Scoreboard';
import { GameOver } from './screens/GameOver';
import { History, HistoryGame } from './screens/History';
import { Help } from './screens/Help';
import { Backup } from './screens/Backup';
import { STRINGS } from './lib/strings';

export function App() {
  const api = useGame();
  const { route, activeGame, draft, status, storageWorks, toast, dismissToast } = api;

  /* The screen should stay awake while a game is in progress. */
  useWakeLock(route.name === 'game' && activeGame !== null && !status.isOver);

  const renderGame = () => {
    if (!activeGame) return <Home api={api} />;
    if (draft) {
      switch (draft.phase) {
        case 'declarations':
          return <RoundSetup api={api} game={activeGame} draft={draft} />;
        case 'playing':
          return <RoundPlaying api={api} game={activeGame} draft={draft} />;
        case 'entry':
          return <RoundEntry api={api} game={activeGame} draft={draft} />;
        case 'review':
          return <Review api={api} game={activeGame} draft={draft} />;
      }
    }
    if (status.isOver) return <GameOver api={api} game={activeGame} />;
    return <Scoreboard api={api} game={activeGame} />;
  };

  const renderRoute = () => {
    switch (route.name) {
      case 'home':
        return <Home api={api} />;
      case 'newGame':
        return <NewGame api={api} />;
      case 'game':
        return renderGame();
      case 'history':
        return <History api={api} />;
      case 'historyGame':
        return <HistoryGame api={api} gameId={route.gameId} />;
      case 'help':
        return <Help api={api} />;
      case 'backup':
        return <Backup api={api} />;
    }
  };

  return (
    <>
      {!storageWorks ? (
        <p role="alert" className="safe-x bg-bad px-4 py-2 text-center text-sm text-night">
          {STRINGS.storageWarning}
        </p>
      ) : null}
      {renderRoute()}
      <ToastHost toast={toast} onDismiss={dismissToast} />
    </>
  );
}
