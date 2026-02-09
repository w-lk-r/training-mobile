import { Observable, observable, syncState } from "@legendapp/state";
import { observablePersistAsyncStorage } from "@legendapp/state/persist-plugins/async-storage";
import { configureSynced } from "@legendapp/state/sync";
import { syncedSupabase } from "@legendapp/state/sync-plugins/supabase";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";
import "react-native-get-random-values";
import { v4 as uuidv4 } from "uuid";
import { Database } from "./database.types";

// ============================================================
// Supabase Client
// ============================================================

export const supabase = createClient<Database>(
  process.env.EXPO_PUBLIC_SUPABASE_URL!,
  process.env.EXPO_PUBLIC_SUPABASE_KEY!,
  {
    auth: {
      storage: AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  },
);

// ============================================================
// ID Generation
// ============================================================

export const generateId = () => uuidv4();

// ============================================================
// Configured Sync (shared defaults)
// ============================================================

const customSynced = configureSynced(syncedSupabase, {
  persist: {
    plugin: observablePersistAsyncStorage({ AsyncStorage }),
  },
  generateId,
  supabase,
  changesSince: "last-sync",
  fieldCreatedAt: "created_at",
  fieldUpdatedAt: "updated_at",
  fieldDeleted: "deleted",
});

// ============================================================
// Auth state (set by AuthContext)
// ============================================================

export const authUserId$ = observable<string>("local");

function getUserId(): string {
  return authUserId$.get();
}

// ============================================================
// Observables — one per table, sync disabled by default
// ============================================================

export const exercises$ = observable(
  customSynced({
    supabase,
    collection: "exercises",
    actions: ["read", "create", "update", "delete"],
    realtime: true,
    persist: { name: "exercises", retrySync: true },
    retry: { infinite: true },
  }),
);

export const maxLifts$ = observable(
  customSynced({
    supabase,
    collection: "max_lifts",
    actions: ["read", "create", "update", "delete"],
    realtime: true,
    persist: { name: "max_lifts", retrySync: true },
    retry: { infinite: true },
  }),
);

export const programs$ = observable(
  customSynced({
    supabase,
    collection: "programs",
    actions: ["read", "create", "update", "delete"],
    realtime: true,
    persist: { name: "programs", retrySync: true },
    retry: { infinite: true },
  }),
);

export const programWeeks$ = observable(
  customSynced({
    supabase,
    collection: "program_weeks",
    actions: ["read", "create", "update", "delete"],
    realtime: true,
    persist: { name: "program_weeks", retrySync: true },
    retry: { infinite: true },
  }),
);

export const workoutDays$ = observable(
  customSynced({
    supabase,
    collection: "workout_days",
    actions: ["read", "create", "update", "delete"],
    realtime: true,
    persist: { name: "workout_days", retrySync: true },
    retry: { infinite: true },
  }),
);

export const workoutSets$ = observable(
  customSynced({
    supabase,
    collection: "workout_sets",
    actions: ["read", "create", "update", "delete"],
    realtime: true,
    persist: { name: "workout_sets", retrySync: true },
    retry: { infinite: true },
  }),
);

export const workoutSessions$ = observable(
  customSynced({
    supabase,
    collection: "workout_sessions",
    actions: ["read", "create", "update", "delete"],
    realtime: true,
    persist: { name: "workout_sessions", retrySync: true },
    retry: { infinite: true },
  }),
);

export const setLogs$ = observable(
  customSynced({
    supabase,
    collection: "set_logs",
    actions: ["read", "create", "update", "delete"],
    realtime: true,
    persist: { name: "set_logs", retrySync: true },
    retry: { infinite: true },
  }),
);

// All observables for bulk sync toggling
export const allObservables: Record<string, Observable> = {
  exercises: exercises$,
  maxLifts: maxLifts$,
  programs: programs$,
  programWeeks: programWeeks$,
  workoutDays: workoutDays$,
  workoutSets: workoutSets$,
  workoutSessions: workoutSessions$,
  setLogs: setLogs$,
};

// ============================================================
// Sync Control
// ============================================================

export function enableAllSync() {
  Object.values(allObservables).forEach((obs$) => {
    syncState(obs$).isSyncEnabled.set(true);
  });
}

export function disableAllSync() {
  Object.values(allObservables).forEach((obs$) => {
    syncState(obs$).isSyncEnabled.set(false);
  });
}

// ============================================================
// CRUD Helpers
// ============================================================

export function addExercise(name: string, category: string) {
  const id = generateId();
  exercises$[id].assign({
    id,
    user_id: getUserId(),
    name,
    category,
  });
  return id;
}

export function addMaxLift(exerciseId: string, weightKg: number) {
  const id = generateId();
  maxLifts$[id].assign({
    id,
    user_id: getUserId(),
    exercise_id: exerciseId,
    weight_kg: weightKg,
    date_recorded: new Date().toISOString(),
  });
  return id;
}

export function addProgram(name: string, description?: string) {
  const id = generateId();
  programs$[id].assign({
    id,
    user_id: getUserId(),
    name,
    description: description ?? null,
    weeks_count: 4,
    current_week: 1,
    start_date: new Date().toISOString(),
  });
  return id;
}

export function addProgramWeek(programId: string, weekNumber: number) {
  const id = generateId();
  programWeeks$[id].assign({
    id,
    user_id: getUserId(),
    program_id: programId,
    week_number: weekNumber,
  });
  return id;
}

export function addWorkoutDay(
  programWeekId: string,
  dayNumber: number,
  name: string,
) {
  const id = generateId();
  workoutDays$[id].assign({
    id,
    user_id: getUserId(),
    program_week_id: programWeekId,
    day_number: dayNumber,
    name,
  });
  return id;
}

export function addWorkoutSet(
  workoutDayId: string,
  exerciseId: string,
  setNumber: number,
  reps: number,
  percentageOfMax: number | null,
  rpe: number | null,
) {
  const id = generateId();
  workoutSets$[id].assign({
    id,
    user_id: getUserId(),
    workout_day_id: workoutDayId,
    exercise_id: exerciseId,
    set_number: setNumber,
    reps,
    percentage_of_max: percentageOfMax,
    rpe,
  });
  return id;
}

export function addWorkoutSession(workoutDayId: string) {
  const id = generateId();
  workoutSessions$[id].assign({
    id,
    user_id: getUserId(),
    workout_day_id: workoutDayId,
    completed_at: new Date().toISOString(),
  });
  return id;
}

export function addSetLog(
  workoutSessionId: string,
  exerciseId: string,
  weightKg: number,
  repsCompleted: number,
  workoutSetId?: string,
  rpe?: number,
) {
  const id = generateId();
  setLogs$[id].assign({
    id,
    user_id: getUserId(),
    workout_session_id: workoutSessionId,
    workout_set_id: workoutSetId ?? null,
    exercise_id: exerciseId,
    weight_kg: weightKg,
    reps_completed: repsCompleted,
    rpe: rpe ?? null,
  });
  return id;
}
