import { beforeEach, describe, expect, it } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { UserEvent } from '@testing-library/user-event';
import { App } from './App';
import { SCHEMA_VERSION, STORAGE_KEY, loadState } from './lib/storage';
import { PLAYERS, makeRound } from './lib/test-helpers';
import { formatNumber, formatSignedNumber } from './lib/format';
import type { Game, PersistedAppState, PlayerId, RoundInput } from './lib/types';

const [A, B, C, D, E] = PLAYERS.map((p) => p.name) as [string, string, string, string, string];
const [P1, P2, P3] = PLAYERS.map((p) => p.id) as [PlayerId, PlayerId, PlayerId];

function setup() {
  const user = userEvent.setup();
  const { unmount } = render(<App />);
  return Object.assign(user, { unmountApp: unmount });
}

function seed(state: Partial<PersistedAppState>) {
  window.localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({
      schemaVersion: SCHEMA_VERSION,
      activeGame: null,
      activeRoundDraft: null,
      finishedGames: [],
      previousPlayerNames: [],
      ...state,
    }),
  );
}

function seededGame(rounds: RoundInput[]): Game {
  return { id: 'g-seed', createdAt: 1_700_000_000_000, players: PLAYERS, rounds };
}

/** The card belonging to one player on the entry screen. */
function playerCard(name: string): HTMLElement {
  const heading = screen.getByRole('heading', { name, level: 3 });
  const card = heading.closest('li');
  if (!card) throw new Error(`no card for ${name}`);
  return card;
}

async function startNewGame(user: UserEvent) {
  await user.click(screen.getByRole('button', { name: 'لعبة جديدة' }));
  await user.click(screen.getByRole('button', { name: 'ابدأ اللعبة' }));
}

async function openContinuedGame(user: UserEvent) {
  await user.click(screen.getByRole('button', { name: 'متابعة اللعبة الحالية' }));
}

async function beginRound(
  user: UserEvent,
  options: { mils?: string[]; doubleQueen?: boolean } = {},
) {
  await user.click(screen.getByRole('button', { name: 'جولة جديدة' }));
  for (const name of options.mils ?? []) {
    await user.click(screen.getByRole('checkbox', { name }));
  }
  if (options.doubleQueen) {
    await user.click(screen.getByRole('switch', { name: /دبل بنت السبيت/ }));
  }
  await user.click(screen.getByRole('button', { name: 'ابدأ الجولة' }));
  await user.click(screen.getByRole('button', { name: 'إدخال نتيجة الجولة' }));
}

async function pickQueenCaptor(user: UserEvent, name: string) {
  const group = screen.getByRole('radiogroup', { name: /من أكل بنت السبيت/ });
  await user.click(within(group).getByRole('radio', { name }));
}

async function pickDiamondCaptor(user: UserEvent, name: string) {
  const group = screen.getByRole('radiogroup', { name: /من أكل عشرة الديمن/ });
  await user.click(within(group).getByRole('radio', { name }));
}

async function giveRemainingHearts(user: UserEvent, name: string) {
  await user.click(within(playerCard(name)).getByRole('button', { name: /أعطه باقي الهاص/ }));
}

async function setWonTrick(user: UserEvent, name: string, won: boolean) {
  const group = within(playerCard(name)).getByRole('radiogroup', {
    name: `هل أكل ${name} أي لمة؟`,
  });
  await user.click(within(group).getByRole('radio', { name: won ? 'نعم' : 'لا' }));
}

async function reviewAndConfirm(user: UserEvent) {
  await user.click(screen.getByRole('button', { name: 'مراجعة الجولة' }));
  await user.click(screen.getByRole('button', { name: 'اعتماد نتيجة الجولة' }));
}

beforeEach(() => {
  window.localStorage.clear();
});

