# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Expo (SDK 54) + React Native strength training app ("Strava for Strength & Conditioning"). Local-first architecture with Supabase cloud sync via Legend State observables. See `VISION.md` for product philosophy and `PLAN.md` for implementation phases.

## Commands

- `npm start` — Start Expo dev server
- `npm run ios` / `npm run android` — Launch on simulator/emulator
- `npm test` — Run Jest tests
- `npx jest --testPathPattern=<pattern>` — Run a single test file
- `npm run lint` — ESLint
- `npx supabase start` — Start local Supabase
- `npx supabase migration new <name>` — Create a new migration

## Environment

Copy `.env.example` to `.env` and fill in `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_KEY`.

## Architecture

### Routing & Screens

expo-router file-based routing. Route files in `/app/` are thin wrappers that import actual UI from `/components/screens/`. Bottom tabs: Programs, Start Workout, History, Profile. Auth flow in `/(auth)/`.

### State Management

Legend State observables with Supabase sync and AsyncStorage persistence. Each DB table has a corresponding observable in `utils/supabase.ts` (e.g. `programs$`, `exercises$`). Hooks in `/hooks/` derive reactive state via `useSelector`. Auth state managed in `/contexts/auth-context.tsx`.

### Local-First Data Flow

1. All data works offline via observables persisted to AsyncStorage
2. New users get `user_id: 'local'`
3. On signup, `migrateLocalDataToSupabase()` in `utils/data-migration.ts` replaces 'local' with real UUID
4. Supabase sync enabled only after auth

### Soft Deletes

All tables use a `deleted` boolean column. Never hard-delete records — set `deleted: true`. All selectors must filter out `deleted` records. Cascading deletes are manual (e.g. `deleteProgram()` soft-deletes child weeks, days, sets).

### Database Schema

Migrations in `/supabase/migrations/`. All tables have RLS policies scoped to `auth.uid()`, `user_id` FK, and `created_at`/`updated_at` timestamps. Key tables: `programs` → `program_weeks` → `workout_days` → `workout_sets` for prescribed work; `workout_sessions` → `set_logs` for logged performance.

### Program Generation

`/services/program-generator.ts` generates multi-week periodized programs. `DEFAULT_EXERCISES` defines the exercise library. `WEEKLY_MAIN_LIFT_SCHEME` controls periodization percentages across weeks. Programs support types: powerlifting, olympic, crossfit, zone2.

### Path Aliases

`@/*` maps to project root (configured in tsconfig.json).

## Key Patterns

- CRUD helpers are centralized in `utils/supabase.ts` — use them instead of direct observable manipulation
- UUIDs generated client-side via `uuid` package
- `activeSessionId$` persists to AsyncStorage so active workouts survive app restarts
- Multi-program sessions use `session_workout_days` junction table with `sort_order`