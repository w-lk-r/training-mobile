# Code Review: training-mobile

## Overall Rating: 6.5 / 10

A functional prototype with a sensible local-first architecture and clean separation of concerns. The codebase has clear strengths in its choice of stack and data model, but has several issues around type safety, performance, error handling, and missing testing infrastructure that would need to be addressed before production use.

---

## Ratings by Category

| Category | Rating | Notes |
|---|---|---|
| Architecture | 8/10 | Local-first with cloud sync is well-designed |
| Type Safety | 4/10 | Heavy use of `any` casts undermines TypeScript |
| Error Handling | 3/10 | Almost no error handling in critical paths |
| Performance | 5/10 | O(n) full-table scans in every selector |
| Testing | 0/10 | No tests of any kind |
| Security | 6/10 | RLS is in place but env file is committed, no password validation |
| Code Organization | 7/10 | Clean file structure, good separation |
| UI/UX | 6/10 | Functional but minimal; some UX gaps |

---

## Critical Issues

### 1. Pervasive `as any` casts defeat TypeScript

Nearly every hook and data access function casts observable data to `any` before operating on it. This pattern appears in all hooks and `supabase.ts` CRUD helpers. The Legend State observable types should be properly threaded through, or a typed helper should unwrap the observable data.

**Files affected:** `hooks/use-program.ts`, `hooks/use-exercises.ts`, `hooks/use-workout-session.ts`, `utils/supabase.ts`

**Suggestion:** Create a single typed utility:
```typescript
function getRecords<T>(obs$: Observable): T[] {
  const data = obs$.get();
  if (!data) return [];
  return Object.values(data).filter((r): r is T => r != null && !(r as any).deleted);
}
```

### 2. No error handling on critical operations

- `auth-context.tsx:36` - `getSession()` promise has no `.catch()`. If Supabase is unreachable, `isLoading` stays `true` forever and the app hangs.
- `auth-context.tsx:51` - `migrateLocalDataToSupabase()` is called without `await` or error handling. If migration fails partway through, user data will be partially migrated with no recovery path.
- `services/program-generator.ts` - `generateProgram()` creates ~100 records synchronously with no error handling. If any call fails midway, the program is left in an inconsistent partial state.
- `components/screens/OnboardingScreen.tsx:50` - `createProgramFromMaxes()` has no try/catch. On failure the user sees nothing and gets `router.replace` anyway.

**Suggestion:** Wrap critical operations in try/catch blocks. For `generateProgram`, consider a transactional pattern that rolls back on failure.

### 3. `.env` file is committed to the repository

The `.env` file containing Supabase credentials is tracked in git. While these are publishable/anon keys, `.env` files should be in `.gitignore` with a `.env.example` template instead to prevent accidental commit of future secret values.

---

## Performance Issues

### 4. O(n) full-table scans on every render

Every selector reads the entire observable, converts to array, then filters. For example, `useWorkoutDayExercises` iterates **all** workout sets across **all** programs to find the sets for one day. As data grows, this becomes increasingly expensive.

**Suggestion:** Build indexed lookup maps (by foreign key) that update reactively, or use Legend State's computed/selector features to maintain pre-filtered views.

### 5. `deleteProgram` has O(n³) complexity

`utils/supabase.ts:270-301` iterates all weeks, then for each week iterates all days, then for each day iterates all sets.

**Suggestion:** Flatten the cascade by building lookup maps first, then doing single passes over each collection.

---

## Architecture Issues

### 6. No week advancement mechanism

`HomeScreen.tsx` displays `program.current_week` but there is no code anywhere to increment it. The user is stuck on week 1 forever.

**Suggestion:** Add a `completeWeek` or `advanceWeek` function, either triggered manually or automatically when all 4 days in a week have sessions.

### 7. `completed_at` is set at session start, not end

`addWorkoutSession` sets `completed_at` to `now()` at creation time. `endSession` only saves notes but doesn't update `completed_at`. The recorded completion time is actually the start time.

**Suggestion:** Set `completed_at` to `null` on creation, then update it in `endSession`.

### 8. Session state is lost on navigation/remount

`useWorkoutSession` stores `sessionId` in `useState`. If the user navigates away from the workout tab and comes back, `sessionId` resets to `null` and the active session is orphaned.

**Suggestion:** Persist the active session ID in AsyncStorage or in an observable, and look up existing unfinished sessions on mount.

### 9. No protection against multiple active sessions

Nothing prevents the user from starting multiple workout sessions for the same day. Each tap of "Start Workout" creates a new session record.

---

## Type Safety Issues

### 10. Non-null assertions on nullable fields

`completed_at` is nullable in the database schema, but the code uses `!` to suppress TypeScript warnings. If a session has `completed_at: null`, this creates `Invalid Date` and breaks sorting.

### 11. Observable config lacks explicit `isSyncEnabled: false`

The comment says "sync disabled by default" but none of the observable configurations explicitly set this, relying on implicit behavior.

---

## UI/UX Issues

### 12. Delete button positioned above workout list

The "Delete Program" button sits between the section title and workout cards. Easy to accidentally tap. Destructive actions should be at the bottom or behind a settings menu.

### 13. No loading states

No screens show loading indicators. When observables are syncing after login, the user sees empty or stale data with no feedback.

### 14. History screen has no detail view

Session cards aren't tappable. Users can't see what sets they completed in a past workout. The `useSessionLogs` hook exists but is never used.

### 15. No scroll on HomeScreen

`HomeScreen.tsx` uses a plain `View` container, not `ScrollView`. Content will overflow on small screens.

---

## Minor Issues

- **16.** `HistoryScreen.tsx:23-24` directly accesses observables inside render instead of using a selector, creating an untracked dependency.
- **17.** Tab icons use emoji HTML entities which render inconsistently across platforms. Use `@expo/vector-icons` instead.
- **18.** `ACCESSORY_SCHEME` uses `percentage: 0` and `getWeight` uses a falsy check — correct behavior but semantically unclear. Use `null` instead.
- **19.** Hardcoded color values scattered across all style sheets. Consider a shared theme/colors constant.

---

## What's Done Well

- **Local-first architecture** with Legend State + Supabase sync is a strong choice for a mobile fitness app that needs to work offline.
- **Clean file organization** - separation of routes, screens, hooks, services, types, and utils is logical and navigable.
- **Database schema** is well-normalized with proper RLS policies, foreign keys, and soft deletes.
- **Program generation logic** is cleanly extracted and configurable through constants.
- **Data migration** strategy for offline-to-online transition is simple and effective.

---

## Top 5 Recommended Actions (Priority Order)

1. **Add error handling** to auth flow, migration, and program generation
2. **Fix session lifecycle** — persist active session, set `completed_at` on end, prevent duplicates
3. **Add week advancement** logic so the program actually progresses
4. **Replace `any` casts** with proper typing throughout hooks
5. **Add at least unit tests** for `program-generator.ts` and the custom hooks