describe('starting a game', () => {
  it('creates a five-player game from the default names', async () => {
    const user = setup();
    await startNewGame(user);

    expect(screen.getByRole('heading', { name: 'النتائج' })).toBeInTheDocument();
    for (const name of ['اللاعب 1', 'اللاعب 2', 'اللاعب 3', 'اللاعب 4', 'اللاعب 5']) {
      expect(screen.getByRole('heading', { name, level: 3 })).toBeInTheDocument();
    }
    expect(loadState().activeGame?.players).toHaveLength(5);
  });

  it('refuses duplicate names', async () => {
    const user = setup();
    await user.click(screen.getByRole('button', { name: 'لعبة جديدة' }));
    const second = screen.getByLabelText('اسم اللاعب 2');
    await user.clear(second);
    await user.type(second, 'اللاعب 1');
    await user.click(screen.getByRole('button', { name: 'ابدأ اللعبة' }));

    expect(screen.getByRole('alert')).toHaveTextContent('يوجد اسمان متطابقان');
    expect(loadState().activeGame).toBeNull();
  });

  it('refuses a blank name', async () => {
    const user = setup();
    await user.click(screen.getByRole('button', { name: 'لعبة جديدة' }));
    await user.clear(screen.getByLabelText('اسم اللاعب 3'));
    await user.click(screen.getByRole('button', { name: 'ابدأ اللعبة' }));

    expect(screen.getByRole('alert')).toHaveTextContent('كل اللاعبين يحتاجون أسماء');
    expect(loadState().activeGame).toBeNull();
  });
});

describe('the physical round', () => {
  beforeEach(() => {
    seed({ activeGame: seededGame([]) });
  });

  it('saves the declarations before the round is played', async () => {
    const user = setup();
    await openContinuedGame(user);
    await user.click(screen.getByRole('button', { name: 'جولة جديدة' }));
    await user.click(screen.getByRole('checkbox', { name: B }));
    await user.click(screen.getByRole('switch', { name: /دبل عشرة الديمن/ }));
    await user.click(screen.getByRole('button', { name: 'ابدأ الجولة' }));

    const stored = loadState().activeRoundDraft;
    expect(stored?.phase).toBe('playing');
    expect(stored?.declarations.milsPlayerIds).toEqual([P2]);
    expect(stored?.declarations.diamondDoubled).toBe(true);
    expect(stored?.declarations.queenDoubled).toBe(false);
  });

  it('restores the declarations after the app is closed and reopened', async () => {
    const user = setup();
    await openContinuedGame(user);
    await user.click(screen.getByRole('button', { name: 'جولة جديدة' }));
    await user.click(screen.getByRole('checkbox', { name: C }));
    await user.click(screen.getByRole('button', { name: 'ابدأ الجولة' }));

    user.unmountApp();
    const user2 = setup();
    await openContinuedGame(user2);

    expect(screen.getByRole('heading', { name: 'الجولة 1 جارية' })).toBeInTheDocument();
    expect(screen.getByText(C)).toBeInTheDocument();
  });

  it('restores a partially entered result after the app is closed', async () => {
    const user = setup();
    await openContinuedGame(user);
    await beginRound(user);
    await pickQueenCaptor(user, D);
    await giveRemainingHearts(user, A);

    user.unmountApp();
    const user2 = setup();
    await openContinuedGame(user2);

    expect(screen.getByRole('heading', { name: 'نتيجة الجولة 1' })).toBeInTheDocument();
    expect(
      within(playerCard(A)).getByRole('spinbutton', { name: `عدد الهاص عند ${A}` }),
    ).toHaveAttribute('aria-valuenow', '13');
    const queenGroup = screen.getByRole('radiogroup', { name: /من أكل بنت السبيت/ });
    expect(within(queenGroup).getByRole('radio', { name: D })).toHaveAttribute(
      'aria-checked',
      'true',
    );
  });
});

