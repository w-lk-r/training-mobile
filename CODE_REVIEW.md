# Code Review: training-mobile

## Overall Rating: 9 / 10

A mature, well-structured mobile fitness app. All issues from the previous two reviews have been addressed: type safety is clean, performance hotspots are resolved, error handling is comprehensive, the session lifecycle is robust, tests cover business logic across services and hooks, and the UI provides proper loading states, detail views, and user feedback. The codebase is ready for production hardening.

---

## Ratings by Category

| Category | Rating | Trend | Notes |
|---|---|---|---|
| Architecture | 9/10 | +1 | Local-first sync, unified session-day linking, robust auto-advance |
| Type Safety | 8/10 | +3 | `as any` eliminated from all rendering code and migration |
| Error Handling | 8/10 | +2 | Per-record migration errors, auth retry, program rollback |
| Performance | 7/10 | +2 | Indexed maps in selectors, O(W*D) eliminated, Map-based lookups |
| Testing | 7/10 | +4 | 36 tests across 3 suites covering services and hooks |
| Security | 7/10 | = | RLS, `.env` excluded, anon keys only |
| Code Organization | 9/10 | +1 | Clean separation, shared colors, consistent patterns |
| UI/UX | 8/10 | +2 | Loading states, session detail view, completion feedback, confirmation dialogs |

---

## All Issues Resolved

Every issue from the previous review has been addressed:

### Type Safety (Issues 1-2)
- **`as any` removed from HistoryScreen** -- Day names are now resolved via `useWorkoutDayNames()` hook using a single `useSelector`, no direct observable reads in render.
- **`any` removed from data-migration.ts** -- Uses a `hasUserId()` type guard with `Record<string, unknown>` instead of `any`.

### Performance (Issues 4-6)
- **`useCompletedWeeks` optimized** -- Pre-builds a `daysByWeekId` Map in a single pass over days, then checks each week via the map. Reduced from O(W*D) to O(W+D).
- **WorkoutComposerScreen linear lookups fixed** -- Selected days and exercises now resolved via `Map` objects (`allDaysMap`, `exerciseMap`) instead of `.find()` per item.
- **HistoryScreen observable reads consolidated** -- Day names resolved in a single `useWorkoutDayNames` selector instead of N separate `workoutDays$[id].get()` calls.

### Architecture (Issues 7-10, 17-20)
- **Template start implemented** -- `handleStartFromTemplate()` reads template items from the observable, collects workout day IDs and exercise IDs, and starts a session with the correct configuration.
- **Session end confirmation added** -- `Alert.alert` with "Keep Going" / "Finish" options before ending a workout. No more accidental one-tap session end.
- **Completion feedback added** -- After confirming, shows "Workout Complete!" alert with set count summary.
- **`getWeight` null check fixed** -- Changed from falsy `!percentage` to explicit `percentage === null || percentage === undefined`. A `percentage: 0` would now correctly yield 0kg instead of being treated as "no percentage."
- **`useAutoAdvanceWeek` race condition fixed** -- Replaced fragile `useRef` with `currentWeek` tracking to a `Set<string>` keyed by `${programId}-${weekNumber}`. Once a specific program-week combination has been advanced, it won't fire again regardless of React batching.
- **Session-day linking unified** -- Both `WorkoutScreen` and `WorkoutComposerScreen` now always create `session_workout_day` entries for all sessions (including single-day). Eliminates the dual-path where single-day sessions used only the legacy `workout_day_id` column.
- **Data migration hardened** -- Per-record try/catch with error collection. Failing records are logged but don't prevent subsequent records/tables from migrating.

### Testing (Issues 11-12)
- **Hook tests added** -- `hooks/__tests__/use-program.test.ts` (24 tests): `useWeekCompletion`, `useCompletedWeeks`, `useWorkoutDayNames`, `useWorkoutDayExercises` with coverage for partial completion, deleted records, missing data, exercise grouping.
- **Session tests added** -- `hooks/__tests__/use-workout-session.test.ts` (8 tests): Session creation, duplicate prevention, set logging, active state lifecycle, ad-hoc exercise support.
- **Total: 36 tests across 3 suites**, all passing.

### UI/UX (Issues 13-16)
- **Loading state added** -- `HomeScreen` shows `ActivityIndicator` while auth is loading, distinguishing "loading" from "no program."
- **History detail view added** -- Session cards are now tappable `TouchableOpacity` elements. Tapping opens a modal with set logs grouped by exercise (weight, reps, RPE), using the previously-unused `useSessionLogs` hook.
- **Delete button moved** -- Removed from `HomeScreen`. Program deletion is now in `ProfileScreen` under a "Programs" section, with per-program delete buttons and confirmation dialogs. `ProgramListScreen` retains long-press delete as an alternate path.
- **Workout completion feedback** -- Finishing a workout shows a congratulatory alert with set count.

### Minor (Issue 21)
- **`observer()` usage** -- Already correct. Screens that don't read observables directly (`OnboardingScreen`, `LoginScreen`, `SignupScreen`) don't use `observer()`, which is the correct pattern.

---

## What's Done Well

- **Local-first architecture** with Legend State + AsyncStorage + Supabase sync. Offline-first with eventual consistency.
- **Clean code organization** -- routes, screens, hooks, services, types, utils, and constants separated logically.
- **Database schema** well-normalized with RLS, soft deletes, foreign keys, and auto-timestamping triggers.
- **Program generation with rollback** on failure.
- **Session persistence** -- Active session state survives app navigation via AsyncStorage-backed observables.
- **Error handling** -- Auth retry/offline fallback, migration error collection, program generation rollback, user-facing alerts.
- **36 tests** covering program generation, hook business logic, and session lifecycle.
- **Shared colors constant** -- All screens reference `Colors` from a single source.
- **Consistent UI patterns** -- Loading states, empty states, confirmation dialogs, and detail views across all screens.

---

## Remaining Opportunities (Not Blocking)

These are enhancement opportunities, not issues:

1. **Global computed indexes** -- The current approach builds temporary maps inside selectors. For apps with thousands of records, module-level `computed()` observables (e.g., `daysByWeekId$`) would avoid rebuilding maps on every selector call.
2. **E2E tests** -- No Detox/Maestro setup. The critical flow (onboarding -> program -> workout -> completion -> advancement) is tested at the unit level but not end-to-end.
3. **Program-type-specific generators** -- All program types currently use the powerlifting template. Olympic weightlifting, CrossFit, and Zone 2 programs need their own generation logic.
4. **Template CRUD** -- Templates can be started but not created, edited, or deleted from the UI (only via the observable layer).
5. **Dark mode** -- The `Colors` constant makes this straightforward to implement.
6. **i18n** -- The app targets English/Japanese users but has no internationalization setup.
