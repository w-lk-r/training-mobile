/**
 * Tests for program hook logic (week completion, auto-advance, day names).
 * Tests the selector logic by simulating observable state.
 */

import type { Tables } from "../../utils/database.types";

// Mock supabase observables
const mockPrograms: Record<string, any> = {};
const mockWeeks: Record<string, any> = {};
const mockDays: Record<string, any> = {};
const mockSessions: Record<string, any> = {};
const mockSets: Record<string, any> = {};
const mockExercises: Record<string, any> = {};

jest.mock("../../utils/supabase", () => ({
  __esModule: true,
  programs$: { get: jest.fn(() => mockPrograms) },
  programWeeks$: { get: jest.fn(() => mockWeeks) },
  workoutDays$: { get: jest.fn(() => mockDays) },
  workoutSessions$: { get: jest.fn(() => mockSessions) },
  workoutSets$: { get: jest.fn(() => mockSets) },
  exercises$: { get: jest.fn(() => mockExercises) },
  workoutTemplates$: { get: jest.fn(() => ({})) },
  templateItems$: { get: jest.fn(() => ({})) },
  setCurrentWeek: jest.fn(),
}));

// eslint-disable-next-line @typescript-eslint/no-require-imports
const supabaseMock = require("../../utils/supabase");

// Mock React hooks used by use-program
jest.mock("react", () => ({
  ...jest.requireActual("react"),
  useEffect: jest.fn((fn) => fn()),
  useRef: jest.fn((val) => ({ current: val })),
  useCallback: jest.fn((fn) => fn),
}));

// Mock useSelector to just call the selector function
jest.mock("@legendapp/state/react", () => ({
  useSelector: jest.fn((fn: () => unknown) => fn()),
}));

import {
  useWeekCompletion,
  useCompletedWeeks,
  useWorkoutDayNames,
  useWorkoutDayExercises,
} from "../use-program";

function clearAll() {
  for (const k of Object.keys(mockPrograms)) delete mockPrograms[k];
  for (const k of Object.keys(mockWeeks)) delete mockWeeks[k];
  for (const k of Object.keys(mockDays)) delete mockDays[k];
  for (const k of Object.keys(mockSessions)) delete mockSessions[k];
  for (const k of Object.keys(mockSets)) delete mockSets[k];
  for (const k of Object.keys(mockExercises)) delete mockExercises[k];
}

beforeEach(() => {
  jest.clearAllMocks();
  clearAll();
});

// --- Helper to populate a basic program ---
function seedProgram() {
  mockPrograms["prog-1"] = {
    id: "prog-1", name: "Test Program", current_week: 1, weeks_count: 4,
    deleted: false, start_date: "2026-01-01",
  };
  mockWeeks["week-1"] = { id: "week-1", program_id: "prog-1", week_number: 1, deleted: false };
  mockWeeks["week-2"] = { id: "week-2", program_id: "prog-1", week_number: 2, deleted: false };
  mockDays["day-1"] = { id: "day-1", program_week_id: "week-1", day_number: 1, name: "Squat Day", deleted: false };
  mockDays["day-2"] = { id: "day-2", program_week_id: "week-1", day_number: 2, name: "Bench Day", deleted: false };
  mockDays["day-3"] = { id: "day-3", program_week_id: "week-2", day_number: 1, name: "Deadlift Day", deleted: false };
}

// ─── useWeekCompletion ──────────────────────────────────────────────

describe("useWeekCompletion", () => {
  it("returns empty when no program", () => {
    const result = useWeekCompletion(undefined, 1);
    expect(result.totalDays).toBe(0);
    expect(result.allComplete).toBe(false);
  });

  it("returns zero completion when no sessions exist", () => {
    seedProgram();
    const result = useWeekCompletion("prog-1", 1);
    expect(result.totalDays).toBe(2);
    expect(result.completedDayIds.size).toBe(0);
    expect(result.allComplete).toBe(false);
  });

  it("tracks partial completion", () => {
    seedProgram();
    mockSessions["s-1"] = {
      id: "s-1", workout_day_id: "day-1", completed_at: "2026-01-05", deleted: false,
    };

    const result = useWeekCompletion("prog-1", 1);
    expect(result.completedDayIds.size).toBe(1);
    expect(result.completedDayIds.has("day-1")).toBe(true);
    expect(result.allComplete).toBe(false);
  });

  it("detects all-complete when every day has a session", () => {
    seedProgram();
    mockSessions["s-1"] = {
      id: "s-1", workout_day_id: "day-1", completed_at: "2026-01-05", deleted: false,
    };
    mockSessions["s-2"] = {
      id: "s-2", workout_day_id: "day-2", completed_at: "2026-01-06", deleted: false,
    };

    const result = useWeekCompletion("prog-1", 1);
    expect(result.allComplete).toBe(true);
    expect(result.completedDayIds.size).toBe(2);
  });

  it("ignores deleted sessions", () => {
    seedProgram();
    mockSessions["s-1"] = {
      id: "s-1", workout_day_id: "day-1", completed_at: "2026-01-05", deleted: true,
    };

    const result = useWeekCompletion("prog-1", 1);
    expect(result.completedDayIds.size).toBe(0);
  });

  it("ignores sessions without completed_at", () => {
    seedProgram();
    mockSessions["s-1"] = {
      id: "s-1", workout_day_id: "day-1", completed_at: null, deleted: false,
    };

    const result = useWeekCompletion("prog-1", 1);
    expect(result.completedDayIds.size).toBe(0);
  });
});

