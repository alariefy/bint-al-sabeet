/**
 * Every visible string in the application. Components never hold Arabic
 * literals of their own.
 */

import { formatCount, formatNumber, formatSignedNumber } from './format';
import type { RoundExplanation, ValidationCode } from './types';

/** Text-presentation card glyphs, never colourful emoji artwork. */
export const GLYPH = {
  heart: '♥︎',
  spade: '♠︎',
  diamond: '♦︎',
  club: '♣︎',
} as const;

export const STRINGS = {
  appName: 'حاسبة بنت السبيت',
  appShortName: 'بنت السبيت',
  appDescription: 'حاسبة نقاط للعبة بنت السبيت لخمسة لاعبين، تعمل بدون إنترنت',
  tagline: 'حساب النقاط بدل الورقة والقلم',

  /* Shared actions */
  back: 'رجوع',
  cancel: 'إلغاء',
  confirm: 'تأكيد',
  close: 'إغلاق',
  delete: 'حذف',
  undo: 'تراجع',
  edit: 'تعديل',
  save: 'حفظ',
  yes: 'نعم',
  no: 'لا',
  copy: 'نسخ',

  /* Home */
  continueGame: 'متابعة اللعبة الحالية',
  newGame: 'لعبة جديدة',
  previousGames: 'الألعاب السابقة',
  howScoringWorks: 'طريقة الحساب',
  backup: 'نسخة احتياطية',
  currentGamePlayers: 'اللاعبون',
  nextRoundLine: (n: number) => `الجولة القادمة: ${formatCount(n)}`,
  finishedGameBadge: 'انتهت اللعبة',
  installHint:
    'لإضافة الحاسبة إلى الشاشة الرئيسية: من متصفح آيفون اضغط زر المشاركة ثم «إضافة إلى الشاشة الرئيسية». من أندرويد افتح قائمة المتصفح ثم «تثبيت التطبيق».',
  installTitle: 'التثبيت على الجوال',
  installNow: 'تثبيت التطبيق الآن',
  installedBadge: 'التطبيق مثبت على جهازك',
  installDismissed: 'تم إلغاء التثبيت. تقدر تثبته لاحقاً من نفس الزر.',
  installDone: 'تم تثبيت التطبيق على الشاشة الرئيسية',
  offlineReady: 'الحاسبة جاهزة للعمل بدون إنترنت',
  shareApp: 'مشاركة التطبيق',
  shareAppCopied: 'تم نسخ رابط التطبيق',

  /* New game */
  newGameTitle: 'لعبة جديدة',
  newGameIntro: 'خمسة لاعبين. كل اللاعبين يبدأون من 0، والأقل نقاطاً هو الفائز.',
  playerNameLabel: (n: number) => `اسم اللاعب ${formatCount(n)}`,
  defaultPlayerNames: ['اللاعب 1', 'اللاعب 2', 'اللاعب 3', 'اللاعب 4', 'اللاعب 5'],
  reusePreviousNames: 'إعادة استخدام أسماء اللعبة السابقة',
  moveUp: 'تحريك للأعلى',
  moveDown: 'تحريك للأسفل',
  startGame: 'ابدأ اللعبة',
  errorBlankName: 'كل اللاعبين يحتاجون أسماء. الرجاء تعبئة الأسماء الفارغة.',
  errorDuplicateName: 'يوجد اسمان متطابقان. الرجاء تمييز كل اسم.',
  replaceGameTitle: 'يوجد لعبة لم تنته بعد',
  replaceGameBody: 'بدء لعبة جديدة سيحذف اللعبة الحالية ونتائجها غير المحفوظة. هل تريد المتابعة؟',
  replaceGameConfirm: 'ابدأ لعبة جديدة',

  /* Round setup (declarations) */
  roundSetupTitle: (n: number) => `إعلانات الجولة ${formatCount(n)}`,
  roundSetupIntro: 'قبل توزيع اللعب: من أعلن ميلس، وهل تم دبل بنت السبيت أو عشرة الديمن.',
  milsSectionTitle: 'من أعلن ميلس؟',
  milsSectionHint: 'يمكن لأي عدد من اللاعبين إعلان ميلس، حتى الخمسة كلهم.',
  milsNone: 'لا أحد أعلن ميلس',
  doublingSectionTitle: 'الدبل',
  queenDoubleLabel: `دبل بنت السبيت ${GLYPH.spade}`,
  diamondDoubleLabel: `دبل عشرة الديمن ${GLYPH.diamond}`,
  queenValueLine: (v: number) => `قيمة بنت السبيت: ${formatCount(v)}`,
  diamondValueLine: (v: number) => `قيمة عشرة الديمن: ${formatCount(v)}`,
  heartsTotalNote: (n: number) => `الهاص ثابت: ${formatCount(n)} ورقة بقيمة واحد لكل ورقة.`,
  doubledBadge: 'مدبولة',
  normalBadge: 'عادية',
  startRound: 'ابدأ الجولة',

  /* Playing phase */
  playingTitle: (n: number) => `الجولة ${formatCount(n)} جارية`,
  playingIntro: 'العبوا الجولة، وبعد آخر لمة سجلوا النتيجة.',
  declarationsSummary: 'ملخص الإعلانات',
  enterRoundResult: 'إدخال نتيجة الجولة',
  editDeclarations: 'تعديل الإعلانات',
  milsPlayersLine: (names: string) => `ميلس: ${names}`,

  /* Round entry */
  roundEntryTitle: (n: number) => `نتيجة الجولة ${formatCount(n)}`,
  heartsLabel: 'الهاص',
  heartsAssigned: (assigned: number, total: number) =>
    `${formatCount(assigned)} من ${formatCount(total)}`,
  heartsRemaining: (n: number) => `المتبقي: ${formatCount(n)} هاص`,
  heartsRemainingNone: 'تم توزيع كل الهاص',
  addHeart: 'زيادة هاص',
  removeHeart: 'إنقاص هاص',
  heartsStepperName: (player: string) => `عدد الهاص عند ${player}`,
  giveRemainingHearts: 'أعطه باقي الهاص',
  wonTrickQuestion: 'هل أكل أي لمة؟',
  wonTrickName: (player: string) => `هل أكل ${player} أي لمة؟`,
  queenCaptorQuestion: `من أكل بنت السبيت ${GLYPH.spade}؟`,
  diamondCaptorQuestion: `من أكل عشرة الديمن ${GLYPH.diamond}؟`,
  captorNotChosen: 'لم يتم الاختيار',
  livePreviewTitle: 'النتيجة المتوقعة',
  kabootBannerTitle: 'كبوت',
  kabootBannerBody: (name: string) => `${name} أكل كل الهاص وبنت السبيت وعشرة الديمن.`,
  kabootBannerRule: 'الكبوت: 0 لصاحب الكبوت، و+25 لكل لاعب آخر.',
  reviewRound: 'مراجعة الجولة',
  milsBadge: 'ميلس',

  /* Review */
  reviewTitle: (n: number) => `مراجعة الجولة ${formatCount(n)}`,
  reviewIntro: 'راجع النتيجة قبل الاعتماد. بعد الاعتماد تُضاف النقاط للمجموع.',
  backToEdit: 'رجوع للتعديل',
  confirmRound: 'اعتماد نتيجة الجولة',
  roundDelta: 'نتيجة الجولة',
  newTotal: 'المجموع الجديد',
  roundSaved: 'تم اعتماد الجولة',
  cannotSaveInvalid: 'لا يمكن الاعتماد قبل تصحيح الأخطاء.',

  /* Scoreboard */
  scoreboardTitle: 'النتائج',
  roundNumberLine: (n: number) => `عدد الجولات المكتملة: ${formatCount(n)}`,
  leaderLabel: 'المتصدر',
  leadersLabel: 'المتصدرون',
  leaderBadge: 'متصدر',
  distanceToTarget: (n: number) => `يفصله عن ${formatCount(152)}: ${formatCount(n)}`,
  reachedTarget: 'وصل إلى النهاية',
  warningNearEnd: (name: string) => `تنبيه: ${name} اقترب من نهاية اللعبة.`,
  lastRoundChange: 'آخر جولة',
  lastDeclarations: 'إعلانات آخر جولة',
  noRoundsYet: 'لم تُسجل أي جولة بعد. ابدأ الجولة الأولى.',
  startNewRound: 'جولة جديدة',
  roundHistory: 'سجل الجولات',
  editRound: 'تعديل الجولة',
  deleteRound: 'حذف الجولة',
  shareResult: 'مشاركة النتيجة',
  chooseRoundToEdit: 'اختر الجولة التي تريد تعديلها',
  chooseRoundToDelete: 'اختر الجولة التي تريد حذفها',
  roundLabel: (n: number) => `الجولة ${formatCount(n)}`,
  deleteRoundTitle: 'حذف الجولة',
  deleteRoundBody: (n: number) =>
    `سيتم حذف الجولة ${formatCount(n)} وإعادة حساب كل المجاميع بعدها. هل تريد المتابعة؟`,
  roundDeleted: (n: number) => `تم حذف الجولة ${formatCount(n)}`,
  roundRestored: 'تمت استعادة الجولة',
  playerColumn: 'اللاعب',
  roundColumn: 'الجولة',
  totalColumn: 'المجموع',
  scoreTableCaption: 'جدول الجولات والمجاميع',

  /* Game over */
  gameOverTitle: 'انتهت اللعبة',
  winnerLabel: 'الفائز',
  jointWinnersLabel: 'الفائزون بالتساوي',
  finalScores: 'النتائج النهائية',
  completedRounds: (n: number) => `عدد الجولات: ${formatCount(n)}`,
  fixLastRound: 'تصحيح آخر جولة',
  newGameSamePlayers: 'لعبة جديدة بنفس اللاعبين',
  backHome: 'العودة للرئيسية',
  gameReopened: 'عادت اللعبة، لم يصل أحد إلى النهاية.',

  /* History */
  historyTitle: 'الألعاب السابقة',
  historyEmpty: 'لا توجد ألعاب منتهية بعد.',
  historyRoundCount: (n: number) => `${formatCount(n)} جولة`,
  openGame: 'عرض تفاصيل اللعبة',
  historyGameTitle: 'تفاصيل اللعبة',
  readOnlyNote: 'هذه اللعبة منتهية، والعرض للقراءة فقط.',
  deleteGame: 'حذف اللعبة',
  deleteGameTitle: 'حذف اللعبة',
  deleteGameBody: 'سيتم حذف هذه اللعبة من السجل نهائياً. هل تريد المتابعة؟',
  gameDeleted: 'تم حذف اللعبة',

  /* Help */
  helpTitle: 'طريقة الحساب',
  helpBackToHome: 'العودة للرئيسية',

  /* Backup */
  backupTitle: 'نسخة احتياطية',
  backupIntro:
    'بيانات الحاسبة محفوظة داخل المتصفح فقط. إذا مسحت بيانات المتصفح أو غيّرت الجهاز ستفقد السجل، لذلك احفظ نسخة احتياطية من وقت لآخر.',
  exportBackup: 'تصدير نسخة احتياطية',
  importBackup: 'استيراد نسخة احتياطية',
  importPickFile: 'اختر ملف النسخة الاحتياطية',
  exportSuccess: 'تم إنشاء ملف النسخة الاحتياطية',
  exportCopied: 'تم نسخ النسخة الاحتياطية',
  exportFailed: 'تعذر إنشاء ملف النسخة الاحتياطية',
  importSuccess: 'تم استيراد النسخة الاحتياطية',
  importFailed: 'الملف غير صالح، ولم يتم تغيير أي بيانات.',
  importConfirmTitle: 'استيراد نسخة احتياطية',
  importConfirmBody: 'سيتم استبدال اللعبة الحالية والسجل بمحتويات الملف. هل تريد المتابعة؟',

  /* Sharing */
  shareCopied: 'تم نسخ النتيجة',
  shareFailed: 'تعذرت المشاركة، انسخ النص يدوياً.',
  shareFallbackTitle: 'نص النتيجة',
  shareLeaderLine: (names: string) => `المتصدر: ${names}`,
  shareWinnerLine: (names: string) => `الفائز: ${names}`,
  shareRoundsLine: (n: number) => `بعد ${formatCount(n)} جولة`,

  /* Errors and fallbacks */
  fatalTitle: 'حدث خطأ غير متوقع',
  fatalBody: 'أعد فتح الحاسبة. بياناتك المحفوظة لم تُمسح.',
  fatalReload: 'إعادة تحميل',
  storageWarning: 'تعذر حفظ البيانات في هذا المتصفح. النتائج قد تضيع عند الإغلاق.',
  validationTitle: 'لا يمكن حفظ الجولة',

  /* Accessibility */
  mainLandmark: 'المحتوى الرئيسي',
  dialogCloseLabel: 'إغلاق النافذة',
  liveRegionLabel: 'تنبيهات',
} as const;

