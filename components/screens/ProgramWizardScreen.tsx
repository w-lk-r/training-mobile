import { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { observer } from "@legendapp/state/react";
import { useExercises } from "../../hooks/use-exercises";
import { addExercise } from "../../utils/supabase";
import { generateProgramFromWizard } from "../../services/program-generator";
import type {
  ProgressionRule,
  WizardConfig,
  WizardExercise,
  WizardSession,
} from "../../types/program";
import { Colors } from "../../constants/colors";

type Step = "basics" | "sessions" | "exercises" | "review";

const PROGRESSION_OPTIONS: { label: string; type: ProgressionRule["type"] }[] = [
  { label: "No change", type: "fixed" },
  { label: "+ % each week", type: "increment_percentage" },
  { label: "+ reps each week", type: "increment_reps" },
  { label: "+ kg each week", type: "increment_weight" },
];

const ProgramWizardScreen = observer(() => {
  // Wizard state
  const [step, setStep] = useState<Step>("basics");
  const [programName, setProgramName] = useState("");
  const [weeksCount, setWeeksCount] = useState("4");
  const [sessionsCount, setSessionsCount] = useState("3");
  const [sessions, setSessions] = useState<WizardSession[]>([]);
  const [currentSessionIndex, setCurrentSessionIndex] = useState(0);

  // Exercise picker state
  const [showExercisePicker, setShowExercisePicker] = useState(false);
  const [showNewExerciseForm, setShowNewExerciseForm] = useState(false);
  const [exerciseSearch, setExerciseSearch] = useState("");
  const [newExerciseName, setNewExerciseName] = useState("");
  const [newExerciseCategory, setNewExerciseCategory] = useState("");

  // Exercise detail editing
  const [editingExerciseIndex, setEditingExerciseIndex] = useState<number | null>(null);

  const exercises = useExercises();

  const filteredExercises = exerciseSearch
    ? exercises.filter((e) =>
        e.name.toLowerCase().includes(exerciseSearch.toLowerCase()),
      )
    : exercises;

  // ============================================================
  // Navigation helpers
  // ============================================================

  const goToSessions = () => {
    const weeks = parseInt(weeksCount, 10);
    if (!programName.trim()) {
      Alert.alert("Required", "Please enter a program name.");
      return;
    }
    if (isNaN(weeks) || weeks < 1 || weeks > 52) {
      Alert.alert("Invalid", "Weeks must be between 1 and 52.");
      return;
    }
    setStep("sessions");
  };

  const goToExercises = () => {
    const count = parseInt(sessionsCount, 10);
    if (isNaN(count) || count < 1 || count > 7) {
      Alert.alert("Invalid", "Sessions must be between 1 and 7.");
      return;
    }
    // Initialize sessions array, preserving any already-configured ones
    const newSessions: WizardSession[] = [];
    for (let i = 0; i < count; i++) {
      if (sessions[i]) {
        newSessions.push(sessions[i]);
      } else {
        newSessions.push({ name: `Session ${i + 1}`, exercises: [] });
      }
    }
    setSessions(newSessions);
    setCurrentSessionIndex(0);
    setStep("exercises");
  };

  const goToReview = () => {
    // Validate that every session has at least one exercise
    for (const session of sessions) {
      if (session.exercises.length === 0) {
        Alert.alert(
          "Incomplete",
          `"${session.name}" has no exercises. Add at least one exercise per session.`,
        );
        return;
      }
    }
    setStep("review");
  };

  // ============================================================
  // Session name editing
  // ============================================================

  const updateSessionName = (index: number, name: string) => {
    setSessions((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], name };
      return next;
    });
  };

  // ============================================================
  // Exercise management for current session
  // ============================================================

  const currentSession = sessions[currentSessionIndex];

  const addExerciseToSession = (exerciseId: string, exerciseName: string) => {
    setSessions((prev) => {
      const next = [...prev];
      const session = { ...next[currentSessionIndex] };
      session.exercises = [
        ...session.exercises,
        {
          exerciseId,
          exerciseName,
          sets: 3,
          reps: 10,
          percentage: null,
          weight: null,
          progression: { type: "fixed" },
        },
      ];
      next[currentSessionIndex] = session;
      return next;
    });
    setShowExercisePicker(false);
    setExerciseSearch("");
  };

  const removeExerciseFromSession = (exIndex: number) => {
    setSessions((prev) => {
      const next = [...prev];
      const session = { ...next[currentSessionIndex] };
      session.exercises = session.exercises.filter((_, i) => i !== exIndex);
      next[currentSessionIndex] = session;
      return next;
    });
    if (editingExerciseIndex === exIndex) {
      setEditingExerciseIndex(null);
    }
  };

  const updateExercise = (
    exIndex: number,
    updates: Partial<WizardExercise>,
  ) => {
    setSessions((prev) => {
      const next = [...prev];
      const session = { ...next[currentSessionIndex] };
      session.exercises = session.exercises.map((ex, i) =>
        i === exIndex ? { ...ex, ...updates } : ex,
      );
      next[currentSessionIndex] = session;
      return next;
    });
  };

  const handleCreateExercise = () => {
    if (!newExerciseName.trim()) return;
    const id = addExercise(
      newExerciseName.trim(),
      newExerciseCategory.trim() || "accessory",
    );
    addExerciseToSession(id, newExerciseName.trim());
    setNewExerciseName("");
    setNewExerciseCategory("");
    setShowNewExerciseForm(false);
  };

  // ============================================================
  // Generate program
  // ============================================================

  const handleGenerate = () => {
    const config: WizardConfig = {
      programName: programName.trim(),
      weeksCount: parseInt(weeksCount, 10),
      sessions,
    };

    try {
      generateProgramFromWizard(config);
      router.replace("/(tabs)/home");
    } catch (error) {
      console.error("Failed to generate program:", error);
      Alert.alert("Error", "Failed to generate your program. Please try again.");
    }
  };

  // ============================================================
  // Step 1: Basics
  // ============================================================

  if (step === "basics") {
    return (
      <SafeAreaView style={styles.container} edges={["bottom"]}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.flex}
        >
          <ScrollView contentContainerStyle={styles.scroll}>
            <Text style={styles.stepLabel}>Step 1 of 4</Text>
            <Text style={styles.heading}>Program Basics</Text>
            <Text style={styles.subtitle}>
              Name your program and choose how many weeks it should run.
            </Text>

            <Text style={styles.label}>Program Name</Text>
            <TextInput
              style={styles.input}
              value={programName}
              onChangeText={setProgramName}
              placeholder="e.g. 12-Week Strength Block"
              placeholderTextColor={Colors.textMuted}
            />

            <Text style={styles.label}>Number of Weeks</Text>
            <View style={styles.stepperRow}>
              <TouchableOpacity
                style={styles.stepperButton}
                onPress={() =>
                  setWeeksCount((prev) =>
                    String(Math.max(1, parseInt(prev, 10) - 1 || 1)),
                  )
                }
              >
                <Text style={styles.stepperText}>-</Text>
              </TouchableOpacity>
              <TextInput
                style={styles.stepperInput}
                value={weeksCount}
                onChangeText={setWeeksCount}
                keyboardType="number-pad"
              />
              <TouchableOpacity
                style={styles.stepperButton}
                onPress={() =>
                  setWeeksCount((prev) =>
                    String(Math.min(52, (parseInt(prev, 10) || 0) + 1)),
                  )
                }
              >
                <Text style={styles.stepperText}>+</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.primaryButton} onPress={goToSessions}>
              <Text style={styles.primaryButtonText}>Next</Text>
            </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  // ============================================================
  // Step 2: Sessions
  // ============================================================

  if (step === "sessions") {
    const count = parseInt(sessionsCount, 10) || 0;
    // Build preview names from existing sessions or defaults
    const previewNames: string[] = [];
    for (let i = 0; i < count; i++) {
      previewNames.push(sessions[i]?.name ?? `Session ${i + 1}`);
    }

    return (
      <SafeAreaView style={styles.container} edges={["bottom"]}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.flex}
        >
          <ScrollView contentContainerStyle={styles.scroll}>
            <Text style={styles.stepLabel}>Step 2 of 4</Text>
            <Text style={styles.heading}>Training Sessions</Text>
            <Text style={styles.subtitle}>
              How many unique sessions per week? Each session repeats every week
              for {weeksCount} weeks, with progression applied automatically.
            </Text>

            <Text style={styles.label}>Unique Sessions per Week</Text>
            <View style={styles.stepperRow}>
              <TouchableOpacity
                style={styles.stepperButton}
                onPress={() =>
                  setSessionsCount((prev) =>
                    String(Math.max(1, parseInt(prev, 10) - 1 || 1)),
                  )
                }
              >
                <Text style={styles.stepperText}>-</Text>
              </TouchableOpacity>
              <TextInput
                style={styles.stepperInput}
                value={sessionsCount}
                onChangeText={setSessionsCount}
                keyboardType="number-pad"
              />
              <TouchableOpacity
                style={styles.stepperButton}
                onPress={() =>
                  setSessionsCount((prev) =>
                    String(Math.min(7, (parseInt(prev, 10) || 0) + 1)),
                  )
                }
              >
                <Text style={styles.stepperText}>+</Text>
              </TouchableOpacity>
            </View>

            {count >= 1 && count <= 7 && (
              <>
                <Text style={[styles.label, { marginTop: 24 }]}>
                  Name Each Session
                </Text>
                {previewNames.map((name, i) => (
                  <View key={i} style={styles.sessionNameRow}>
                    <Text style={styles.sessionIndex}>{i + 1}.</Text>
                    <TextInput
                      style={styles.sessionNameInput}
                      value={name}
                      onChangeText={(text) => {
                        // Temporarily update local preview; real sessions are set in goToExercises
                        setSessions((prev) => {
                          const next = [...prev];
                          if (next[i]) {
                            next[i] = { ...next[i], name: text };
                          } else {
                            // Fill gaps
                            while (next.length <= i) {
                              next.push({
                                name: `Session ${next.length + 1}`,
                                exercises: [],
                              });
                            }
                            next[i] = { ...next[i], name: text };
                          }
                          return next;
                        });
                      }}
                      placeholder={`Session ${i + 1}`}
                      placeholderTextColor={Colors.textMuted}
                    />
                  </View>
                ))}
              </>
            )}

            <View style={styles.navRow}>
              <TouchableOpacity
                style={styles.secondaryButton}
                onPress={() => setStep("basics")}
              >
                <Text style={styles.secondaryButtonText}>Back</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.primaryButton}
                onPress={goToExercises}
              >
                <Text style={styles.primaryButtonText}>Next</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  // ============================================================
  // Step 3: Exercises (per session)
  // ============================================================

  if (step === "exercises" && currentSession) {
    return (
      <SafeAreaView style={styles.container} edges={["bottom"]}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.flex}
        >
          <ScrollView contentContainerStyle={styles.scroll}>
            <Text style={styles.stepLabel}>Step 3 of 4</Text>
            <Text style={styles.heading}>{currentSession.name}</Text>
            <Text style={styles.subtitle}>
              Session {currentSessionIndex + 1} of {sessions.length} — Add
              exercises and configure sets, reps, and weekly progression.
            </Text>

            {/* Session tab selector */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.tabScroll}
            >
              {sessions.map((s, i) => (
                <TouchableOpacity
                  key={i}
                  style={[
                    styles.tab,
                    i === currentSessionIndex && styles.tabActive,
                  ]}
                  onPress={() => {
                    setCurrentSessionIndex(i);
                    setEditingExerciseIndex(null);
                  }}
                >
                  <Text
                    style={[
                      styles.tabText,
                      i === currentSessionIndex && styles.tabTextActive,
                    ]}
                    numberOfLines={1}
                  >
                    {s.name}
                  </Text>
                  {s.exercises.length > 0 && (
                    <Text style={styles.tabBadge}>{s.exercises.length}</Text>
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Exercise list */}
            {currentSession.exercises.map((ex, exIdx) => (
              <View key={exIdx} style={styles.exerciseCard}>
                <View style={styles.exerciseHeader}>
                  <Text style={styles.exerciseName}>{ex.exerciseName}</Text>
                  <View style={styles.exerciseActions}>
                    <TouchableOpacity
                      onPress={() =>
                        setEditingExerciseIndex(
                          editingExerciseIndex === exIdx ? null : exIdx,
                        )
                      }
                    >
                      <Text style={styles.editText}>
                        {editingExerciseIndex === exIdx ? "Done" : "Edit"}
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => removeExerciseFromSession(exIdx)}
                    >
                      <Text style={styles.removeText}>{"\u2715"}</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                <Text style={styles.exerciseSummary}>
                  {ex.sets}x{ex.reps}
                  {ex.percentage !== null
                    ? ` @ ${Math.round(ex.percentage * 100)}%`
                    : ex.weight !== null
                      ? ` @ ${ex.weight}kg`
                      : ""}
                  {ex.progression.type !== "fixed" && (
                    <>
                      {" "}
                      {ex.progression.type === "increment_percentage" &&
                        `(+${Math.round(ex.progression.amount * 100)}%/wk)`}
                      {ex.progression.type === "increment_reps" &&
                        `(+${ex.progression.amount} reps/wk)`}
                      {ex.progression.type === "increment_weight" &&
                        `(+${ex.progression.amount}kg/wk)`}
                    </>
                  )}
                </Text>

                {editingExerciseIndex === exIdx && (
                  <ExerciseEditor
                    exercise={ex}
                    weeksCount={parseInt(weeksCount, 10)}
                    onChange={(updates) => updateExercise(exIdx, updates)}
                  />
                )}
              </View>
            ))}

            {/* Add exercise buttons */}
            <View style={styles.addButtons}>
              <TouchableOpacity
                style={styles.addButton}
                onPress={() => setShowExercisePicker(true)}
              >
                <Text style={styles.addButtonText}>+ From Library</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.addButton}
                onPress={() => setShowNewExerciseForm(true)}
              >
                <Text style={styles.addButtonText}>+ Create New</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.navRow}>
              <TouchableOpacity
                style={styles.secondaryButton}
                onPress={() => {
                  if (currentSessionIndex > 0) {
                    setCurrentSessionIndex(currentSessionIndex - 1);
                    setEditingExerciseIndex(null);
                  } else {
                    setStep("sessions");
                  }
                }}
              >
                <Text style={styles.secondaryButtonText}>Back</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.primaryButton}
                onPress={() => {
                  if (currentSessionIndex < sessions.length - 1) {
                    setCurrentSessionIndex(currentSessionIndex + 1);
                    setEditingExerciseIndex(null);
                  } else {
                    goToReview();
                  }
                }}
              >
                <Text style={styles.primaryButtonText}>
                  {currentSessionIndex < sessions.length - 1
                    ? "Next Session"
                    : "Review"}
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>

        {/* Exercise Picker Modal */}
        <Modal visible={showExercisePicker} animationType="slide">
          <SafeAreaView style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Pick Exercise</Text>
              <TouchableOpacity
                onPress={() => {
                  setShowExercisePicker(false);
                  setExerciseSearch("");
                }}
              >
                <Text style={styles.modalClose}>{"\u2715"}</Text>
              </TouchableOpacity>
            </View>
            <TextInput
              style={styles.searchInput}
              placeholder="Search exercises..."
              placeholderTextColor={Colors.textMuted}
              value={exerciseSearch}
              onChangeText={setExerciseSearch}
              autoFocus
            />
            <ScrollView>
              {filteredExercises.map((ex) => (
                <TouchableOpacity
                  key={ex.id}
                  style={styles.exercisePickerRow}
                  onPress={() => addExerciseToSession(ex.id, ex.name)}
                >
                  <Text style={styles.exercisePickerName}>{ex.name}</Text>
                  <Text style={styles.exercisePickerCategory}>
                    {ex.category}
                  </Text>
                </TouchableOpacity>
              ))}
              {filteredExercises.length === 0 && (
                <Text style={styles.emptySearch}>No exercises found.</Text>
              )}
            </ScrollView>
          </SafeAreaView>
        </Modal>

        {/* New Exercise Form Modal */}
        <Modal visible={showNewExerciseForm} animationType="slide">
          <SafeAreaView style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>New Exercise</Text>
              <TouchableOpacity
                onPress={() => {
                  setShowNewExerciseForm(false);
                  setNewExerciseName("");
                  setNewExerciseCategory("");
                }}
              >
                <Text style={styles.modalClose}>{"\u2715"}</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.formContainer}>
              <Text style={styles.formLabel}>Exercise Name</Text>
              <TextInput
                style={styles.formInput}
                placeholder="e.g. Bulgarian Split Squat"
                placeholderTextColor={Colors.textMuted}
                value={newExerciseName}
                onChangeText={setNewExerciseName}
                autoFocus
              />
              <Text style={styles.formLabel}>Category</Text>
              <TextInput
                style={styles.formInput}
                placeholder="e.g. Legs (defaults to accessory)"
                placeholderTextColor={Colors.textMuted}
                value={newExerciseCategory}
                onChangeText={setNewExerciseCategory}
              />
              <TouchableOpacity
                style={[
                  styles.primaryButton,
                  { marginTop: 24 },
                  !newExerciseName.trim() && styles.buttonDisabled,
                ]}
                onPress={handleCreateExercise}
                disabled={!newExerciseName.trim()}
              >
                <Text style={styles.primaryButtonText}>Create & Add</Text>
              </TouchableOpacity>
            </View>
          </SafeAreaView>
        </Modal>
      </SafeAreaView>
    );
  }

  // ============================================================
  // Step 4: Review
  // ============================================================

  const weeks = parseInt(weeksCount, 10);

  return (
    <SafeAreaView style={styles.container} edges={["bottom"]}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.stepLabel}>Step 4 of 4</Text>
        <Text style={styles.heading}>Review Program</Text>
        <Text style={styles.subtitle}>
          {programName} — {weeks} weeks, {sessions.length} session
          {sessions.length !== 1 ? "s" : ""} per week
        </Text>

        {sessions.map((session, sIdx) => (
          <View key={sIdx} style={styles.reviewSessionCard}>
            <Text style={styles.reviewSessionName}>{session.name}</Text>
            {session.exercises.map((ex, exIdx) => (
              <View key={exIdx} style={styles.reviewExerciseRow}>
                <Text style={styles.reviewExerciseName}>
                  {ex.exerciseName}
                </Text>
                <Text style={styles.reviewExerciseDetail}>
                  {ex.sets}x{ex.reps}
                  {ex.percentage !== null
                    ? ` @ ${Math.round(ex.percentage * 100)}%`
                    : ex.weight !== null
                      ? ` @ ${ex.weight}kg`
                      : ""}
                </Text>
                {ex.progression.type !== "fixed" && (
                  <Text style={styles.reviewProgression}>
                    {ex.progression.type === "increment_percentage" &&
                      `+${Math.round(ex.progression.amount * 100)}% per week`}
                    {ex.progression.type === "increment_reps" &&
                      `+${ex.progression.amount} rep${ex.progression.amount !== 1 ? "s" : ""} per week`}
                    {ex.progression.type === "increment_weight" &&
                      `+${ex.progression.amount}kg per week`}
                  </Text>
                )}
              </View>
            ))}
          </View>
        ))}

        {/* Week-by-week preview for first session */}
        {sessions.length > 0 && (
          <View style={styles.previewSection}>
            <Text style={styles.previewTitle}>
              Week-by-Week Preview: {sessions[0].name}
            </Text>
            {Array.from({ length: Math.min(weeks, 4) }, (_, weekIdx) => (
              <View key={weekIdx} style={styles.previewWeek}>
                <Text style={styles.previewWeekLabel}>
                  Week {weekIdx + 1}
                </Text>
                {sessions[0].exercises.map((ex, exIdx) => {
                  const reps =
                    ex.progression.type === "increment_reps"
                      ? ex.reps + ex.progression.amount * weekIdx
                      : ex.reps;
                  const pct =
                    ex.percentage !== null
                      ? ex.progression.type === "increment_percentage"
                        ? ex.percentage + ex.progression.amount * weekIdx
                        : ex.percentage
                      : null;
                  return (
                    <Text key={exIdx} style={styles.previewExercise}>
                      {ex.exerciseName}: {ex.sets}x{Math.round(reps)}
                      {pct !== null ? ` @ ${Math.round(pct * 100)}%` : ""}
                    </Text>
                  );
                })}
              </View>
            ))}
            {weeks > 4 && (
              <Text style={styles.previewMore}>
                ...and {weeks - 4} more week{weeks - 4 !== 1 ? "s" : ""}
              </Text>
            )}
          </View>
        )}

        <View style={styles.navRow}>
          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => {
              setCurrentSessionIndex(sessions.length - 1);
              setStep("exercises");
            }}
          >
            <Text style={styles.secondaryButtonText}>Back</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={handleGenerate}
          >
            <Text style={styles.primaryButtonText}>Create Program</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
});

