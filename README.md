# حاسبة بنت السبيت

حاسبة نقاط للعبة بنت السبيت لخمسة لاعبين. الأوراق تتوزع وتُلعب على الطاولة،
وشخص واحد يمسك الجوال ويدخل الإعلانات ونتيجة كل جولة. الحاسبة تحسب كل شيء،
وتمنع الإدخال الخاطئ، وتحفظ اللعبة حتى لو أُغلق التطبيق.

- تعمل بدون إنترنت بعد أول فتح.
- تُثبت على الشاشة الرئيسية في آيفون وأندرويد.
- بدون حساب، بدون تسجيل دخول، بدون خادم.
- كل البيانات تبقى داخل جهازك.

## أسماء اللاعبين

عند بدء لعبة جديدة تظهر خمسة حقول للأسماء. اكتب اسم كل لاعب بدل الأسماء
الافتراضية (اللاعب 1 إلى اللاعب 5)، ورتّب اللاعبين بأسهم أعلى وأسفل حسب ترتيب
الجلسة. زر «إعادة استخدام أسماء اللعبة السابقة» يرجّع أسماء آخر لعبة بضغطة
واحدة. الأسماء لا يجوز أن تتكرر ولا تُترك فارغة.

## طريقة الاستخدام

1. **لعبة جديدة**: اكتب أسماء الخمسة ثم «ابدأ اللعبة». الكل يبدأ من 0.
2. **قبل كل جولة**: اختر من أعلن ميلس، وهل تم دبل بنت السبيت أو عشرة الديمن،
   ثم «ابدأ الجولة». الإعلانات تُحفظ فوراً.
3. **العبوا الجولة على الطاولة.** لو أُغلق التطبيق ورجعت، الإعلانات موجودة.
4. **بعد آخر لمة**: «إدخال نتيجة الجولة». اختر من أكل بنت السبيت ومن أكل عشرة
   الديمن، ووزّع الهاص الثلاثة عشر، وحدد من أكل لمة.
5. **المراجعة**: تشوف نتيجة كل لاعب مع سبب الحساب، ثم «اعتماد نتيجة الجولة».
6. **النتائج**: المجاميع، المتصدر، البعد عن 152، وجدول كل الجولات.

## قواعد الحساب

- خمسة لاعبين، 50 ورقة بعد سحب 2♣ و3♣، وكل لاعب يستلم 10 أوراق.
- كل هاص بواحد، ومجموع الهاص 13.
- بنت السبيت بـ13، وتصير 26 إذا دُبلت.
- عشرة الديمن بـ10، وتصير 20 إذا دُبلت.
- الدبل قرار عام قبل الجولة، وكل ورقة مستقلة عن الأخرى.
- **ميلس ناجح**: 25 ناقصة. **ميلس فاشل**: 25 زائد كل الأوراق المحسوبة، وأي
  لمة تفشّل الميلس حتى لو ما فيها ورقة محسوبة.
- **بدون ميلس**: من لم يأكل لمة يأخذ 5 ناقصة، ومن أكل لمة بدون أوراق محسوبة
  يأخذ 0، وغير ذلك يأخذ قيمة ما أكله.
- **كبوت**: نفس اللاعب أكل كل الهاص مع بنت السبيت مع عشرة الديمن. صاحبه يأخذ
  0 والبقية 25 لكل واحد، ويلغي الميلس والدبل. الحاسبة تكتشفه تلقائياً.
- اللعبة تنتهي عند وصول أي لاعب إلى 152 أو أكثر، والفائز صاحب أقل مجموع.
  التساوي في أقل مجموع يعني أكثر من فائز.

## التثبيت على الجوال

- **آيفون**: افتح الرابط في Safari، اضغط زر المشاركة، ثم «إضافة إلى الشاشة
  الرئيسية».
- **أندرويد**: افتح الرابط في Chrome، افتح قائمة المتصفح، ثم «تثبيت التطبيق».

بعد التثبيت يشتغل التطبيق بدون إنترنت.

## النسخة الاحتياطية

البيانات محفوظة داخل المتصفح فقط. مسح بيانات المتصفح أو تغيير الجهاز يمسح
السجل. من صفحة «نسخة احتياطية» يمكن تصدير ملف JSON وحفظه، واستيراده لاحقاً.
الاستيراد يتحقق من الملف أولاً، والملف غير الصالح لا يغيّر أي بيانات.

---

## For maintainers

Arabic-only PWA. Vite, React, TypeScript strict, Tailwind, `vite-plugin-pwa`,
Vitest with jsdom and React Testing Library. No backend, no analytics, no
remote assets: the Tajawal font is bundled locally and the icons are generated
from geometry at build time.

### Commands

```bash
npm install
```

```bash
npm run dev
```

```bash
npm run verify
```

`verify` runs, in order: `format:check`, `lint`, `typecheck`, `test`, `build`.
Individual scripts:

```bash
npm run format:check
```

```bash
npm run lint
```

```bash
npm run typecheck
```

```bash
npm run test
```

```bash
npm run build
```

```bash
npm run preview
```

`npm run icons` regenerates `public/icons/*` and `public/apple-touch-icon.png`;
`build` runs it automatically.

### Layout

```
src/
  components/   Button, Dialog, Stepper, Toggle, PlayerRoundCard, ScoreTable, ...
  hooks/        useGame (state, persistence, derived totals), useWakeLock
  lib/          types, scoring, validation, storage, strings, format, share
  screens/      Home, NewGame, RoundSetup, RoundPlaying, RoundEntry, Review,
                Scoreboard, GameOver, History, Help, Backup
scripts/        generate-icons.mjs
```

`lib/scoring.ts` and `lib/validation.ts` are pure: no React, no browser APIs,
no storage, integers only. Raw `RoundInput` records are the only source of
truth; every total, winner and game-over decision is derived by replaying
them. All Arabic text lives in `lib/strings.ts`.

### Deploying

The build in `dist/` is a static site and works from a domain root or a
subdirectory (`base: './'`).

GitHub Pages, from this repository:

```bash
npm run build && npx gh-pages -d dist
```

Vercel, if you have an account and the CLI:

```bash
npm i -g vercel
```

```bash
vercel --prod
```

Vercel needs no framework configuration beyond the defaults: build command
`npm run build`, output directory `dist`. Any static host works the same way,
including Netlify (`netlify deploy --prod --dir=dist`) and Cloudflare Pages.