describe('entering a round result', () => {
  beforeEach(() => {
    seed({ activeGame: seededGame([]) });
  });

  it('adds hearts one at a time and stops at thirteen', async () => {
    const user = setup();
    await openContinuedGame(user);
    await beginRound(user);

    const card = playerCard(A);
    const add = within(card).getByRole('button', { name: `زيادة هاص: عدد الهاص عند ${A}` });
    await user.click(add);
    await user.click(add);
    await user.click(add);

    expect(within(card).getByRole('spinbutton', { name: `عدد الهاص عند ${A}` })).toHaveAttribute(
      'aria-valuenow',
      '3',
    );
    expect(screen.getByText('المتبقي: 10 هاص')).toBeInTheDocument();
  });

  it('assigns all remaining hearts with one tap', async () => {
    const user = setup();
    await openContinuedGame(user);
    await beginRound(user);
    await giveRemainingHearts(user, B);

    expect(
      within(playerCard(B)).getByRole('spinbutton', { name: `عدد الهاص عند ${B}` }),
    ).toHaveAttribute('aria-valuenow', '13');
    expect(screen.getByText('تم توزيع كل الهاص')).toBeInTheDocument();
  });

  it('marks a scoring-card captor as having won a trick automatically', async () => {
    const user = setup();
    await openContinuedGame(user);
    await beginRound(user);

    const card = playerCard(E);
    const trickGroup = within(card).getByRole('radiogroup', { name: `هل أكل ${E} أي لمة؟` });
    expect(within(trickGroup).getByRole('radio', { name: 'نعم' })).toHaveAttribute(
      'aria-checked',
      'false',
    );

    await pickDiamondCaptor(user, E);
    expect(within(trickGroup).getByRole('radio', { name: 'نعم' })).toHaveAttribute(
      'aria-checked',
      'true',
    );
  });

  it('keeps the trick flag when hearts are taken away again', async () => {
    const user = setup();
    await openContinuedGame(user);
    await beginRound(user);

    const card = playerCard(C);
    const add = within(card).getByRole('button', { name: `زيادة هاص: عدد الهاص عند ${C}` });
    const remove = within(card).getByRole('button', { name: `إنقاص هاص: عدد الهاص عند ${C}` });
    await user.click(add);
    await user.click(remove);

    const trickGroup = within(card).getByRole('radiogroup', { name: `هل أكل ${C} أي لمة؟` });
    expect(within(trickGroup).getByRole('radio', { name: 'نعم' })).toHaveAttribute(
      'aria-checked',
      'true',
    );
  });

  it('scores a harmless trick as zero and a clean round as -5', async () => {
    const user = setup();
    await openContinuedGame(user);
    await beginRound(user);
    await giveRemainingHearts(user, A);
    await pickQueenCaptor(user, B);
    await pickDiamondCaptor(user, C);
    await setWonTrick(user, D, true);

    await user.click(screen.getByRole('button', { name: 'مراجعة الجولة' }));
    expect(screen.getByText('أكل لمة دون أوراق محسوبة: 0')).toBeInTheDocument();
    expect(screen.getByText(`لم يأكل أي لمة: ${formatNumber(-5)}`)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'اعتماد نتيجة الجولة' }));
    const rounds = loadState().activeGame?.rounds ?? [];
    expect(rounds).toHaveLength(1);
  });

  it('blocks the review until the hearts add up to thirteen', async () => {
    const user = setup();
    await openContinuedGame(user);
    await beginRound(user);
    await pickQueenCaptor(user, A);
    await pickDiamondCaptor(user, A);

    expect(screen.getByRole('button', { name: 'مراجعة الجولة' })).toBeDisabled();
    expect(screen.getByText(/مجموع الهاص 0، والمطلوب 13/)).toBeInTheDocument();

    await giveRemainingHearts(user, B);
    expect(screen.getByRole('button', { name: 'مراجعة الجولة' })).toBeEnabled();
  });

  it('shows a failed ميلس as +25 after a harmless trick', async () => {
    const user = setup();
    await openContinuedGame(user);
    await beginRound(user, { mils: [E] });
    await giveRemainingHearts(user, A);
    await pickQueenCaptor(user, B);
    await pickDiamondCaptor(user, C);
    await setWonTrick(user, E, true);
    await reviewAndConfirm(user);

    const rounds = loadState().activeGame?.rounds ?? [];
    expect(rounds).toHaveLength(1);
    expect(rounds[0]?.declarations.milsPlayerIds).toHaveLength(1);
    expect(screen.getByText(`آخر جولة ${formatSignedNumber(25)}`)).toBeInTheDocument();
  });
});

