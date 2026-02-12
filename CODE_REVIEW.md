# Code Review: training-mobile

## Overall Rating: 7.5 / 10

A solid and improving codebase. Since the last review, several critical issues have been addressed: error handling has been added to auth and program generation, the session lifecycle has been fixed, week advancement works, the `.env` file has been removed from git, the `deleteProgram` function has been optimized, and tab icons now use Ionicons. The remaining issues are mostly around type safety, performance at scale, test coverage gaps, and UI polish.

---

## Ratings by Category

| Category | Rating | Trend | Notes |
|---|---|---|---|
| Architecture | 8/10 | = | Local-first with cloud sync remains well-designed |
| Type Safety | 5/10 | +1 | `as any` reduced but still present in key spots |
| Error Handling | 6/10 | +3 | Auth, migration, onboarding, and program gen now have try/catch |
| Performance | 5/10 | = | O(n) full-table scans still present in every selector |
| Testing | 3/10 | +3 | Program generator has solid unit tests; hooks/screens untested |
| Security | 7/10 | +1 | `.env` removed from git, RLS in place, `.gitignore` updated |
| Code Organization | 8/10 | +1 | Colors constant extracted, clean separation maintained |
| UI/UX | 6/10 | = | Functional; still missing loading states and history detail |

---

## Issues Fixed Since Last Review

These items from the previous review have been resolved:

1. **Error handling on critical operations** -- `auth-context.tsx` now has try/catch around `getSession()` with a user-facing retry/offline alert. `migrateLocalDataToSupabase()` is awaited with error handling. `OnboardingScreen` wraps `createProgramFromMaxes()` in try/catch. `generateProgram()` rolls back partial programs on failure.

2. **`.env` removed from git** -- Commit `7c8a3f1` removed the tracked `.env` file. `.gitignore` now excludes `.env*` while preserving `.env.example`.

3. **Week advancement implemented** -- `useAutoAdvanceWeek()` hook in `hooks/use-program.ts:379-400` auto-advances `current_week` when all days in the current week have completed sessions. Called from `HomeScreen`.

4. **`completed_at` fixed** -- `addWorkoutSession()` in `utils/supabase.ts:393` now sets `completed_at: null` at creation. `endSession()` in `hooks/use-workout-session.ts:42` sets it to the actual completion time.

5. **Session state persisted** -- `activeSessionId$`, `activeSessionDayIds$`, and `activeAdHocExerciseIds$` are now persisted observables backed by AsyncStorage (`utils/supabase.ts:66-85`). Sessions survive navigation and remounts.

6. **Duplicate session prevention** -- `startSession()` in `hooks/use-workout-session.ts:17-18` checks for an existing active session and returns it instead of creating a new one.

7. **`deleteProgram` optimized** -- Refactored from O(n^3) nested loops to three sequential O(n) passes using `Set` lookups (`utils/supabase.ts:348-385`).

8. **Tab icons** -- Now using `@expo/vector-icons` Ionicons instead of emoji HTML entities (`app/(tabs)/_layout.tsx`).

9. **Colors centralized** -- A shared `Colors` constant in `constants/colors.ts` is used across all screens. No more hardcoded hex values scattered in stylesheets.

10. **HomeScreen scrolls** -- Now uses `ScrollView` instead of a plain `View` container.

11. **Test coverage added** -- `services/__tests__/program-generator.test.ts` (227 LOC) covers `seedDefaultExercises`, `generateProgram`, and `createProgramFromMaxes` with 12 test cases including rollback behavior.

---

## Remaining Issues

### Critical

#### 1. Remaining `as any` casts in HistoryScreen

`components/screens/HistoryScreen.tsx:30` still casts observable data to `any`:
```typescript
{(dayData as any)?.name ?? "Workout"}
```
This is the last `as any` in the rendering layer. The data coming from `workoutDays$[id].get()` returns a Legend State observable value whose type should be threaded through properly.

**Files affected:** `components/screens/HistoryScreen.tsx`, `utils/data-migration.ts:15`

#### 2. `data-migration.ts` uses `any` for record iteration

`utils/data-migration.ts:15` types the record parameter as `any`:
```typescript
Object.entries(data).forEach(([id, record]: [string, any]) => {
```
This bypasses type checking for the entire migration function. A generic helper or union type of all table row types would be safer.

