import { useState } from "react";
import { useSelector } from "@legendapp/state/react";
import {
  addWorkoutSession,
  addSetLog,
  workoutSessions$,
  setLogs$,
} from "../utils/supabase";
import type { Tables } from "../utils/database.types";

export function useWorkoutSession(workoutDayId: string) {
  const [sessionId, setSessionId] = useState<string | null>(null);

  const startSession = () => {
    const id = addWorkoutSession(workoutDayId);
    setSessionId(id);
    return id;
  };

  const logSet = (
    exerciseId: string,
    weightKg: number,
    repsCompleted: number,
    workoutSetId?: string,
    rpe?: number,
  ) => {
    if (!sessionId) return;
    addSetLog(sessionId, exerciseId, weightKg, repsCompleted, workoutSetId, rpe);
  };

  const endSession = (notes?: string) => {
    if (sessionId && notes) {
      workoutSessions$[sessionId].notes.set(notes);
    }
    setSessionId(null);
  };

  return { sessionId, startSession, logSet, endSession };
}

/** Returns completed sessions, most recent first */
export function useWorkoutHistory() {
  return useSelector(() => {
    const data = workoutSessions$.get();
    if (!data) return [];

    return (
      Object.values(data)
        .filter((s: any) => s && !s.deleted) as Tables<"workout_sessions">[]
    ).sort(
      (a, b) =>
        new Date(b.completed_at!).getTime() -
        new Date(a.completed_at!).getTime(),
    );
  });
}

/** Returns set logs for a given session */
export function useSessionLogs(sessionId: string | undefined) {
  return useSelector(() => {
    if (!sessionId) return [];

    const data = setLogs$.get();
    if (!data) return [];

    return (
      Object.values(data)
        .filter(
          (l: any) =>
            l && !l.deleted && l.workout_session_id === sessionId,
        ) as Tables<"set_logs">[]
    ).sort(
      (a, b) =>
        new Date(a.created_at!).getTime() - new Date(b.created_at!).getTime(),
    );
  });
}
