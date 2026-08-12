# Decisions

Autonomous decisions taken while building the app, with the reason for each.
Written in English on purpose: the code, tests and this file are for
maintainers, the product itself is Arabic only.

## Project location

- **Built inside the vault at `04-personal/apps/bint-al-sabeet/`.** The
  sandbox refuses writes outside the vault working directory, so an
  `apps/` folder next to the vault was not possible. Lane D (personal) is the
  correct lane for a card-game scorekeeper.
- **`node_modules/` and `dist/` are git-ignored.** If Obsidian indexing of
  the dependency tree becomes annoying, add
  `04-personal/apps/bint-al-sabeet/node_modules` to Obsidian's excluded files.

## Stack

- **Vite 8 + React 19 + TypeScript 6 + Tailwind 4 + vite-plugin-pwa 1.**
  Current stable versions at build time, resolved by npm rather than pinned
  from the brief.
- **Tailwind 4 via `@tailwindcss/vite` with a CSS-first `@theme` block.** No
  `tailwind.config.js` is needed, which is one less file to keep in sync.
- **No router.** The app has seven destinations and no deep linking
  requirement, so a `Route` union in `useGame` is enough. Adding a router
  would mean a dependency and a history model for no user-visible gain.
- **No state library.** One `useGame` hook over a single persisted state
  object, with pure reducers in `lib/`.

## Domain and scoring

- **`RoundDraft` gained an `editingRoundId` field.** Correcting a saved round
  reuses the whole entry and review flow; without this field the app could not
  tell a correction from a new round. Set to `null` for new rounds.
- **`calculateRound` throws `RoundValidationError`.** The brief requires that
  invalid input is rejected rather than repaired. A thrown error makes it
  impossible to persist an unscoreable round by accident.
- **`scoreRoundUnchecked` exists for the live preview only.** During entry the
  round is intentionally incomplete, so the preview needs scoring without
  validation. Saved rounds always go through `calculateRound`.
- **`wonAnyTrick` is never inferred from captured points.** Taking a heart or
  a special card sets it to `true`; removing every scoring card again does not
  set it back to `false`, because a harmless trick may still have been won.
- **Totals are never cached in storage.** `computeTotals` replays the saved
  rounds every time. Cached totals are only ever React `useMemo` values.

## Persistence

- **Synchronous write on every mutation, no debounce.** `commit()` builds the
  next state, sets it, and writes it to local storage in the same tick, so the
  last tap before the app is closed can never be lost.
- **A game whose rounds fail validation is dropped on load, not partially
  repaired.** Dropping individual rounds would silently change everyone's
  score. Dropping the whole game is visible and honest. Structurally sound
  games are always kept; there is no history limit.
- **A backup that decodes to nothing is rejected.** Importing an empty or
  unreadable file would otherwise wipe good data.
- **Undo after deleting a round is in-memory with a 10 second window.** It
  survives navigation but not an app restart, which matches "temporary inline
  undo". Any other destructive action clears it.
- **A finished game stays in `activeGame` and is also upserted by id into
  `finishedGames`.** This is what makes "correct the last round" work after
  the game has ended: if the correction drops every total below 152 the game
  is removed from the archive again. Upserting by id means no duplicate
  archive copies.

## Arabic and numerals

- **Western digits (0 to 9), not Arabic-Indic.** Requested by the user during
  the build. The brief asked for Arabic-Indic numerals; the user's instruction
  wins.
- **Signed numbers are wrapped in U+2066/U+2069 directional isolates.** In an
  RTL paragraph a bare `-25` renders with the minus on the wrong side. The
  isolate pins the sign to the left of the digits. Unsigned counts are left
  bare so they read naturally inside Arabic sentences.
- **All strings live in `src/lib/strings.ts`.** The scoring engine stays
  language free and returns a structured `RoundExplanation`, which
  `explanationText()` turns into Arabic.
- **Card suit glyphs use `font-variant-emoji: text` and a `.glyph` class** so
  they render as typographic marks rather than colour emoji.

## Interface

- **The game screen is derived, not routed.** Which of setup, playing, entry,
  review, scoreboard or game-over is shown follows from the persisted draft
  phase and the derived game-over status. Restoring after a close therefore
  needs no extra state.
- **The colour token is `--color-night`, not `--color-base`.** Tailwind
  resolves `text-*` against both font sizes and colours, so `text-base` was
  ambiguous. Renaming removed the collision.
- **No `alert`, `confirm` or `prompt`.** An `no-alert` lint rule enforces it.
  Confirmations use the accessible `Dialog` component with focus management.
- **Steppers are `role="spinbutton"`** with Arabic `aria-label` and
  `aria-valuetext`, plus arrow, Home and End key support.
- **Every interactive control is at least 48 by 48 CSS pixels**, verified in
  the browser on the entry screen (42 controls, none smaller).
- **User zoom is not disabled** and `text-size-adjust` is left at 100%.
  Accessibility beats removing the double-tap delay, as the brief requires.

## PWA

- **`registerType: 'autoUpdate'`.** A background update can reload the page,
  which is safe here because every mutation is already written to local
  storage, so the reload restores the exact same state.
- **Icons are generated from geometry by `scripts/generate-icons.mjs`** using
  only `node:zlib`, so there is no image dependency and no placeholder art.
  `npm run build` regenerates them.
- **`base: './'` and relative manifest `start_url`, `scope` and `id`** so the
  same build works from a domain root or from a subdirectory such as GitHub
  Pages.
- **Wake Lock is feature detected** and re-acquired when the tab becomes
  visible again. Its absence is not an error.

## Testing

- **Scoring and validation tests were written before the UI**, as the brief
  requires, and drove the engine.
- **The simulation test uses a `mulberry32` PRNG over fixed seeds** so a
  failure always reproduces. It generates 2000 valid rounds across five seeds
  and 200 deliberately mutated ones.
- **Interaction tests seed local storage for long games.** Driving seven
  كبوت rounds through the interface would be slow and would test the same
  three clicks repeatedly; seeding the first six rounds and then playing the
  deciding round through the real interface tests the interesting part.