describe('كبوت', () => {
  beforeEach(() => {
    seed({ activeGame: seededGame([]) });
  });

  it('is detected and announced during entry', async () => {
    const user = setup();
    await openContinuedGame(user);
    await beginRound(user, { doubleQueen: true });
    await giveRemainingHearts(user, A);
    await pickQueenCaptor(user, A);

    expect(screen.queryByText('كبوت')).not.toBeInTheDocument();

    await pickDiamondCaptor(user, A);
    expect(screen.getByText('كبوت')).toBeInTheDocument();
    expect(screen.getByText(`${A} أكل كل الهاص وبنت السبيت وعشرة الديمن.`)).toBeInTheDocument();

    await reviewAndConfirm(user);

    const totals = ['0', '25', '25', '25', '25'];
    const cells = screen.getAllByText((_, node) => {
      const text = node?.textContent ?? '';
      return node?.tagName === 'P' && node.classList.contains('num') && totals.includes(text);
    });
    expect(cells.length).toBeGreaterThanOrEqual(5);
  });
});

describe('correcting saved rounds', () => {
  const twoRounds = [
    makeRound({ hearts: { [P1]: 13 }, queen: P2, diamond: P3, id: 'r1' }),
    makeRound({ hearts: { [P2]: 13 }, queen: P3, diamond: P1, id: 'r2' }),
  ];

  it('edits a saved round and recomputes every later total', async () => {
    seed({ activeGame: seededGame(twoRounds) });
    const user = setup();
    await openContinuedGame(user);

    /* Before: أحمد has 13 hearts in round one and 10 in round two. */
    expect(loadState().activeGame?.rounds).toHaveLength(2);

    await user.click(screen.getByRole('button', { name: 'تعديل الجولة' }));
    await user.click(screen.getByRole('button', { name: 'الجولة 1' }));

    expect(screen.getByRole('heading', { name: 'نتيجة الجولة 1' })).toBeInTheDocument();
    const remove = within(playerCard(A)).getByRole('button', {
      name: `إنقاص هاص: عدد الهاص عند ${A}`,
    });
    await user.click(remove);
    await giveRemainingHearts(user, E);
    await reviewAndConfirm(user);

    const game = loadState().activeGame!;
    expect(game.rounds).toHaveLength(2);
    expect(game.rounds[0]?.id).toBe('r1');
    expect(game.rounds[0]?.outcomes.find((o) => o.playerId === P1)?.hearts).toBe(12);
  });

  it('deletes a saved round after confirmation and offers an undo', async () => {
    seed({ activeGame: seededGame(twoRounds) });
    const user = setup();
    await openContinuedGame(user);

    await user.click(screen.getByRole('button', { name: 'حذف الجولة' }));
    await user.click(screen.getByRole('button', { name: 'الجولة 2' }));

    const dialog = screen.getByRole('dialog');
    expect(within(dialog).getByText(/سيتم حذف الجولة 2/)).toBeInTheDocument();
    await user.click(within(dialog).getByRole('button', { name: 'حذف' }));

    expect(loadState().activeGame?.rounds).toHaveLength(1);
    expect(screen.getByText('تم حذف الجولة 2')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'تراجع' }));
    const restored = loadState().activeGame!;
    expect(restored.rounds).toHaveLength(2);
    expect(restored.rounds.map((r) => r.id)).toEqual(['r1', 'r2']);
  });
});