#### 3. HistoryScreen reads observable outside selector

`components/screens/HistoryScreen.tsx:23-24` reads `workoutDays$[session.workout_day_id].get()` directly inside the render function of an `observer()` component. While `observer()` does track these reads, this creates a separate observable subscription per session card. For a history list that grows over time, this means N separate tracked observables. A single `useSelector` that pre-resolves all day names for the visible sessions would be more efficient.

---

### Performance

#### 4. O(n) full-table scans on every selector

Every `useSelector` in the hooks reads the entire observable, converts to an array with `Object.values()`, then filters. For example, `useWeekCompletion` iterates all weeks, all days, and all sessions to determine completion for a single week. As data accumulates over months of training, these scans will become increasingly expensive.

**Files affected:** All hooks in `hooks/use-program.ts`, `hooks/use-exercises.ts`, `hooks/use-workout-session.ts`

**Suggestion:** Build indexed lookup maps (by foreign key) as computed observables, or use Legend State's `computed()` to maintain pre-filtered views that only recompute when their specific data changes.

#### 5. `useCompletedWeeks` redundantly scans days for every week

`hooks/use-program.ts:365-367` calls `Object.values(days).filter(...)` inside a `for` loop over weeks. For W weeks and D days, this is O(W * D). Building a `Map<weekId, dayId[]>` in a single pass would reduce this to O(W + D).

#### 6. WorkoutComposerScreen linear lookups

`components/screens/WorkoutComposerScreen.tsx:69-71` and `:73-75` use `.find()` to resolve selected IDs against the full arrays on every render. For small lists this is fine, but building a `Map` once would be cleaner.

---

### Architecture

#### 7. Template start is unimplemented

`components/screens/WorkoutComposerScreen.tsx:90-92` has a TODO stub:
```typescript
const handleStartFromTemplate = (templateId: string) => {
  // TODO: resolve template into day IDs and start
};
```
Templates render in the UI and are tappable, but tapping them does nothing. This is a user-facing dead end.

#### 8. No confirmation or undo for session end

`WorkoutScreen.tsx:172-176` calls `endSession()` immediately on tap with no confirmation dialog. A mispress ends the entire workout. Unlike `deleteProgram` (which has an `Alert.alert` confirmation), finishing a workout is a one-tap irreversible action.

#### 9. `getWeight` treats 0% and null identically

`components/screens/WorkoutScreen.tsx:178-183`:
```typescript
const getWeight = (exerciseId: string, percentage: number | null) => {
  if (!percentage) return 0;
```
A falsy check on `percentage` means `0` and `null` both return 0. While the current accessory scheme uses `null` for "absolute weight" exercises, if a future scheme uses `percentage: 0` to mean "just the bar," this would silently break. Use an explicit `percentage === null` check.

#### 10. Race condition in `useAutoAdvanceWeek`

`hooks/use-program.ts:389-398` uses a `useRef` to prevent double-advancing, but there's a potential issue: `setCurrentWeek` updates the observable synchronously, which triggers a re-render. If the `useEffect` fires again before the `currentWeek` prop updates (due to React batching), `lastAdvancedWeek.current` prevents the double-advance. However, this logic is fragile -- it depends on the ref update happening synchronously before the next effect evaluation. A more robust approach would be to use a debounced or event-driven pattern.

---

### Testing

#### 11. No tests for hooks or screens

The only test file is `services/__tests__/program-generator.test.ts`. The custom hooks (`use-program.ts`, `use-exercises.ts`, `use-workout-session.ts`) have zero test coverage. These hooks contain significant business logic: week completion tracking, auto-advancement, session lifecycle management, and multi-day exercise grouping.

**Suggestion:** Add tests using `@testing-library/react-hooks` or `renderHook` from `@testing-library/react-native` for at least:
- `useWeekCompletion` -- correctness of completion detection
- `useAutoAdvanceWeek` -- advances at the right time, doesn't double-advance
- `useWorkoutSession` -- start/log/end lifecycle, duplicate prevention

#### 12. No integration or E2E tests

No Detox, Maestro, or other E2E test setup exists. The critical user flow (onboarding -> program generation -> workout logging -> session completion -> week advancement) is untested end-to-end.

---

### UI/UX

#### 13. No loading states during sync

