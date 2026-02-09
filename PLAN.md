# Gym Training App - Implementation Plan

## Context

Transform the current todo demo app into a local-first gym training app. Users start offline with data in AsyncStorage, then optionally create an account to sync to Supabase. The program is a 4-day/week structure focused on squat, bench, deadlift, and strict press with accessories. Weights in kilograms. Email/password auth only.

---

## Phase 1: Foundation (Auth + Schema + Local-First)

### 1.1 Database Migration

**New file:** `supabase/migrations/<timestamp>_gym_schema.sql`

Drop todos table, create:

| Table | Purpose |
|-------|---------|
| `exercises` | Exercise library (user-owned) |
| `max_lifts` | 1RM records per exercise |
| `programs` | Training program metadata |
| `program_weeks` | Week structure within program |
| `workout_days` | Days within weeks (e.g., "Squat Day") |
| `workout_sets` | Prescribed sets (reps, % of max) |
| `workout_sessions` | Completed workout logs |
| `set_logs` | Actual weight/reps performed per set |

All tables get:
- `user_id uuid references auth.users(id) not null`
- `created_at`, `updated_at` timestamptz with `handle_times()` trigger
- `deleted boolean default false` (soft deletes)
- RLS policy: `using (user_id = auth.uid())`
- Realtime enabled

Then regenerate `utils/database.types.ts` via `npx supabase gen types`.

### 1.2 Auth Setup

**Modify:** `utils/supabase.ts`
- Uncomment auth config (AsyncStorage, autoRefreshToken, persistSession)

**New file:** `contexts/auth-context.tsx`
- AuthProvider wrapping the app
- Manages Supabase session state
- Exposes `signUp`, `signIn`, `signOut`
- On sign-in: migrate local data (update `user_id` from `'local'` to real UUID), then enable sync
- On sign-out: disable sync

**New files:** `app/(auth)/login.tsx`, `app/(auth)/signup.tsx`
- Simple email/password forms
- Redirect to main app on success

**Modify:** `app/_layout.tsx`
- Wrap with `AuthProvider`
- Route to auth screens or main app based on session state
- App works without auth (local-only mode)

### 1.3 Local-First Observables

**Modify:** `utils/supabase.ts`
- Remove todos observable and helpers
- Add observables for each gym table (exercises$, maxLifts$, programs$, etc.)
- All observables start with sync **disabled** (`isSyncEnabled: false`)
- CRUD helper functions for each entity
- `user_id` set to `'local'` when no auth, real UUID when authenticated
- Export `allObservables` map for sync toggling

**New file:** `utils/data-migration.ts`
- `migrateLocalDataToSupabase(userId)` — iterates all observables, replaces `user_id: 'local'` with real UUID
- Called once on first signup/login before enabling sync

### 1.4 Update App Entry

**Modify:** `app/index.tsx`
- Replace todo UI with gym app home screen (or redirect to tabs)

---

## Phase 2: Gym Features

### 2.1 Types & Services

**New file:** `types/program.ts`
- TypeScript interfaces for program template, week structure, set scheme

**New file:** `services/program-generator.ts`
- Takes max lifts as input
- Generates a 4-day/week, 4-week program:
  - Day 1: Squat focus + accessories
  - Day 2: Bench focus + accessories
  - Day 3: Deadlift focus + accessories
  - Day 4: Strict Press focus + accessories
- Percentage-based programming (e.g., Week 1: 70% 4x8 -> Week 4: 90% 3x2)
- Writes to observables (programs$, programWeeks$, workoutDays$, workoutSets$)

**New file:** `services/progression.ts`
- After a 4-week cycle: analyze completed sessions
- Calculate new maxes based on performance (did they complete all reps? RPE?)
- Regenerate next cycle with updated weights

### 2.2 Hooks

**New file:** `hooks/use-exercises.ts` — list exercises, get current maxes
**New file:** `hooks/use-program.ts` — active program, current week workouts
**New file:** `hooks/use-workout-session.ts` — start session, log sets, end session

### 2.3 UI Screens

**New file:** `app/(tabs)/_layout.tsx` — Bottom tab navigation
**New file:** `app/(tabs)/home.tsx` — Program overview, current week, next workout
**New file:** `app/(tabs)/workout.tsx` — Active workout session (log sets)
**New file:** `app/(tabs)/history.tsx` — Past workouts
**New file:** `app/(tabs)/profile.tsx` — Max lifts, settings, account creation prompt
**New file:** `app/onboarding.tsx` — First-run: enter max lifts for the 4 main lifts (squat, bench, deadlift, strict press), then generate program

---

## Key Decisions

- **Sync toggle:** `syncState(obs$).isSyncEnabled` controls whether data syncs to Supabase
- **Local user_id:** `'local'` string used as placeholder, replaced with real UUID on signup
- **One observable per table:** Simpler sync management, keyed by record ID
- **4-day split:** Fixed structure (squat/bench/deadlift/press), accessories configurable later
- **Kilograms only:** No unit conversion needed
- **Email/password only:** Can add Apple/Google later

## Files Modified

| File | Change |
|------|--------|
| `utils/supabase.ts` | Replace todos with gym observables, enable auth config |
| `utils/database.types.ts` | Regenerated from new schema |
| `app/_layout.tsx` | Add AuthProvider, route guards |
| `app/index.tsx` | Replace todo UI |
| `package.json` | May need expo-secure-store or similar |

## New Files

| File | Purpose |
|------|---------|
| `supabase/migrations/*_gym_schema.sql` | Database schema |
| `contexts/auth-context.tsx` | Auth state management |
| `utils/data-migration.ts` | Local -> Supabase migration |
| `types/program.ts` | TypeScript types |
| `services/program-generator.ts` | Program creation logic |
| `services/progression.ts` | Cycle progression logic |
| `hooks/use-exercises.ts` | Exercise data hook |
| `hooks/use-program.ts` | Program data hook |
| `hooks/use-workout-session.ts` | Session tracking hook |
| `app/(auth)/login.tsx` | Login screen |
| `app/(auth)/signup.tsx` | Signup screen |
| `app/(tabs)/_layout.tsx` | Tab navigation |
| `app/(tabs)/home.tsx` | Home screen |
| `app/(tabs)/workout.tsx` | Workout screen |
| `app/(tabs)/history.tsx` | History screen |
| `app/(tabs)/profile.tsx` | Profile/settings |
| `app/onboarding.tsx` | Max lift entry + program generation |

## Verification

1. Fresh install -> onboarding -> enter max lifts -> program generated -> visible on home screen
2. Start workout -> log sets -> complete session -> appears in history
3. Close/reopen app -> all data persists (AsyncStorage)
4. Sign up -> local data migrates -> Supabase dashboard shows records with correct user_id
5. Sign out -> data still local -> sign in -> sync resumes
6. Complete 4-week cycle -> progression calculates new maxes -> new cycle generated
