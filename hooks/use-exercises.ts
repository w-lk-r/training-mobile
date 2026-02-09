import { useSelector } from "@legendapp/state/react";
import { exercises$, maxLifts$ } from "../utils/supabase";
import type { Tables } from "../utils/database.types";

export function useExercises() {
  const exercises = useSelector(() => {
    const data = exercises$.get();
    if (!data) return [];
    return Object.values(data).filter(
      (e: any) => e && !e.deleted,
    ) as Tables<"exercises">[];
  });

  return exercises;
}

/** Returns the most recent max lift for each exercise as { [exerciseId]: weightKg } */
export function useMaxLifts(): Record<string, number> {
  return useSelector(() => {
    const data = maxLifts$.get();
    if (!data) return {};

    const map: Record<string, { weight: number; date: string }> = {};
    Object.values(data).forEach((lift: any) => {
      if (!lift || lift.deleted) return;
      const existing = map[lift.exercise_id];
      if (!existing || lift.date_recorded > existing.date) {
        map[lift.exercise_id] = {
          weight: lift.weight_kg,
          date: lift.date_recorded,
        };
      }
    });

    const result: Record<string, number> = {};
    for (const [id, { weight }] of Object.entries(map)) {
      result[id] = weight;
    }
    return result;
  });
}