describe('finishing a game', () => {
  /**
   * Six كبوت rounds split evenly leave أحمد and سعود on 75 and the other
   * three on 150, one round short of the end.
   */
  const kaboot = (taker: PlayerId, id: string) =>
    makeRound({ hearts: { [taker]: 13 }, queen: taker, diamond: taker, id });

  const nearlyOver = [
    kaboot(P1, 'k1'),
    kaboot(P1, 'k2'),
    kaboot(P1, 'k3'),
    kaboot(P2, 'k4'),
    kaboot(P2, 'k5'),
    kaboot(P2, 'k6'),
  ];

  it('ends the game and reports joint winners once someone reaches 152', async () => {
    seed({ activeGame: seededGame(nearlyOver) });
    const user = setup();
    await openContinuedGame(user);

    expect(screen.getByRole('heading', { name: 'النتائج' })).toBeInTheDocument();

    await beginRound(user);
    await giveRemainingHearts(user, C);
    await pickQueenCaptor(user, C);
    await pickDiamondCaptor(user, C);
    await reviewAndConfirm(user);

    expect(screen.getByRole('heading', { name: 'انتهت اللعبة' })).toBeInTheDocument();
    expect(screen.getByText('الفائزون بالتساوي')).toBeInTheDocument();
    expect(screen.getByText(`${A}، ${B}`)).toBeInTheDocument();
    expect(screen.getByText('عدد الجولات: 7')).toBeInTheDocument();

    /* The finished game is archived exactly once. */
    const stored = loadState();
    expect(stored.finishedGames).toHaveLength(1);
    expect(stored.finishedGames[0]?.id).toBe('g-seed');
  });

  it('reopens the game when the threshold-crossing round is corrected', async () => {
    const overGame = seededGame([...nearlyOver, kaboot(P3, 'k7')]);
    seed({ activeGame: overGame, finishedGames: [overGame] });
    const user = setup();
    await openContinuedGame(user);

    expect(screen.getByRole('heading', { name: 'انتهت اللعبة' })).toBeInTheDocument();
    expect(loadState().finishedGames).toHaveLength(1);

    await user.click(screen.getByRole('button', { name: 'تصحيح آخر جولة' }));
    /* Redistribute the round so nobody who was on 150 gains a point. */
    await user.click(within(playerCard(C)).getByRole('spinbutton', { name: `عدد الهاص عند ${C}` }));
    await user.keyboard('{Home}');
    await giveRemainingHearts(user, A);
    await pickQueenCaptor(user, A);
    await pickDiamondCaptor(user, B);
    await reviewAndConfirm(user);

    expect(screen.getByRole('heading', { name: 'النتائج' })).toBeInTheDocument();
    expect(loadState().finishedGames).toHaveLength(0);
  });
});

describe('history', () => {
  it('lists finished games and deletes one after confirmation', async () => {
    const finished: Game = {
      id: 'g-old',
      createdAt: 1_700_000_000_000,
      players: PLAYERS,
      rounds: [makeRound({ hearts: { [P1]: 13 }, queen: P1, diamond: P1, id: 'r1' })],
    };
    seed({ finishedGames: [finished] });
    const user = setup();

    await user.click(screen.getByRole('button', { name: 'الألعاب السابقة' }));
    expect(screen.getByText(`الفائز: ${A}`)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'عرض تفاصيل اللعبة' }));
    expect(screen.getByText('هذه اللعبة منتهية، والعرض للقراءة فقط.')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'رجوع' }));
    await user.click(screen.getByRole('button', { name: 'حذف اللعبة' }));
    const dialog = screen.getByRole('dialog');
    await user.click(within(dialog).getByRole('button', { name: 'حذف' }));

    expect(screen.getByText('لا توجد ألعاب منتهية بعد.')).toBeInTheDocument();
    expect(loadState().finishedGames).toHaveLength(0);
  });
});

describe('help and offline copy', () => {
  it('explains the rules and the backup in Arabic', async () => {
    const user = setup();
    await user.click(screen.getByRole('button', { name: 'طريقة الحساب' }));

    expect(screen.getByRole('heading', { name: 'طريقة الحساب' })).toBeInTheDocument();
    expect(screen.getByText('كبوت')).toBeInTheDocument();
    expect(screen.getByText(/الحاسبة تحفظ كل شيء داخل المتصفح/)).toBeInTheDocument();
  });
});
