import { useSelector } from "@legendapp/state/react";
import {
  addWorkoutSession,
  addSetLog,
  workoutSessions$,
  setLogs$,
  activeSessionId$,
  activeSessionDayIds$,
  activeAdHocExerciseIds$,
} from "../utils/supabase";

export function useWorkoutSession() {
  const sessionId = useSelector(() => activeSessionId$.get());

  const startSession = (dayIds: string[], adHocExerciseIds?: string[]) => {
    // Prevent duplicates — return existing if active
    const existing = activeSessionId$.get();
    if (existing) return existing;

    const id = addWorkoutSession();
    activeSessionId$.set(id);
    activeSessionDayIds$.set(dayIds);
    activeAdHocExerciseIds$.set(adHocExerciseIds ?? []);
    return id;
  };

  const logSet = (
    exerciseId: string,
    weightKg: number,
    repsCompleted: number,
    workoutSetId?: string,
    rpe?: number,
  ) => {
    const sid = activeSessionId$.get();
    if (!sid) return;
    addSetLog(sid, exerciseId, weightKg, repsCompleted, workoutSetId, rpe);
  };

  const endSession = (notes?: string) => {
    const sid = activeSessionId$.get();
    if (sid) {
      workoutSessions$[sid].completed_at.set(new Date().toISOString());
      if (notes) {
        workoutSessions$[sid].notes.set(notes);
      }
    }
    activeSessionId$.set(null);
    activeSessionDayIds$.set([]);
    activeAdHocExerciseIds$.set([]);
  };

  return { sessionId, startSession, logSet, endSession };
}

/** Hook to read persisted day IDs for the active session */
export function useActiveSessionDayIds(): string[] {
  return useSelector(() => activeSessionDayIds$.get()) ?? [];
}

/** Hook to read persisted ad-hoc exercise IDs for the active session */
export function useActiveAdHocExerciseIds(): string[] {
  return useSelector(() => activeAdHocExerciseIds$.get()) ?? [];
}

/** Returns completed sessions, most recent first */
export function useWorkoutHistory() {
  return useSelector(() => {
    const data = workoutSessions$.get();
    if (!data) return [];

    return (
      Object.values(data)
        .filter(
          (s) => s && !s.deleted && s.completed_at != null,
        )
    ).sort(
      (a, b) =>
        new Date(b.completed_at ?? 0).getTime() -
        new Date(a.completed_at ?? 0).getTime(),
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
          (l) =>
            l && !l.deleted && l.workout_session_id === sessionId,
        )
    ).sort(
      (a, b) =>
        new Date(a.created_at ?? 0).getTime() - new Date(b.created_at ?? 0).getTime(),
    );
  });
}