No screens show loading indicators. When observables are syncing after login (or during initial data load), the user sees empty lists with no feedback. `auth-context.tsx` sets `isLoading` but only the root layout conditionally renders on it -- individual screens don't distinguish between "loading" and "empty."

#### 14. History screen has no detail view

Session cards in `HistoryScreen.tsx` are plain `View` elements, not tappable. Users can't see what sets they completed in a past workout. The `useSessionLogs` hook exists in `hooks/use-workout-session.ts:85-103` but is never used anywhere in the UI.

#### 15. Delete button placement on HomeScreen

`components/screens/HomeScreen.tsx:107-125` -- The "Delete Program" button is at the bottom of the scroll view after workout cards. This is improved from the previous position (it was between the title and cards), but it's still a standalone destructive button in the main view. Consider moving it to the Profile/Settings screen or behind a "..." menu.

#### 16. No feedback after workout completion

When `endSession()` is called, the session state clears and the UI silently switches back to the composer. There's no success message, summary of the workout, or celebration state. For a fitness app, acknowledging completion is important for user motivation.

---

### Minor Issues

- **17.** `ACCESSORY_SCHEME` uses `percentage: 0` while `getWeight` uses a falsy check (`!percentage`). Semantically, `null` would better communicate "no percentage-based weight" for accessories.
- **18.** `data-migration.ts` iterates all tables but doesn't verify that the migration actually succeeded for each record. If `obs$[id].user_id.set()` throws on one record, subsequent records in that table still get processed, but records in following tables may not.
- **19.** `WorkoutComposerScreen.tsx:83-87` only links days via `addSessionWorkoutDay` when `selectedDayIds.length > 1`. Single-day sessions rely on the legacy `workout_day_id` column. This dual-path creates two different ways a session references its workout days, making queries harder.
- **20.** `handleStartFromTemplate` is a no-op but the template cards are visually styled as interactive. Disabled styling or hiding the section until implemented would be more honest.
- **21.** The `observer()` HOC is used inconsistently -- `HomeScreen`, `HistoryScreen`, `WorkoutScreen`, `WorkoutComposerScreen` use it, but `OnboardingScreen`, `LoginScreen`, `SignupScreen` don't. The screens that don't use it also don't read observables directly, so this is correct, but it's worth noting for future maintainers.

---

## What's Done Well

- **Local-first architecture** with Legend State + AsyncStorage + Supabase sync is a strong foundation. Offline-first with eventual consistency is the right choice for a gym app where connectivity is unreliable.
- **Clean code organization** -- routes, screens, hooks, services, types, utils, and constants are separated logically. File naming is consistent.
- **Database schema** is well-normalized with RLS policies, soft deletes, foreign keys, and auto-timestamping triggers. The multi-program migration was additive and non-breaking.
- **Program generation with rollback** -- `generateProgram()` wraps creation in try/catch and calls `deleteProgram()` to clean up on failure. This is a significant improvement.
- **Session persistence** -- Active session state surviving app navigation via AsyncStorage-backed observables solves the biggest UX issue from the first review.
- **Error handling in auth flow** -- Retry/offline fallback in `loadSession()` is well-implemented with user-facing options.
- **Solid test coverage for program generator** -- 12 test cases covering happy paths, edge cases (existing exercises, soft deletes), and failure rollback.
- **Shared colors constant** -- All screens reference `Colors` from a single source. Consistent visual language.

---

## Top 5 Recommended Actions (Priority Order)

1. **Add hook tests** -- `useWeekCompletion`, `useAutoAdvanceWeek`, and `useWorkoutSession` contain critical business logic with zero test coverage. These are the most impactful tests to add.
2. **Build indexed lookup maps** -- Replace O(n) full-table scans with computed lookup maps (e.g., `daysByWeekId$`, `setsByDayId$`) to avoid performance degradation as data grows.
3. **Eliminate remaining `as any`** -- Only a few casts remain (`HistoryScreen.tsx:30`, `data-migration.ts:15`). Fixing these would bring type safety close to complete.
4. **Add loading states** -- Distinguish between "loading" and "empty" on all list screens. Show spinners or skeleton placeholders during initial sync.
5. **Implement template start or hide the UI** -- Either complete `handleStartFromTemplate` or hide the "Saved Templates" section to avoid a dead-end user experience.
