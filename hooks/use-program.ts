import { useSelector } from "@legendapp/state/react";
import {
  exercises$,
  programs$,
  programWeeks$,
  workoutDays$,
  workoutSets$,
  workoutTemplates$,
  templateItems$,
} from "../utils/supabase";
import type { Tables } from "../utils/database.types";

/** Returns the most recent active (non-deleted) program */
export function useActiveProgram(): Tables<"programs"> | null {
  return useSelector(() => {
    const data = programs$.get();
    if (!data) return null;

    const active = Object.values(data)
      .filter((p: any) => p && !p.deleted)
      .sort(
        (a: any, b: any) =>
          new Date(b.start_date).getTime() - new Date(a.start_date).getTime(),
      ) as Tables<"programs">[];

    return active[0] ?? null;
  });
}

/** Returns workout days for a given week of a program */
export function useWeekWorkouts(
  programId: string | undefined,
  weekNumber: number,
) {
  return useSelector(() => {
    if (!programId) return [];

    const weeks = programWeeks$.get();
    if (!weeks) return [];

    const week = Object.values(weeks).find(
      (w: any) =>
        w &&
        !w.deleted &&
        w.program_id === programId &&
        w.week_number === weekNumber,
    ) as Tables<"program_weeks"> | undefined;

    if (!week) return [];

    const days = workoutDays$.get();
    if (!days) return [];

    return (
      Object.values(days)
        .filter(
          (d: any) => d && !d.deleted && d.program_week_id === week.id,
        ) as Tables<"workout_days">[]
    ).sort((a, b) => a.day_number - b.day_number);
  });
}

/** Workout set with resolved exercise name */
export interface WorkoutSetWithExercise extends Tables<"workout_sets"> {
  exercise_name: string;
}

/** Returns all sets for a given workout day, grouped by exercise */
export function useWorkoutDaySets(workoutDayId: string | undefined) {
  return useSelector(() => {
    if (!workoutDayId) return [];

    const sets = workoutSets$.get();
    if (!sets) return [];

    const exData = exercises$.get();

    const daySets = Object.values(sets)
      .filter(
        (s: any) => s && !s.deleted && s.workout_day_id === workoutDayId,
      )
      .map((s: any) => ({
        ...s,
        exercise_name:
          exData?.[s.exercise_id]?.name ?? "Unknown",
      })) as WorkoutSetWithExercise[];

    return daySets.sort((a, b) => a.set_number - b.set_number);
  });
}

/** Groups sets by exercise for display */
export interface ExerciseGroup {
  exerciseId: string;
  exerciseName: string;
  sets: Tables<"workout_sets">[];
}

export function useWorkoutDayExercises(
  workoutDayId: string | undefined,
): ExerciseGroup[] {
  return useSelector(() => {
    if (!workoutDayId) return [];

    const sets = workoutSets$.get();
    if (!sets) return [];

    const exData = exercises$.get();

    const daySets = Object.values(sets).filter(
      (s: any) => s && !s.deleted && s.workout_day_id === workoutDayId,
    ) as Tables<"workout_sets">[];

    // Group by exercise, preserving order
    const groups: Record<string, ExerciseGroup> = {};
    const order: string[] = [];

    daySets
      .sort((a, b) => a.set_number - b.set_number)
      .forEach((set) => {
        if (!groups[set.exercise_id]) {
          groups[set.exercise_id] = {
            exerciseId: set.exercise_id,
            exerciseName: exData?.[set.exercise_id]?.name ?? "Unknown",
            sets: [],
          };
          order.push(set.exercise_id);
        }
        groups[set.exercise_id].sets.push(set);
      });

    return order.map((id) => groups[id]);
  });
}

/** Returns all non-deleted programs, newest first */
export function useAllPrograms(): Tables<"programs">[] {
  return useSelector(() => {
    const data = programs$.get();
    if (!data) return [];
    return (
      Object.values(data)
        .filter((p: any) => p && !p.deleted) as Tables<"programs">[]
    ).sort(
      (a, b) =>
        new Date(b.start_date!).getTime() - new Date(a.start_date!).getTime(),
    );
  });
}

