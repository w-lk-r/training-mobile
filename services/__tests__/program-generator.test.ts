import {
  DEFAULT_EXERCISES,
  WEEKLY_MAIN_LIFT_SCHEME,
  ACCESSORY_SCHEME,
  type MainLiftCategory,
} from "../../types/program";

// --- Mock utils/supabase ---
jest.mock("../../utils/supabase", () => ({
  __esModule: true,
  addExercise: jest.fn(),
  addProgram: jest.fn(),
  addProgramWeek: jest.fn(),
  addWorkoutDay: jest.fn(),
  addWorkoutSet: jest.fn(),
  addMaxLift: jest.fn(),
  deleteProgram: jest.fn(),
  exercises$: { get: jest.fn() },
}));

// eslint-disable-next-line @typescript-eslint/no-require-imports
const supabaseMock = require("../../utils/supabase");
const mockAddExercise: jest.Mock = supabaseMock.addExercise;
const mockAddProgram: jest.Mock = supabaseMock.addProgram;
const mockAddProgramWeek: jest.Mock = supabaseMock.addProgramWeek;
const mockAddWorkoutDay: jest.Mock = supabaseMock.addWorkoutDay;
const mockAddWorkoutSet: jest.Mock = supabaseMock.addWorkoutSet;
const mockAddMaxLift: jest.Mock = supabaseMock.addMaxLift;
const mockDeleteProgram: jest.Mock = supabaseMock.deleteProgram;
const mockExercisesGet: jest.Mock = supabaseMock.exercises$.get;

import {
  seedDefaultExercises,
  generateProgram,
  createProgramFromMaxes,
} from "../program-generator";

// --- Helpers ---
let idCounter = 0;
function resetIdCounter() {
  idCounter = 0;
}
function nextId(prefix = "id") {
  return `${prefix}-${++idCounter}`;
}

beforeEach(() => {
  jest.clearAllMocks();
  resetIdCounter();
  mockAddExercise.mockImplementation(() => nextId("ex"));
  mockAddProgram.mockImplementation(() => nextId("prog"));
  mockAddProgramWeek.mockImplementation(() => nextId("week"));
  mockAddWorkoutDay.mockImplementation(() => nextId("day"));
  mockAddWorkoutSet.mockImplementation(() => undefined);
  mockAddMaxLift.mockImplementation(() => nextId("max"));
  mockDeleteProgram.mockImplementation(() => undefined);
  mockExercisesGet.mockReturnValue(null);
});

// ─── seedDefaultExercises ────────────────────────────────────────────

describe("seedDefaultExercises", () => {
  it("seeds all 16 default exercises when none exist", () => {
    mockExercisesGet.mockReturnValue(null);

    const idMap = seedDefaultExercises();

    expect(mockAddExercise).toHaveBeenCalledTimes(DEFAULT_EXERCISES.length);
    DEFAULT_EXERCISES.forEach((ex) => {
      expect(mockAddExercise).toHaveBeenCalledWith(ex.name, ex.category);
      expect(idMap[ex.name]).toBeDefined();
    });
    expect(Object.keys(idMap)).toHaveLength(DEFAULT_EXERCISES.length);
  });

  it("skips already-existing exercises and only adds missing ones", () => {
    mockExercisesGet.mockReturnValue({
      existing1: { id: "existing1", name: "Back Squat", deleted: false },
      existing2: { id: "existing2", name: "Bench Press", deleted: false },
    });

    const idMap = seedDefaultExercises();

    expect(mockAddExercise).toHaveBeenCalledTimes(DEFAULT_EXERCISES.length - 2);
    expect(mockAddExercise).not.toHaveBeenCalledWith("Back Squat", expect.anything());
    expect(mockAddExercise).not.toHaveBeenCalledWith("Bench Press", expect.anything());

    expect(idMap["Back Squat"]).toBe("existing1");
    expect(idMap["Bench Press"]).toBe("existing2");
  });

  it("ignores soft-deleted exercises and re-creates them", () => {
    mockExercisesGet.mockReturnValue({
      del1: { id: "del1", name: "Back Squat", deleted: true },
    });

    const idMap = seedDefaultExercises();

    expect(mockAddExercise).toHaveBeenCalledWith("Back Squat", "squat");
    expect(idMap["Back Squat"]).not.toBe("del1");
  });

  it("returns complete ID map for all exercises", () => {
    const idMap = seedDefaultExercises();

    for (const ex of DEFAULT_EXERCISES) {
      expect(typeof idMap[ex.name]).toBe("string");
      expect(idMap[ex.name].length).toBeGreaterThan(0);
    }
  });
});