// ============================================================
// Exercise Editor (inline detail form)
// ============================================================

function ExerciseEditor({
  exercise,
  weeksCount,
  onChange,
}: {
  exercise: WizardExercise;
  weeksCount: number;
  onChange: (updates: Partial<WizardExercise>) => void;
}) {
  const [intensityMode, setIntensityMode] = useState<"percentage" | "weight" | "none">(
    exercise.percentage !== null
      ? "percentage"
      : exercise.weight !== null
        ? "weight"
        : "none",
  );

  const [progressionType, setProgressionType] = useState<ProgressionRule["type"]>(
    exercise.progression.type,
  );

  const setProgressionAmount = (amount: number) => {
    if (progressionType === "increment_percentage") {
      onChange({ progression: { type: "increment_percentage", amount } });
    } else if (progressionType === "increment_reps") {
      onChange({ progression: { type: "increment_reps", amount } });
    } else if (progressionType === "increment_weight") {
      onChange({ progression: { type: "increment_weight", amount } });
    }
  };

  const currentAmount =
    exercise.progression.type !== "fixed" ? exercise.progression.amount : 0;

  return (
    <View style={styles.editorContainer}>
      {/* Sets & Reps */}
      <View style={styles.editorRow}>
        <View style={styles.editorField}>
          <Text style={styles.editorLabel}>Sets</Text>
          <View style={styles.miniStepper}>
            <TouchableOpacity
              style={styles.miniStepperBtn}
              onPress={() => onChange({ sets: Math.max(1, exercise.sets - 1) })}
            >
              <Text style={styles.miniStepperText}>-</Text>
            </TouchableOpacity>
            <Text style={styles.miniStepperValue}>{exercise.sets}</Text>
            <TouchableOpacity
              style={styles.miniStepperBtn}
              onPress={() => onChange({ sets: exercise.sets + 1 })}
            >
              <Text style={styles.miniStepperText}>+</Text>
            </TouchableOpacity>
          </View>
        </View>
        <View style={styles.editorField}>
          <Text style={styles.editorLabel}>Reps</Text>
          <View style={styles.miniStepper}>
            <TouchableOpacity
              style={styles.miniStepperBtn}
              onPress={() => onChange({ reps: Math.max(1, exercise.reps - 1) })}
            >
              <Text style={styles.miniStepperText}>-</Text>
            </TouchableOpacity>
            <Text style={styles.miniStepperValue}>{exercise.reps}</Text>
            <TouchableOpacity
              style={styles.miniStepperBtn}
              onPress={() => onChange({ reps: exercise.reps + 1 })}
            >
              <Text style={styles.miniStepperText}>+</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Intensity mode */}
      <Text style={styles.editorLabel}>Intensity</Text>
      <View style={styles.segmentRow}>
        {(["none", "percentage", "weight"] as const).map((mode) => (
          <TouchableOpacity
            key={mode}
            style={[
              styles.segment,
              intensityMode === mode && styles.segmentActive,
            ]}
            onPress={() => {
              setIntensityMode(mode);
              if (mode === "percentage") {
                onChange({ percentage: 0.7, weight: null });
              } else if (mode === "weight") {
                onChange({ percentage: null, weight: 20 });
              } else {
                onChange({ percentage: null, weight: null });
              }
            }}
          >
            <Text
              style={[
                styles.segmentText,
                intensityMode === mode && styles.segmentTextActive,
              ]}
            >
              {mode === "none" ? "None" : mode === "percentage" ? "% of 1RM" : "Weight (kg)"}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {intensityMode === "percentage" && (
        <View style={styles.editorInputRow}>
          <Text style={styles.editorLabel}>Starting %</Text>
          <TextInput
            style={styles.editorInput}
            value={
              exercise.percentage !== null
                ? String(Math.round(exercise.percentage * 100))
                : ""
            }
            onChangeText={(text) => {
              const val = parseFloat(text);
              if (!isNaN(val)) {
                onChange({ percentage: val / 100 });
              }
            }}
            keyboardType="decimal-pad"
            placeholder="70"
            placeholderTextColor={Colors.textMuted}
          />
          <Text style={styles.editorUnit}>%</Text>
        </View>
      )}

      {intensityMode === "weight" && (
        <View style={styles.editorInputRow}>
          <Text style={styles.editorLabel}>Starting Weight</Text>
          <TextInput
            style={styles.editorInput}
            value={exercise.weight !== null ? String(exercise.weight) : ""}
            onChangeText={(text) => {
              const val = parseFloat(text);
              if (!isNaN(val)) {
                onChange({ weight: val });
              }
            }}
            keyboardType="decimal-pad"
            placeholder="20"
            placeholderTextColor={Colors.textMuted}
          />
          <Text style={styles.editorUnit}>kg</Text>
        </View>
      )}

      {/* Progression */}
      <Text style={[styles.editorLabel, { marginTop: 12 }]}>
        Weekly Progression
      </Text>
      <View style={styles.progressionOptions}>
        {PROGRESSION_OPTIONS.map((opt) => {
          // Only show percentage progression if intensity mode is percentage
          if (opt.type === "increment_percentage" && intensityMode !== "percentage")
            return null;
          // Only show weight progression if intensity mode is weight
          if (opt.type === "increment_weight" && intensityMode !== "weight")
            return null;
          return (
            <TouchableOpacity
              key={opt.type}
              style={[
                styles.progressionChip,
                progressionType === opt.type && styles.progressionChipActive,
              ]}
              onPress={() => {
                setProgressionType(opt.type);
                if (opt.type === "fixed") {
                  onChange({ progression: { type: "fixed" } });
                } else if (opt.type === "increment_percentage") {
                  onChange({
                    progression: { type: "increment_percentage", amount: 0.025 },
                  });
                } else if (opt.type === "increment_reps") {
                  onChange({
                    progression: { type: "increment_reps", amount: 1 },
                  });
                } else if (opt.type === "increment_weight") {
                  onChange({
                    progression: { type: "increment_weight", amount: 2.5 },
                  });
                }
              }}
            >
              <Text
                style={[
                  styles.progressionChipText,
                  progressionType === opt.type &&
                    styles.progressionChipTextActive,
                ]}
              >
                {opt.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {progressionType !== "fixed" && (
        <View style={styles.editorInputRow}>
          <Text style={styles.editorLabel}>Amount per week</Text>
          <TextInput
            style={styles.editorInput}
            value={String(
              progressionType === "increment_percentage"
                ? Math.round(currentAmount * 100)
                : currentAmount,
            )}
            onChangeText={(text) => {
              const val = parseFloat(text);
              if (!isNaN(val)) {
                setProgressionAmount(
                  progressionType === "increment_percentage"
                    ? val / 100
                    : val,
                );
              }
            }}
            keyboardType="decimal-pad"
          />
          <Text style={styles.editorUnit}>
            {progressionType === "increment_percentage"
              ? "%"
              : progressionType === "increment_reps"
                ? "reps"
                : "kg"}
          </Text>
        </View>
      )}

      {/* Preview */}
      {progressionType !== "fixed" && weeksCount > 1 && (
        <View style={styles.previewBox}>
          <Text style={styles.previewBoxTitle}>Progression Preview</Text>
          {Array.from(
            { length: Math.min(weeksCount, 6) },
            (_, weekIdx) => {
              const reps =
                progressionType === "increment_reps"
                  ? exercise.reps + (exercise.progression.type === "increment_reps" ? exercise.progression.amount : 1) * weekIdx
                  : exercise.reps;
              const pct =
                exercise.percentage !== null &&
                progressionType === "increment_percentage"
                  ? exercise.percentage +
                    (exercise.progression.type === "increment_percentage" ? exercise.progression.amount : 0.025) * weekIdx
                  : exercise.percentage;
              const wt =
                exercise.weight !== null &&
                progressionType === "increment_weight"
                  ? exercise.weight +
                    (exercise.progression.type === "increment_weight" ? exercise.progression.amount : 2.5) * weekIdx
                  : exercise.weight;
              return (
                <Text key={weekIdx} style={styles.previewBoxLine}>
                  Wk {weekIdx + 1}: {exercise.sets}x{Math.round(reps)}
                  {pct !== null ? ` @ ${Math.round(pct * 100)}%` : ""}
                  {wt !== null ? ` @ ${wt}kg` : ""}
                </Text>
              );
            },
          )}
          {weeksCount > 6 && (
            <Text style={styles.previewBoxMore}>
              ...{weeksCount - 6} more
            </Text>
          )}
        </View>
      )}
    </View>
  );
}

export default ProgramWizardScreen;

// ============================================================
// Styles
// ============================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  flex: {
    flex: 1,
  },
  scroll: {
    padding: 24,
    paddingBottom: 80,
  },
  stepLabel: {
    fontSize: 13,
    color: Colors.primary,
    fontWeight: "600",
    marginBottom: 4,
  },
  heading: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 24,
    lineHeight: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 8,
    marginTop: 8,
  },
  input: {
    borderColor: Colors.border,
    borderWidth: 1,
    borderRadius: 8,
    padding: 14,
    fontSize: 16,
    marginBottom: 12,
  },
  // Stepper
  stepperRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  stepperButton: {
    width: 44,
    height: 44,
    borderRadius: 8,
    backgroundColor: Colors.surface,
    justifyContent: "center",
    alignItems: "center",
  },
  stepperText: {
    fontSize: 22,
    fontWeight: "600",
    color: Colors.text,
  },
  stepperInput: {
    flex: 1,
    textAlign: "center",
    fontSize: 24,
    fontWeight: "bold",
    marginHorizontal: 12,
  },
  // Session name row
  sessionNameRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  sessionIndex: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.textSecondary,
    width: 28,
  },
  sessionNameInput: {
    flex: 1,
    borderColor: Colors.border,
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  // Navigation
  navRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 24,
  },
  primaryButton: {
    flex: 1,
    backgroundColor: Colors.text,
    borderRadius: 8,
    padding: 16,
    alignItems: "center",
  },
  primaryButtonText: {
    color: Colors.background,
    fontSize: 16,
    fontWeight: "600",
  },
  secondaryButton: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: 8,
    padding: 16,
    alignItems: "center",
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.text,
  },
  buttonDisabled: {
    opacity: 0.4,
  },
  // Tabs for session switching
  tabScroll: {
    marginBottom: 16,
    marginHorizontal: -24,
    paddingHorizontal: 24,
  },
  tab: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.surface,
    marginRight: 8,
  },
  tabActive: {
    backgroundColor: Colors.text,
  },
  tabText: {
    fontSize: 14,
    fontWeight: "500",
    color: Colors.textSecondary,
  },
  tabTextActive: {
    color: Colors.background,
  },
  tabBadge: {
    fontSize: 11,
    fontWeight: "bold",
    color: Colors.primary,
    marginLeft: 6,
    backgroundColor: Colors.highlight,
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 1,
    overflow: "hidden",
  },
  // Exercise cards
  exerciseCard: {
    backgroundColor: Colors.surfaceLight,
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
  },
  exerciseHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  exerciseName: {
    fontSize: 16,
    fontWeight: "600",
    flex: 1,
  },
  exerciseActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  editText: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: "500",
  },
  removeText: {
    fontSize: 16,
    color: Colors.danger,
  },
  exerciseSummary: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  // Add exercise buttons
  addButtons: {
    flexDirection: "row",
    gap: 10,
    marginTop: 8,
  },
  addButton: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: 8,
    padding: 14,
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.border,
    borderStyle: "dashed",
  },
  addButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.textSecondary,
  },
  // Editor
  editorContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  editorRow: {
    flexDirection: "row",
    gap: 16,
    marginBottom: 12,
  },
  editorField: {
    flex: 1,
  },
  editorLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: Colors.textSecondary,
    marginBottom: 6,
  },
  editorInputRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 8,
  },
  editorInput: {
    flex: 1,
    borderColor: Colors.border,
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    fontSize: 16,
    textAlign: "center",
  },
  editorUnit: {
    fontSize: 14,
    color: Colors.textSecondary,
    width: 36,
  },
  // Mini stepper
  miniStepper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.background,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  miniStepperBtn: {
    width: 36,
    height: 36,
    justifyContent: "center",
    alignItems: "center",
  },
  miniStepperText: {
    fontSize: 18,
    fontWeight: "600",
    color: Colors.text,
  },
  miniStepperValue: {
    flex: 1,
    textAlign: "center",
    fontSize: 16,
    fontWeight: "bold",
  },
  // Segment control
  segmentRow: {
    flexDirection: "row",
    backgroundColor: Colors.surface,
    borderRadius: 8,
    overflow: "hidden",
    marginBottom: 8,
  },
  segment: {
    flex: 1,
    padding: 10,
    alignItems: "center",
  },
  segmentActive: {
    backgroundColor: Colors.text,
  },
  segmentText: {
    fontSize: 12,
    fontWeight: "600",
    color: Colors.textSecondary,
  },
  segmentTextActive: {
    color: Colors.background,
  },
  // Progression chips
  progressionOptions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 8,
  },
  progressionChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: Colors.surface,
  },
  progressionChipActive: {
    backgroundColor: Colors.text,
  },
  progressionChipText: {
    fontSize: 13,
    fontWeight: "500",
    color: Colors.textSecondary,
  },
  progressionChipTextActive: {
    color: Colors.background,
  },
  // Preview box
  previewBox: {
    backgroundColor: Colors.highlight,
    borderRadius: 8,
    padding: 12,
    marginTop: 12,
  },
  previewBoxTitle: {
    fontSize: 12,
    fontWeight: "600",
    color: Colors.textSecondary,
    marginBottom: 6,
  },
  previewBoxLine: {
    fontSize: 13,
    color: Colors.text,
    lineHeight: 20,
  },
  previewBoxMore: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 4,
  },
  // Review
  reviewSessionCard: {
    backgroundColor: Colors.surfaceLight,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  reviewSessionName: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 10,
  },
  reviewExerciseRow: {
    marginBottom: 8,
  },
  reviewExerciseName: {
    fontSize: 15,
    fontWeight: "500",
  },
  reviewExerciseDetail: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  reviewProgression: {
    fontSize: 12,
    color: Colors.primary,
    marginTop: 2,
  },
  // Review preview
  previewSection: {
    marginTop: 16,
    marginBottom: 8,
  },
  previewTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 10,
  },
  previewWeek: {
    backgroundColor: Colors.surfaceLight,
    borderRadius: 8,
    padding: 12,
    marginBottom: 6,
  },
  previewWeekLabel: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 4,
  },
  previewExercise: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  previewMore: {
    fontSize: 13,
    color: Colors.textMuted,
    textAlign: "center",
    marginTop: 4,
  },
  // Modal
  modalContainer: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
  },
  modalClose: {
    fontSize: 20,
    color: Colors.textSecondary,
    padding: 4,
  },
  searchInput: {
    margin: 16,
    padding: 12,
    backgroundColor: Colors.surfaceLight,
    borderRadius: 8,
    fontSize: 16,
  },
  exercisePickerRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.surface,
  },
  exercisePickerName: {
    flex: 1,
    fontSize: 16,
    fontWeight: "500",
  },
  exercisePickerCategory: {
    fontSize: 13,
    color: Colors.textMuted,
  },
  emptySearch: {
    textAlign: "center",
    color: Colors.textMuted,
    padding: 24,
    fontSize: 14,
  },
  formContainer: {
    padding: 20,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.textSecondary,
    marginBottom: 6,
    marginTop: 16,
  },
  formInput: {
    padding: 12,
    backgroundColor: Colors.surfaceLight,
    borderRadius: 8,
    fontSize: 16,
  },
});