// ─── useCompletedWeeks ──────────────────────────────────────────────

describe("useCompletedWeeks", () => {
  it("returns empty set for no program", () => {
    const result = useCompletedWeeks(undefined, 4);
    expect(result.size).toBe(0);
  });

  it("identifies completed weeks", () => {
    seedProgram();
    // Complete week 1 (both days)
    mockSessions["s-1"] = {
      id: "s-1", workout_day_id: "day-1", completed_at: "2026-01-05", deleted: false,
    };
    mockSessions["s-2"] = {
      id: "s-2", workout_day_id: "day-2", completed_at: "2026-01-06", deleted: false,
    };

    const result = useCompletedWeeks("prog-1", 4);
    expect(result.has(1)).toBe(true);
    expect(result.has(2)).toBe(false);
  });

  it("does not mark partially completed weeks", () => {
    seedProgram();
    mockSessions["s-1"] = {
      id: "s-1", workout_day_id: "day-1", completed_at: "2026-01-05", deleted: false,
    };

    const result = useCompletedWeeks("prog-1", 4);
    expect(result.has(1)).toBe(false);
  });
});

// ─── useWorkoutDayNames ─────────────────────────────────────────────

describe("useWorkoutDayNames", () => {
  it("returns empty map for empty input", () => {
    const result = useWorkoutDayNames([]);
    expect(result.size).toBe(0);
  });

  it("resolves day IDs to names", () => {
    seedProgram();
    const result = useWorkoutDayNames(["day-1", "day-2"]);
    expect(result.get("day-1")).toBe("Squat Day");
    expect(result.get("day-2")).toBe("Bench Day");
  });

  it("handles missing day IDs gracefully", () => {
    seedProgram();
    const result = useWorkoutDayNames(["day-1", "day-999"]);
    expect(result.get("day-1")).toBe("Squat Day");
    expect(result.has("day-999")).toBe(false);
  });
});

// ─── useWorkoutDayExercises ─────────────────────────────────────────

describe("useWorkoutDayExercises", () => {
  it("returns empty for undefined day", () => {
    const result = useWorkoutDayExercises(undefined);
    expect(result).toEqual([]);
  });

  it("groups sets by exercise", () => {
    mockExercises["ex-1"] = { id: "ex-1", name: "Back Squat", deleted: false };
    mockExercises["ex-2"] = { id: "ex-2", name: "Leg Press", deleted: false };

    mockSets["set-1"] = {
      id: "set-1", workout_day_id: "day-1", exercise_id: "ex-1",
      set_number: 1, reps: 8, percentage_of_max: 0.7, deleted: false,
    };
    mockSets["set-2"] = {
      id: "set-2", workout_day_id: "day-1", exercise_id: "ex-1",
      set_number: 2, reps: 8, percentage_of_max: 0.7, deleted: false,
    };
    mockSets["set-3"] = {
      id: "set-3", workout_day_id: "day-1", exercise_id: "ex-2",
      set_number: 3, reps: 10, percentage_of_max: null, deleted: false,
    };

    const result = useWorkoutDayExercises("day-1");
    expect(result).toHaveLength(2);
    expect(result[0].exerciseName).toBe("Back Squat");
    expect(result[0].sets).toHaveLength(2);
    expect(result[1].exerciseName).toBe("Leg Press");
    expect(result[1].sets).toHaveLength(1);
  });

  it("ignores deleted sets", () => {
    mockExercises["ex-1"] = { id: "ex-1", name: "Back Squat", deleted: false };
    mockSets["set-1"] = {
      id: "set-1", workout_day_id: "day-1", exercise_id: "ex-1",
      set_number: 1, reps: 8, deleted: true,
    };

    const result = useWorkoutDayExercises("day-1");
    expect(result).toHaveLength(0);
  });

  it("ignores sets from other days", () => {
    mockExercises["ex-1"] = { id: "ex-1", name: "Back Squat", deleted: false };
    mockSets["set-1"] = {
      id: "set-1", workout_day_id: "day-1", exercise_id: "ex-1",
      set_number: 1, reps: 8, deleted: false,
    };
    mockSets["set-2"] = {
      id: "set-2", workout_day_id: "day-2", exercise_id: "ex-1",
      set_number: 1, reps: 6, deleted: false,
    };

    const result = useWorkoutDayExercises("day-1");
    expect(result).toHaveLength(1);
    expect(result[0].sets).toHaveLength(1);
  });
});
