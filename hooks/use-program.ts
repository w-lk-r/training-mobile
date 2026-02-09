import { useSelector } from "@legendapp/state/react";
import {
  exercises$,
  programs$,
  programWeeks$,
  workoutDays$,
  workoutSets$,
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