// ─── generateProgram ─────────────────────────────────────────────────

describe("generateProgram", () => {
  function makeExerciseIds(): Record<string, string> {
    const map: Record<string, string> = {};
    DEFAULT_EXERCISES.forEach((ex, i) => {
      map[ex.name] = `eid-${i}`;
    });
    return map;
  }

  const exerciseIds = makeExerciseIds();
  const maxLifts = {
    "eid-0": 140, // Back Squat
    "eid-1": 100, // Bench Press
    "eid-2": 180, // Deadlift
    "eid-3": 60, // Strict Press
  };

  it("creates 4 weeks, each with 4 days", () => {
    generateProgram(maxLifts, exerciseIds);

    expect(mockAddProgramWeek).toHaveBeenCalledTimes(4);
    expect(mockAddWorkoutDay).toHaveBeenCalledTimes(16);
  });

  it("creates correct number of main lift sets per week", () => {
    generateProgram(maxLifts, exerciseIds);

    const totalMainSets = WEEKLY_MAIN_LIFT_SCHEME.reduce(
      (sum, week) => sum + week.length * 4,
      0,
    );
    const totalAccessorySets = ACCESSORY_SCHEME.length * 3 * 4 * 4;

    expect(mockAddWorkoutSet).toHaveBeenCalledTimes(
      totalMainSets + totalAccessorySets,
    );
  });

  it("creates 144 accessory sets (3 sets × 3 accessories × 4 days × 4 weeks)", () => {
    generateProgram(maxLifts, exerciseIds);

    const accessoryCalls = mockAddWorkoutSet.mock.calls.filter(
      (call: unknown[]) => call[4] === null,
    );
    expect(accessoryCalls).toHaveLength(144);
  });

  it("records max lifts for provided exercises", () => {
    generateProgram(maxLifts, exerciseIds);

    expect(mockAddMaxLift).toHaveBeenCalledTimes(4);
    expect(mockAddMaxLift).toHaveBeenCalledWith("eid-0", 140);
    expect(mockAddMaxLift).toHaveBeenCalledWith("eid-1", 100);
    expect(mockAddMaxLift).toHaveBeenCalledWith("eid-2", 180);
    expect(mockAddMaxLift).toHaveBeenCalledWith("eid-3", 60);
  });

  it("rolls back (calls deleteProgram) if any CRUD call throws", () => {
    mockAddWorkoutDay.mockImplementationOnce(() => {
      throw new Error("DB error");
    });

    expect(() => generateProgram(maxLifts, exerciseIds)).toThrow("DB error");
    expect(mockDeleteProgram).toHaveBeenCalledTimes(1);
  });

  it("returns the program ID", () => {
    const programId = generateProgram(maxLifts, exerciseIds);

    expect(typeof programId).toBe("string");
    expect(programId.length).toBeGreaterThan(0);
  });
});

// ─── createProgramFromMaxes ──────────────────────────────────────────

describe("createProgramFromMaxes", () => {
  it("maps category names to exercise IDs correctly", () => {
    const maxes: Record<MainLiftCategory, number> = {
      squat: 140,
      bench: 100,
      deadlift: 180,
      press: 60,
    };

    createProgramFromMaxes(maxes);

    expect(mockAddMaxLift).toHaveBeenCalledTimes(4);

    const maxLiftCalls = mockAddMaxLift.mock.calls;
    const recordedWeights = (maxLiftCalls.map((c: unknown[]) => c[1]) as number[]).sort((a, b) => a - b);
    expect(recordedWeights).toEqual([60, 100, 140, 180]);
  });

  it("passes through programType parameter", () => {
    const maxes: Record<MainLiftCategory, number> = {
      squat: 100,
      bench: 80,
      deadlift: 150,
      press: 50,
    };

    createProgramFromMaxes(maxes, "olympic_weightlifting");

    expect(mockAddProgram).toHaveBeenCalledWith(
      "Olympic Weightlifting Program",
      undefined,
      4,
      "olympic_weightlifting",
    );
  });
});
