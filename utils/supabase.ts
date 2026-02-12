import { Observable, observable, syncState } from "@legendapp/state";
import { observablePersistAsyncStorage } from "@legendapp/state/persist-plugins/async-storage";
import { configureSynced, synced } from "@legendapp/state/sync";
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
// Active Session State (persisted to AsyncStorage)
// ============================================================

const asyncStoragePlugin = observablePersistAsyncStorage({ AsyncStorage });

export const activeSessionId$ = observable<string | null>(
  synced({
    initial: null,
    persist: { name: "activeSessionId", plugin: asyncStoragePlugin },
  }),
);

export const activeSessionDayIds$ = observable<string[]>(
  synced({
    initial: [] as string[],
    persist: { name: "activeSessionDayIds", plugin: asyncStoragePlugin },
  }),
);

export const activeAdHocExerciseIds$ = observable<string[]>(
  synced({
    initial: [] as string[],
    persist: { name: "activeAdHocExerciseIds", plugin: asyncStoragePlugin },
  }),
);

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

export const sessionWorkoutDays$ = observable(
  customSynced({
    supabase,
    collection: "session_workout_days",
    actions: ["read", "create", "update", "delete"],
    realtime: true,
    persist: { name: "session_workout_days", retrySync: true },
    retry: { infinite: true },
  }),
);

export const workoutTemplates$ = observable(
  customSynced({
    supabase,
    collection: "workout_templates",
    actions: ["read", "create", "update", "delete"],
    realtime: true,
    persist: { name: "workout_templates", retrySync: true },
    retry: { infinite: true },
  }),
);

export const templateItems$ = observable(
  customSynced({
    supabase,
    collection: "template_items",
    actions: ["read", "create", "update", "delete"],
    realtime: true,
    persist: { name: "template_items", retrySync: true },
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
  sessionWorkoutDays: sessionWorkoutDays$,
  workoutTemplates: workoutTemplates$,
  templateItems: templateItems$,
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

export async function clearLocalCache() {
  const keys = await AsyncStorage.getAllKeys();
  // Remove all Legend State persisted data keys but preserve auth session
  const cacheKeys = keys.filter(
    (k) => !k.startsWith("supabase") && !k.startsWith("sb-"),
  );
  await AsyncStorage.multiRemove(cacheKeys);
}

export function addProgram(
  name: string,
  description?: string,
  weeksCount?: number,
  programType?: string,
) {
  const id = generateId();
  programs$[id].assign({
    id,
    user_id: getUserId(),
    name,
    description: description ?? null,
    weeks_count: weeksCount ?? 4,
    current_week: 1,
    start_date: new Date().toISOString(),
    program_type: programType ?? "powerlifting",
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

export function deleteProgram(programId: string) {
  // Soft-delete the program
  programs$[programId].deleted.set(true);

  // Soft-delete associated weeks, days, and sets
  const weeks = programWeeks$.get();
  if (weeks) {
    for (const week of Object.values(weeks)) {
      if (week && week.program_id === programId && !week.deleted) {
        programWeeks$[week.id].deleted.set(true);

        const days = workoutDays$.get();
        if (days) {
          for (const day of Object.values(days)) {
            if (day && day.program_week_id === week.id && !day.deleted) {
              workoutDays$[day.id].deleted.set(true);

              const sets = workoutSets$.get();
              if (sets) {
                for (const set of Object.values(sets)) {
                  if (set && set.workout_day_id === day.id && !set.deleted) {
                    workoutSets$[set.id].deleted.set(true);
                  }
                }
              }
            }
          }
        }
      }
    }
  }
}

export function addWorkoutSession(workoutDayId?: string) {
  const id = generateId();
  workoutSessions$[id].assign({
    id,
    user_id: getUserId(),
    workout_day_id: workoutDayId ?? null,
    completed_at: null,
  });
  return id;
}

export function addSessionWorkoutDay(
  sessionId: string,
  workoutDayId: string,
  sortOrder: number,
) {
  const id = generateId();
  sessionWorkoutDays$[id].assign({
    id,
    user_id: getUserId(),
    session_id: sessionId,
    workout_day_id: workoutDayId,
    sort_order: sortOrder,
  });
  return id;
}

export function addWorkoutTemplate(name: string) {
  const id = generateId();
  workoutTemplates$[id].assign({
    id,
    user_id: getUserId(),
    name,
  });
  return id;
}

export function addTemplateItem(
  templateId: string,
  exerciseId: string,
  sortOrder: number,
  reps: number,
  percentageOfMax: number | null,
  rpe: number | null,
  workoutDayId: string | null,
) {
  const id = generateId();
  templateItems$[id].assign({
    id,
    user_id: getUserId(),
    template_id: templateId,
    exercise_id: exerciseId,
    sort_order: sortOrder,
    reps,
    percentage_of_max: percentageOfMax,
    rpe,
    workout_day_id: workoutDayId,
  });
  return id;
}

export function deleteTemplate(templateId: string) {
  workoutTemplates$[templateId].deleted.set(true);
  const items = templateItems$.get();
  if (items) {
    for (const item of Object.values(items)) {
      if (item && item.template_id === templateId && !item.deleted) {
        templateItems$[item.id].deleted.set(true);
      }
    }
  }
}

export function setCurrentWeek(programId: string, week: number) {
  const program = programs$[programId].get();
  if (!program || program.deleted) return;
  const total = program.weeks_count ?? 4;
  if (week >= 1 && week <= total) {
    programs$[programId].current_week.set(week);
  }
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
