import {
  WEEKLY_MAIN_LIFT_SCHEME,
  ACCESSORY_SCHEME,
  DEFAULT_EXERCISES,
  type MainLiftCategory,
  type MaxLiftMap,
} from "../types/program";
import {
  addExercise,
  addMaxLift,
  addProgram,
  addProgramWeek,
  addWorkoutDay,
  addWorkoutSet,
  deleteProgram,
  exercises$,
} from "../utils/supabase";

/** Exercise IDs keyed by name, populated after seeding */
type ExerciseIdMap = Record<string, string>;

/**
 * Seeds the default exercises into the exercises$ observable.
 * Returns a map of exercise name -> id.
 * Skips exercises that already exist (by name).
 */
export function seedDefaultExercises(): ExerciseIdMap {
  const existing = exercises$.get();
  const existingByName: Record<string, string> = {};

  if (existing) {
    Object.values(existing).forEach((ex: any) => {
      if (ex && !ex.deleted) {
        existingByName[ex.name] = ex.id;
      }
    });
  }

  const idMap: ExerciseIdMap = {};

  for (const def of DEFAULT_EXERCISES) {
    if (existingByName[def.name]) {
      idMap[def.name] = existingByName[def.name];
    } else {
      const id = addExercise(def.name, def.category);
      idMap[def.name] = id;
    }
  }

  return idMap;
}

/** Day structure: which main lift + which accessories */
interface DayConfig {
  name: string;
  mainLift: string;
  accessories: string[];
}

const DAY_CONFIGS: DayConfig[] = [
  {
    name: "Squat Day",
    mainLift: "Back Squat",
    accessories: ["Leg Press", "Walking Lunges", "Leg Curl"],
  },
  {
    name: "Bench Day",
    mainLift: "Bench Press",
    accessories: ["Incline Dumbbell Press", "Cable Fly", "Tricep Pushdown"],
  },
  {
    name: "Deadlift Day",
    mainLift: "Deadlift",
    accessories: ["Barbell Row", "Pull-Up", "Face Pull"],
  },
  {
    name: "Press Day",
    mainLift: "Strict Press",
    accessories: ["Lateral Raise", "Dumbbell Curl", "Rear Delt Fly"],
  },
];

/**
 * Generates a full 4-week, 4-day program.
 *
 * @param maxLifts - Map of exercise ID to 1RM in kg for the 4 main lifts
 * @param exerciseIds - Map of exercise name to ID (from seedDefaultExercises)
 * @returns The program ID
 */
export function generateProgram(
  maxLifts: MaxLiftMap,
  exerciseIds: ExerciseIdMap,
): string {
  const programId = addProgram("4-Week Strength Program");

  try {
    for (let week = 1; week <= 4; week++) {
      const weekId = addProgramWeek(programId, week);
      const mainLiftScheme = WEEKLY_MAIN_LIFT_SCHEME[week - 1];

      DAY_CONFIGS.forEach((day, dayIdx) => {
        const dayId = addWorkoutDay(weekId, dayIdx + 1, day.name);
        const mainExerciseId = exerciseIds[day.mainLift];

        // Main lift sets for this week
        mainLiftScheme.forEach((set, setIdx) => {
          addWorkoutSet(
            dayId,
            mainExerciseId,
            setIdx + 1,
            set.reps,
            set.percentage,
            set.rpe ?? null,
          );
        });

        // Accessory sets (consistent across weeks)
        let setCounter = mainLiftScheme.length + 1;
        day.accessories.forEach((accName) => {
          const accId = exerciseIds[accName];
          ACCESSORY_SCHEME.forEach((set) => {
            addWorkoutSet(
              dayId,
              accId,
              setCounter,
              set.reps,
              null, // accessories use absolute weight, not percentage
              null,
            );
            setCounter++;
          });
        });
      });
    }

    // Record max lifts
    for (const [exerciseId, weight] of Object.entries(maxLifts)) {
      addMaxLift(exerciseId, weight);
    }
  } catch (error) {
    // Roll back the partially created program to avoid inconsistent state
    try {
      deleteProgram(programId);
    } catch (cleanupError) {
      console.error("Failed to clean up partial program:", cleanupError);
    }
    throw error;
  }

  return programId;
}

/**
 * Convenience function: seed exercises, then generate program.
 * Called from the onboarding screen.
 *
 * @param maxes - Map of main lift category to 1RM in kg
 *                e.g. { squat: 140, bench: 100, deadlift: 180, press: 60 }
 */
export function createProgramFromMaxes(
  maxes: Record<MainLiftCategory, number>,
): string {
  const exerciseIds = seedDefaultExercises();

  // Map category maxes to exercise IDs
  const categoryToName: Record<MainLiftCategory, string> = {
    squat: "Back Squat",
    bench: "Bench Press",
    deadlift: "Deadlift",
    press: "Strict Press",
  };

  const maxLifts: MaxLiftMap = {};
  for (const [category, weight] of Object.entries(maxes)) {
    const name = categoryToName[category as MainLiftCategory];
    const exerciseId = exerciseIds[name];
    maxLifts[exerciseId] = weight;
  }

  return generateProgram(maxLifts, exerciseIds);
}
