import { useEffect, useRef } from "react";
import { useSelector } from "@legendapp/state/react";
import {
  setCurrentWeek,
  exercises$,
  programs$,
  programWeeks$,
  workoutDays$,
  workoutSets$,
  workoutSessions$,
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
      .filter((p) => p && !p.deleted)
      .sort(
        (a, b) =>
          new Date(b.start_date ?? 0).getTime() - new Date(a.start_date ?? 0).getTime(),
      );

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
      (w) =>
        w &&
        !w.deleted &&
        w.program_id === programId &&
        w.week_number === weekNumber,
    );

    if (!week) return [];

    const days = workoutDays$.get();
    if (!days) return [];

    return Object.values(days)
      .filter(
        (d) => d && !d.deleted && d.program_week_id === week.id,
      )
      .sort((a, b) => a.day_number - b.day_number);
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
        (s) => s && !s.deleted && s.workout_day_id === workoutDayId,
      )
      .map((s) => ({
        ...s,
        exercise_name:
          exData?.[s.exercise_id]?.name ?? "Unknown",
      }));

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
      (s) => s && !s.deleted && s.workout_day_id === workoutDayId,
    );

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
    return Object.values(data)
      .filter((p) => p && !p.deleted)
      .sort(
        (a, b) =>
          new Date(b.start_date ?? 0).getTime() - new Date(a.start_date ?? 0).getTime(),
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
    for (const prog of Object.values(progs)) {
      if (!prog || prog.deleted) continue;
      for (const week of Object.values(weeks)) {
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

    for (const day of Object.values(days)) {
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
    return Object.values(data)
      .filter((t) => t && !t.deleted)
      .sort(
        (a, b) =>
          new Date(b.created_at ?? 0).getTime() - new Date(a.created_at ?? 0).getTime(),
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
    return Object.values(data)
      .filter(
        (i) => i && !i.deleted && i.template_id === templateId,
      )
      .sort((a, b) => a.sort_order - b.sort_order);
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
      (s) => s && !s.deleted && dayIdSet.has(s.workout_day_id),
    );

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

/** Returns completion status for each day in a given week */
export function useWeekCompletion(
  programId: string | undefined,
  weekNumber: number,
): { completedDayIds: Set<string>; totalDays: number; allComplete: boolean } {
  return useSelector(() => {
    const empty = { completedDayIds: new Set<string>(), totalDays: 0, allComplete: false };
    if (!programId) return empty;

    const weeks = programWeeks$.get();
    if (!weeks) return empty;

    const week = Object.values(weeks).find(
      (w) =>
        w && !w.deleted && w.program_id === programId && w.week_number === weekNumber,
    );
    if (!week) return empty;

    const days = workoutDays$.get();
    if (!days) return empty;

    const weekDays = Object.values(days).filter(
      (d) => d && !d.deleted && d.program_week_id === week.id,
    );

    if (weekDays.length === 0) return empty;

    const sessions = workoutSessions$.get();
    const completedDayIds = new Set<string>();

    if (sessions) {
      for (const session of Object.values(sessions)) {
        if (
          session &&
          !session.deleted &&
          session.completed_at &&
          session.workout_day_id
        ) {
          completedDayIds.add(session.workout_day_id);
        }
      }
    }

    // Only keep day IDs that belong to this week
    const weekDayIds = new Set(weekDays.map((d) => d.id));
    const relevantCompleted = new Set<string>();
    for (const id of completedDayIds) {
      if (weekDayIds.has(id)) relevantCompleted.add(id);
    }

    return {
      completedDayIds: relevantCompleted,
      totalDays: weekDays.length,
      allComplete: relevantCompleted.size >= weekDays.length,
    };
  });
}

/** Returns a Set of week numbers where all days have completed sessions */
export function useCompletedWeeks(
  programId: string | undefined,
  weeksCount: number,
): Set<number> {
  return useSelector(() => {
    const result = new Set<number>();
    if (!programId || weeksCount === 0) return result;

    const weeks = programWeeks$.get();
    const days = workoutDays$.get();
    const sessions = workoutSessions$.get();
    if (!weeks || !days) return result;

    // Build set of all completed day IDs
    const completedDayIds = new Set<string>();
    if (sessions) {
      for (const session of Object.values(sessions)) {
        if (session && !session.deleted && session.completed_at && session.workout_day_id) {
          completedDayIds.add(session.workout_day_id);
        }
      }
    }

    // Check each week
    for (const week of Object.values(weeks)) {
      if (!week || week.deleted || week.program_id !== programId) continue;

      const weekDays = Object.values(days).filter(
        (d) => d && !d.deleted && d.program_week_id === week.id,
      );

      if (weekDays.length > 0 && weekDays.every((d) => completedDayIds.has(d.id))) {
        result.add(week.week_number);
      }
    }

    return result;
  });
}

/** Auto-advances the week when all days are complete */
export function useAutoAdvanceWeek(program: Tables<"programs"> | null) {
  const currentWeek = program?.current_week ?? 1;
  const weeksCount = program?.weeks_count ?? 4;
  const completion = useWeekCompletion(program?.id, currentWeek);
  const lastAdvancedWeek = useRef(currentWeek);

  useEffect(() => {
    lastAdvancedWeek.current = currentWeek;
  }, [currentWeek]);

  useEffect(() => {
    if (
      program &&
      completion.allComplete &&
      currentWeek < weeksCount &&
      lastAdvancedWeek.current === currentWeek
    ) {
      lastAdvancedWeek.current = currentWeek + 1;
      setCurrentWeek(program.id, currentWeek + 1);
    }
  }, [program, completion.allComplete, currentWeek, weeksCount]);
}
