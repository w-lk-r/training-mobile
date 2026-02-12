/** A prescribed set within a workout day */
export interface SetScheme {
  reps: number;
  /** Percentage of 1RM, e.g. 0.70 = 70%. Null for accessory exercises. */
  percentage: number | null;
  /** Optional RPE target */
  rpe?: number;
}

/** An exercise with its prescribed sets for a workout day */
export interface ExerciseBlock {
  exerciseId: string;
  exerciseName: string;
  sets: SetScheme[];
}

/** A single training day template */
export interface DayTemplate {
  name: string;
  exercises: ExerciseBlock[];
}

/** A single week template */
export interface WeekTemplate {
  weekNumber: number;
  days: DayTemplate[];
}

/** Full program template used by the generator */
export interface ProgramTemplate {
  name: string;
  weeks: WeekTemplate[];
}

/** Map of exercise ID to current 1RM in kg */
export type MaxLiftMap = Record<string, number>;

/** The 4 main lift categories */
export type MainLiftCategory = "squat" | "bench" | "deadlift" | "press";

/** Default exercise definitions for seeding */
export interface DefaultExercise {
  name: string;
  category: MainLiftCategory | "accessory";
}

/** The default exercises for the 4-day program */
export const DEFAULT_EXERCISES: DefaultExercise[] = [
  // Main lifts
  { name: "Back Squat", category: "squat" },
  { name: "Bench Press", category: "bench" },
  { name: "Deadlift", category: "deadlift" },
  { name: "Strict Press", category: "press" },
  // Squat day accessories
  { name: "Leg Press", category: "accessory" },
  { name: "Walking Lunges", category: "accessory" },
  { name: "Leg Curl", category: "accessory" },
  // Bench day accessories
  { name: "Incline Dumbbell Press", category: "accessory" },
  { name: "Cable Fly", category: "accessory" },
  { name: "Tricep Pushdown", category: "accessory" },
  // Deadlift day accessories
  { name: "Barbell Row", category: "accessory" },
  { name: "Pull-Up", category: "accessory" },
  { name: "Face Pull", category: "accessory" },
  // Press day accessories
  { name: "Lateral Raise", category: "accessory" },
  { name: "Dumbbell Curl", category: "accessory" },
  { name: "Rear Delt Fly", category: "accessory" },
];

/**
 * Weekly progression scheme for the 4-week cycle.
 * Main lifts follow a linear periodization pattern.
 */
export const WEEKLY_MAIN_LIFT_SCHEME: SetScheme[][] = [
  // Week 1: Volume — 4x8 @ 70%
  [
    { reps: 8, percentage: 0.70 },
    { reps: 8, percentage: 0.70 },
    { reps: 8, percentage: 0.70 },
    { reps: 8, percentage: 0.70 },
  ],
  // Week 2: Moderate — 4x6 @ 75%
  [
    { reps: 6, percentage: 0.75 },
    { reps: 6, percentage: 0.75 },
    { reps: 6, percentage: 0.75 },
    { reps: 6, percentage: 0.75 },
  ],
  // Week 3: Strength — 5x4 @ 82.5%
  [
    { reps: 4, percentage: 0.825 },
    { reps: 4, percentage: 0.825 },
    { reps: 4, percentage: 0.825 },
    { reps: 4, percentage: 0.825 },
    { reps: 4, percentage: 0.825 },
  ],
  // Week 4: Peak — 3x2 @ 90%
  [
    { reps: 2, percentage: 0.90 },
    { reps: 2, percentage: 0.90 },
    { reps: 2, percentage: 0.90 },
  ],
];

/** Accessory sets stay consistent across weeks: 3x10 */
export const ACCESSORY_SCHEME: SetScheme[] = [
  { reps: 10, percentage: null },
  { reps: 10, percentage: null },
  { reps: 10, percentage: null },
];

// ============================================================
// Wizard Config Types (for flexible program builder)
// ============================================================

/** How an exercise progresses week-to-week */
export type ProgressionRule =
  | { type: "fixed" }
  | { type: "increment_percentage"; amount: number } // e.g. 0.025 = +2.5% per week
  | { type: "increment_reps"; amount: number } // e.g. 1 = +1 rep per week
  | { type: "increment_weight"; amount: number }; // e.g. 2.5 = +2.5kg per week

/** An exercise configured in the wizard */
export interface WizardExercise {
  exerciseId: string;
  exerciseName: string;
  sets: number;
  reps: number;
  /** Percentage of 1RM (e.g. 0.70 = 70%). Null when using absolute weight. */
  percentage: number | null;
  /** Starting absolute weight in kg. Null when using percentage. */
  weight: number | null;
  progression: ProgressionRule;
}

/** A unique training session configured in the wizard */
export interface WizardSession {
  name: string;
  exercises: WizardExercise[];
}

/** Full wizard configuration stored on the program */
export interface WizardConfig {
  programName: string;
  weeksCount: number;
  sessions: WizardSession[];
}