/* ------------------------------------------------------------------ */
/* Validation messages                                                 */
/* ------------------------------------------------------------------ */

export function validationMessage(
  code: ValidationCode,
  context: { playerName?: string; expected?: number; actual?: number } = {},
): string {
  const name = context.playerName ?? '';
  switch (code) {
    case 'playerCount':
      return 'اللعبة تحتاج خمسة لاعبين بالضبط.';
    case 'duplicatePlayerId':
      return 'يوجد تكرار في اللاعبين.';
    case 'outcomeCount':
    case 'outcomeMismatch':
    case 'duplicateOutcome':
      return 'نتيجة كل لاعب يجب أن تُسجل مرة واحدة.';
    case 'heartsNotInteger':
      return `عدد الهاص عند ${name} يجب أن يكون رقماً صحيحاً.`;
    case 'heartsRange':
      return `عدد الهاص عند ${name} يجب أن يكون بين 0 و13.`;
    case 'heartsTotal': {
      const actual = context.actual ?? 0;
      if (actual < 13) return `مجموع الهاص ${formatCount(actual)}، والمطلوب 13. وزّع الباقي.`;
      return `مجموع الهاص ${formatCount(actual)}، والمطلوب 13. أنقص الزائد.`;
    }
    case 'queenCaptorMissing':
    case 'queenCaptorInvalid':
      return 'اختر من أكل بنت السبيت.';
    case 'diamondCaptorMissing':
    case 'diamondCaptorInvalid':
      return 'اختر من أكل عشرة الديمن.';
    case 'captorWithoutTrick':
      return `${name} أكل ورقة محسوبة، فلازم يكون أكل لمة.`;
    case 'heartsWithoutTrick':
      return `${name} عنده هاص، فلازم يكون أكل لمة.`;
    case 'noTrickWinner':
      return 'لازم لاعب واحد على الأقل يكون أكل لمة.';
    case 'milsUnknownPlayer':
    case 'milsDuplicate':
      return 'إعلان الميلس غير صحيح.';
    case 'doublingNotBoolean':
      return 'إعلان الدبل غير صحيح.';
    case 'pointsTotalMismatch':
      return 'مجموع نقاط الأوراق غير مطابق للجولة.';
    default:
      return 'الجولة غير مكتملة.';
  }
}