/** Returns all workout days across all current weeks of all programs */
export function useAllCurrentWorkoutDays(): (Tables<"workout_days"> & {
  programName: string;
  programId: string;
  weekNumber: number;
})[] {
  return useSelector(() => {
    const progs = programs$.get();
    const weeks = programWeeks$.get();
    const days = workoutDays$.get();
    if (!progs || !weeks || !days) return [];

    // Build a map of current week IDs per program
    const currentWeekIds: Record<string, { weekId: string; weekNumber: number; programName: string; programId: string }> = {};
    for (const prog of Object.values(progs) as any[]) {
      if (!prog || prog.deleted) continue;
      for (const week of Object.values(weeks) as any[]) {
        if (
          week &&
          !week.deleted &&
          week.program_id === prog.id &&
          week.week_number === (prog.current_week ?? 1)
        ) {
          currentWeekIds[week.id] = {
            weekId: week.id,
            weekNumber: week.week_number,
            programName: prog.name,
            programId: prog.id,
          };
        }
      }
    }

    const result: (Tables<"workout_days"> & {
      programName: string;
      programId: string;
      weekNumber: number;
    })[] = [];

    for (const day of Object.values(days) as any[]) {
      if (!day || day.deleted) continue;
      const weekInfo = currentWeekIds[day.program_week_id];
      if (weekInfo) {
        result.push({
          ...day,
          programName: weekInfo.programName,
          programId: weekInfo.programId,
          weekNumber: weekInfo.weekNumber,
        });
      }
    }

    return result.sort((a, b) => {
      if (a.programName !== b.programName) return a.programName.localeCompare(b.programName);
      return a.day_number - b.day_number;
    });
  });
}

/** Returns all workout templates */
export function useWorkoutTemplates(): Tables<"workout_templates">[] {
  return useSelector(() => {
    const data = workoutTemplates$.get();
    if (!data) return [];
    return (
      Object.values(data)
        .filter((t: any) => t && !t.deleted) as Tables<"workout_templates">[]
    ).sort(
      (a, b) =>
        new Date(b.created_at!).getTime() - new Date(a.created_at!).getTime(),
    );
  });
}

/** Returns template items for a given template, sorted by sort_order */
export function useTemplateItems(
  templateId: string | undefined,
): Tables<"template_items">[] {
  return useSelector(() => {
    if (!templateId) return [];
    const data = templateItems$.get();
    if (!data) return [];
    return (
      Object.values(data)
        .filter(
          (i: any) => i && !i.deleted && i.template_id === templateId,
        ) as Tables<"template_items">[]
    ).sort((a, b) => a.sort_order - b.sort_order);
  });
}

/** Returns exercise groups from multiple workout day IDs combined */
export function useMultiDayExercises(
  workoutDayIds: string[],
): ExerciseGroup[] {
  return useSelector(() => {
    if (workoutDayIds.length === 0) return [];

    const sets = workoutSets$.get();
    if (!sets) return [];

    const exData = exercises$.get();
    const dayIdSet = new Set(workoutDayIds);

    const allSets = Object.values(sets).filter(
      (s: any) => s && !s.deleted && dayIdSet.has(s.workout_day_id),
    ) as Tables<"workout_sets">[];

    const groups: Record<string, ExerciseGroup> = {};
    const order: string[] = [];

    allSets
      .sort((a, b) => a.set_number - b.set_number)
      .forEach((set) => {
        if (!groups[set.exercise_id]) {
          groups[set.exercise_id] = {
            exerciseId: set.exercise_id,
            exerciseName: exData?.[set.exercise_id]?.name ?? "Unknown",
            sets: [],
          };
          order.push(set.exercise_id);
        }
        groups[set.exercise_id].sets.push(set);
      });

    return order.map((id) => groups[id]);
  });
}