/* ------------------------------------------------------------------ */
/* Round explanations                                                  */
/* ------------------------------------------------------------------ */

function partsLine(parts: string[], total: number): string {
  if (parts.length === 0) return formatNumber(total);
  return `${parts.join(' + ')} = ${formatNumber(total)}`;
}

function capturedParts(hearts: number, queen: number, diamond: number): string[] {
  const parts: string[] = [];
  if (hearts > 0) parts.push(`${formatCount(hearts)} هاص`);
  if (queen > 0) {
    parts.push(queen === 26 ? 'بنت السبيت المدبولة 26' : 'بنت السبيت 13');
  }
  if (diamond > 0) {
    parts.push(diamond === 20 ? 'عشرة الديمن المدبولة 20' : 'عشرة الديمن 10');
  }
  return parts;
}

export function explanationText(explanation: RoundExplanation): string {
  switch (explanation.kind) {
    case 'kabootTaker':
      return `كبوت: نتيجة الجولة ${formatNumber(0)}`;
    case 'kabootOther':
      return `نتيجة الكبوت لبقية اللاعبين: ${formatSignedNumber(25)}`;
    case 'milsSuccess':
      return `ميلس ناجح: ${formatNumber(-25)}`;
    case 'milsFailure': {
      const parts = [
        'ميلس غير ناجح 25',
        ...capturedParts(explanation.hearts, explanation.queen, explanation.diamond),
      ];
      return partsLine(parts, explanation.total);
    }
    case 'noTrick':
      return `لم يأكل أي لمة: ${formatNumber(-5)}`;
    case 'harmlessTrick':
      return `أكل لمة دون أوراق محسوبة: ${formatNumber(0)}`;
    case 'captured': {
      const parts = capturedParts(explanation.hearts, explanation.queen, explanation.diamond);
      return partsLine(parts, explanation.total);
    }
    default:
      return '';
  }
}

/* ------------------------------------------------------------------ */
/* Help content                                                        */
/* ------------------------------------------------------------------ */

export interface HelpSection {
  title: string;
  lines: string[];
}

export const HELP_SECTIONS: HelpSection[] = [
  {
    title: 'أساس اللعبة',
    lines: [
      'خمسة لاعبين، و50 ورقة بعد سحب 2♣ و3♣.',
      'كل لاعب يستلم 10 أوراق.',
      'الكل يبدأ من 0، والأقل نقاطاً هو الفائز.',
      'النقاط قد تنزل تحت الصفر، ولا يوجد حد أدنى.',
      'اللعبة تنتهي عندما يصل أي لاعب إلى 152 أو أكثر.',
    ],
  },
  {
    title: 'الأوراق المحسوبة',
    lines: [
      `كل هاص ${GLYPH.heart} بواحد، ومجموع الهاص 13.`,
      `بنت السبيت ${GLYPH.spade} بـ13 نقطة.`,
      `عشرة الديمن ${GLYPH.diamond} بـ10 نقاط.`,
    ],
  },
  {
    title: 'الدبل',
    lines: [
      'قبل بداية الجولة يجوز كشف بنت السبيت ودبلها لتصير 26.',
      'وكذلك عشرة الديمن تصير 20.',
      'كل ورقة قرارها مستقل، ويجوز دبل الاثنتين أو واحدة أو ولا وحدة.',
      'الدبل مرة واحدة لكل ورقة في الجولة.',
      'من أكل الورقة في النهاية هو من يتحمل قيمتها.',
    ],
  },
  {
    title: 'ميلس',
    lines: [
      'قبل اللعب يجوز لأي عدد من اللاعبين إعلان ميلس.',
      'من أعلن ميلس يتعهد أنه ما راح يأكل أي لمة.',
      'أكل أي لمة يفشّل الميلس، حتى لو اللمة ما فيها ولا ورقة محسوبة.',
      'ميلس ناجح: 25 ناقصة من المجموع.',
      'ميلس فاشل: 25 زائد كل الأوراق المحسوبة التي أكلها.',
    ],
  },
  {
    title: 'بقية اللاعبين',
    lines: [
      'من لم يأكل أي لمة: 5 ناقصة من المجموع.',
      'من أكل لمة أو أكثر بدون أوراق محسوبة: 0.',
      'غير ذلك: مجموع قيمة الأوراق التي أكلها.',
    ],
  },
  {
    title: 'كبوت',
    lines: [
      'الكبوت يتحقق فقط إذا أكل نفس اللاعب كل الهاص الثلاثة عشر مع بنت السبيت مع عشرة الديمن.',
      'كل الهاص مع ورقة واحدة فقط ليس كبوت.',
      'صاحب الكبوت يأخذ 0، وكل لاعب آخر يأخذ 25.',
      'الكبوت يلغي الميلس ويلغي الدبل ويلغي نتيجة من لم يأكل لمة.',
      'الحاسبة تكتشف الكبوت تلقائياً.',
    ],
  },
  {
    title: 'نهاية اللعبة',
    lines: [
      'بعد اعتماد كل جولة تُراجع المجاميع.',
      'إذا وصل أي لاعب إلى 152 أو أكثر تنتهي اللعبة.',
      'من وصل إلى الرقم ليس بالضرورة الخاسر ولا الفائز، الفائز هو صاحب أقل مجموع.',
      'إذا تساوى أكثر من لاعب في أقل مجموع فكلهم فائزون.',
    ],
  },
  {
    title: 'النسخة الاحتياطية',
    lines: [
      'الحاسبة تحفظ كل شيء داخل المتصفح، وتعمل بدون إنترنت بعد أول فتح.',
      'مسح بيانات المتصفح يمسح السجل، فاحفظ نسخة احتياطية من صفحة «نسخة احتياطية».',
      'الاستيراد يتحقق من الملف أولاً، والملف غير الصالح لا يغيّر أي بيانات.',
    ],
  },
];
