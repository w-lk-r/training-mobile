import { useState } from "react";
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { observer } from "@legendapp/state/react";
import {
  useAllCurrentWorkoutDays,
  useWorkoutTemplates,
} from "../../hooks/use-program";
import { useExercises } from "../../hooks/use-exercises";
import { useWorkoutSession } from "../../hooks/use-workout-session";
import { addExercise, addSessionWorkoutDay, templateItems$ } from "../../utils/supabase";
import type { Tables } from "../../utils/database.types";
import { Colors } from "../../constants/colors";

type WorkoutDayWithProgram = Tables<"workout_days"> & {
  programName: string;
  programId: string;
  weekNumber: number;
};

const WorkoutComposerScreen = observer(() => {
  const allDays = useAllCurrentWorkoutDays();
  const templates = useWorkoutTemplates();
  const exercises = useExercises();
  const { startSession } = useWorkoutSession();
  const [selectedDayIds, setSelectedDayIds] = useState<string[]>([]);
  const [adHocExerciseIds, setAdHocExerciseIds] = useState<string[]>([]);
  const [mode, setMode] = useState<"pick" | "reorder">("pick");
  const [showExercisePicker, setShowExercisePicker] = useState(false);
  const [showNewExerciseForm, setShowNewExerciseForm] = useState(false);
  const [newExerciseName, setNewExerciseName] = useState("");
  const [newExerciseCategory, setNewExerciseCategory] = useState("");
  const [exerciseSearch, setExerciseSearch] = useState("");

  const toggleDay = (dayId: string) => {
    setSelectedDayIds((prev) =>
      prev.includes(dayId)
        ? prev.filter((id) => id !== dayId)
        : [...prev, dayId],
    );
  };

  const moveUp = (index: number) => {
    if (index === 0) return;
    setSelectedDayIds((prev) => {
      const next = [...prev];
      [next[index - 1], next[index]] = [next[index], next[index - 1]];
      return next;
    });
  };

  const moveDown = (index: number) => {
    setSelectedDayIds((prev) => {
      if (index >= prev.length - 1) return prev;
      const next = [...prev];
      [next[index], next[index + 1]] = [next[index + 1], next[index]];
      return next;
    });
  };

  // Use Maps for O(1) lookups instead of .find() per item
  const allDaysMap = new Map(allDays.map((d) => [d.id, d]));
  const exerciseMap = new Map(exercises.map((e) => [e.id, e]));

  const selectedDays = selectedDayIds
    .map((id) => allDaysMap.get(id))
    .filter(Boolean) as WorkoutDayWithProgram[];

  const selectedAdHocExercises = adHocExerciseIds
    .map((id) => exerciseMap.get(id))
    .filter(Boolean) as Tables<"exercises">[];

  const handleStart = () => {
    const sessionId = startSession(
      selectedDayIds.length > 0 ? selectedDayIds : ["adhoc"],
      adHocExerciseIds,
    );
    // Link all workout days to this session (including single-day)
    selectedDayIds.forEach((dayId, index) => {
      addSessionWorkoutDay(sessionId, dayId, index);
    });
  };

  const handleStartFromTemplate = (templateId: string) => {
    // Read template items directly from the observable
    const allItems = templateItems$.get();
    if (!allItems) return;

    const items = Object.values(allItems).filter(
      (i) => i && !i.deleted && i.template_id === templateId,
    );
    if (items.length === 0) return;

    // Collect workout day IDs and ad-hoc exercise IDs from template items
    const dayIdSet = new Set<string>();
    const exerciseIdSet = new Set<string>();

    for (const item of items) {
      if (item.workout_day_id) {
        dayIdSet.add(item.workout_day_id);
      } else {
        exerciseIdSet.add(item.exercise_id);
      }
    }

    const dayIds = Array.from(dayIdSet);
    const exIds = Array.from(exerciseIdSet);

    const sessionId = startSession(
      dayIds.length > 0 ? dayIds : ["adhoc"],
      exIds,
    );
    dayIds.forEach((dayId, index) => {
      addSessionWorkoutDay(sessionId, dayId, index);
    });
  };

  const handlePickExercise = (exerciseId: string) => {
    if (!adHocExerciseIds.includes(exerciseId)) {
      setAdHocExerciseIds((prev) => [...prev, exerciseId]);
    }
    setShowExercisePicker(false);
    setExerciseSearch("");
  };

  const handleCreateExercise = () => {
    if (!newExerciseName.trim()) return;
    const id = addExercise(
      newExerciseName.trim(),
      newExerciseCategory.trim() || "General",
    );
    setAdHocExerciseIds((prev) => [...prev, id]);
    setNewExerciseName("");
    setNewExerciseCategory("");
    setShowNewExerciseForm(false);
  };

  const removeAdHocExercise = (exerciseId: string) => {
    setAdHocExerciseIds((prev) => prev.filter((id) => id !== exerciseId));
  };

  const filteredExercises = exerciseSearch
    ? exercises.filter((e) =>
        e.name.toLowerCase().includes(exerciseSearch.toLowerCase()),
      )
    : exercises;

  const hasSelection = selectedDayIds.length > 0 || adHocExerciseIds.length > 0;

  // Group days by program for the picker
  const daysByProgram: Record<
    string,
    { programName: string; days: WorkoutDayWithProgram[] }
  > = {};
  for (const day of allDays) {
    if (!daysByProgram[day.programId]) {
      daysByProgram[day.programId] = { programName: day.programName, days: [] };
    }
    daysByProgram[day.programId].days.push(day);
  }

  if (mode === "reorder" && selectedDays.length > 0) {
    return (
      <SafeAreaView style={styles.container} edges={["bottom"]}>
        <ScrollView contentContainerStyle={styles.scroll}>
          <Text style={styles.heading}>Arrange Workout</Text>
          <Text style={styles.subtitle}>
            Reorder the workout days. Exercises will appear in this order.
          </Text>

          {selectedDays.map((day, index) => (
            <View key={day.id} style={styles.reorderCard}>
              <View style={styles.reorderInfo}>
                <Text style={styles.reorderName}>{day.name}</Text>
                <Text style={styles.reorderProgram}>{day.programName}</Text>
              </View>
              <View style={styles.reorderButtons}>
                <TouchableOpacity
                  style={[
                    styles.arrowButton,
                    index === 0 && styles.arrowDisabled,
                  ]}
                  onPress={() => moveUp(index)}
                  disabled={index === 0}
                >
                  <Text style={styles.arrowText}>{"\u2191"}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.arrowButton,
                    index === selectedDays.length - 1 && styles.arrowDisabled,
                  ]}
                  onPress={() => moveDown(index)}
                  disabled={index === selectedDays.length - 1}
                >
                  <Text style={styles.arrowText}>{"\u2193"}</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}

          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => setMode("pick")}
            >
              <Text style={styles.backButtonText}>Back</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.startButton} onPress={handleStart}>
              <Text style={styles.startButtonText}>Start Workout</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["bottom"]}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.heading}>Start Workout</Text>
        <Text style={styles.subtitle}>
          Select workout days from your programs, or add individual exercises
          for a custom session.
        </Text>

        {templates.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Saved Templates</Text>
            {templates.map((t) => (
              <TouchableOpacity
                key={t.id}
                style={styles.templateCard}
                onPress={() => handleStartFromTemplate(t.id)}
              >
                <Text style={styles.templateName}>{t.name}</Text>
                <Text style={styles.chevron}>{"\u203A"}</Text>
              </TouchableOpacity>
            ))}
          </>
        )}

        <Text style={styles.sectionTitle}>Pick Workout Days</Text>

        {Object.entries(daysByProgram).map(
          ([progId, { programName, days }]) => (
            <View key={progId} style={styles.programGroup}>
              <Text style={styles.programLabel}>
                {programName} (Week {days[0]?.weekNumber})
              </Text>
              {days.map((day) => {
                const isSelected = selectedDayIds.includes(day.id);
                return (
                  <TouchableOpacity
                    key={day.id}
                    style={[
                      styles.dayRow,
                      isSelected && styles.dayRowSelected,
                    ]}
                    onPress={() => toggleDay(day.id)}
                  >
                    <View
                      style={[
                        styles.checkbox,
                        isSelected && styles.checkboxChecked,
                      ]}
                    >
                      {isSelected && (
                        <Text style={styles.checkmark}>{"\u2713"}</Text>
                      )}
                    </View>
                    <Text style={styles.dayRowName}>{day.name}</Text>
                    <Text style={styles.dayRowNumber}>
                      Day {day.day_number}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          ),
        )}

        {Object.keys(daysByProgram).length === 0 && adHocExerciseIds.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>
              No programs yet. Create a program or add exercises below.
            </Text>
          </View>
        )}

        {/* Ad-Hoc Exercises Section */}
        <Text style={styles.sectionTitle}>Ad-Hoc Exercises</Text>
        <Text style={styles.sectionSubtitle}>
          Pick individual exercises outside of a program day.
        </Text>

        {selectedAdHocExercises.map((ex) => (
          <View key={ex.id} style={styles.adHocRow}>
            <View style={styles.adHocInfo}>
              <Text style={styles.adHocName}>{ex.name}</Text>
              <Text style={styles.adHocCategory}>{ex.category}</Text>
            </View>
            <TouchableOpacity onPress={() => removeAdHocExercise(ex.id)}>
              <Text style={styles.removeText}>{"\u2715"}</Text>
            </TouchableOpacity>
          </View>
        ))}

        <View style={styles.adHocButtons}>
          <TouchableOpacity
            style={styles.adHocButton}
            onPress={() => setShowExercisePicker(true)}
          >
            <Text style={styles.adHocButtonText}>Add from Library</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.adHocButton}
            onPress={() => setShowNewExerciseForm(true)}
          >
            <Text style={styles.adHocButtonText}>Create New Exercise</Text>
          </TouchableOpacity>
        </View>

        {hasSelection && (
          <View style={styles.bottomActions}>
            <Text style={styles.selectedCount}>
              {selectedDayIds.length > 0 &&
                `${selectedDayIds.length} day${selectedDayIds.length > 1 ? "s" : ""}`}
              {selectedDayIds.length > 0 && adHocExerciseIds.length > 0 && " + "}
              {adHocExerciseIds.length > 0 &&
                `${adHocExerciseIds.length} exercise${adHocExerciseIds.length > 1 ? "s" : ""}`}
              {" selected"}
            </Text>
            <View style={styles.buttonRow}>
              {selectedDayIds.length > 1 && (
                <TouchableOpacity
                  style={styles.reorderButton}
                  onPress={() => setMode("reorder")}
                >
                  <Text style={styles.reorderButtonText}>Reorder</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={styles.startButton}
                onPress={handleStart}
              >
                <Text style={styles.startButtonText}>Start Workout</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>

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
            value={exerciseSearch}
            onChangeText={setExerciseSearch}
            autoFocus
          />
          <ScrollView>
            {filteredExercises.map((ex) => {
              const alreadyAdded = adHocExerciseIds.includes(ex.id);
              return (
                <TouchableOpacity
                  key={ex.id}
                  style={[
                    styles.exercisePickerRow,
                    alreadyAdded && styles.exercisePickerRowDisabled,
                  ]}
                  onPress={() => handlePickExercise(ex.id)}
                  disabled={alreadyAdded}
                >
                  <Text style={styles.exercisePickerName}>{ex.name}</Text>
                  <Text style={styles.exercisePickerCategory}>
                    {ex.category}
                  </Text>
                  {alreadyAdded && (
                    <Text style={styles.exercisePickerAdded}>{"\u2713"}</Text>
                  )}
                </TouchableOpacity>
              );
            })}
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
              placeholder="e.g. Barbell Row"
              value={newExerciseName}
              onChangeText={setNewExerciseName}
              autoFocus
            />
            <Text style={styles.formLabel}>Category</Text>
            <TextInput
              style={styles.formInput}
              placeholder="e.g. Back (defaults to General)"
              value={newExerciseCategory}
              onChangeText={setNewExerciseCategory}
            />
            <TouchableOpacity
              style={[
                styles.startButton,
                !newExerciseName.trim() && styles.buttonDisabled,
              ]}
              onPress={handleCreateExercise}
              disabled={!newExerciseName.trim()}
            >
              <Text style={styles.startButtonText}>
                Create & Add to Workout
              </Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
});

export default WorkoutComposerScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scroll: {
    padding: 24,
    paddingBottom: 120,
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
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 8,
    marginTop: 8,
  },
  sectionSubtitle: {
    fontSize: 13,
    color: Colors.textMuted,
    marginBottom: 12,
  },
  templateCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.highlight,
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
  },
  templateName: {
    flex: 1,
    fontSize: 16,
    fontWeight: "500",
  },
  chevron: {
    fontSize: 24,
    color: Colors.textMuted,
  },
  programGroup: {
    marginBottom: 20,
  },
  programLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.textSecondary,
    marginBottom: 8,
  },
  dayRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surfaceLight,
    borderRadius: 10,
    padding: 16,
    marginBottom: 6,
  },
  dayRowSelected: {
    backgroundColor: Colors.successLight,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: Colors.border,
    marginRight: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  checkboxChecked: {
    backgroundColor: Colors.text,
    borderColor: Colors.text,
  },
  checkmark: {
    color: Colors.background,
    fontSize: 14,
    fontWeight: "bold",
  },
  dayRowName: {
    flex: 1,
    fontSize: 16,
    fontWeight: "500",
  },
  dayRowNumber: {
    fontSize: 13,
    color: Colors.textMuted,
  },
  emptyState: {
    alignItems: "center",
    paddingTop: 20,
    paddingBottom: 10,
  },
  emptyText: {
    fontSize: 14,
    color: Colors.textMuted,
    textAlign: "center",
  },
  // Ad-hoc exercise styles
  adHocRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.highlight,
    borderRadius: 10,
    padding: 14,
    marginBottom: 6,
  },
  adHocInfo: {
    flex: 1,
  },
  adHocName: {
    fontSize: 16,
    fontWeight: "500",
  },
  adHocCategory: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 2,
  },
  removeText: {
    fontSize: 18,
    color: Colors.danger,
    paddingHorizontal: 8,
  },
  adHocButtons: {
    flexDirection: "row",
    gap: 10,
    marginTop: 8,
  },
  adHocButton: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: 8,
    padding: 14,
    alignItems: "center",
  },
  adHocButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.text,
  },
  bottomActions: {
    marginTop: 24,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
    paddingTop: 16,
  },
  selectedCount: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 12,
  },
  buttonRow: {
    flexDirection: "row",
    gap: 12,
  },
  reorderButton: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: 8,
    padding: 16,
    alignItems: "center",
  },
  reorderButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.text,
  },
  startButton: {
    flex: 1,
    backgroundColor: Colors.text,
    borderRadius: 8,
    padding: 16,
    alignItems: "center",
  },
  startButtonText: {
    color: Colors.background,
    fontSize: 16,
    fontWeight: "600",
  },
  buttonDisabled: {
    opacity: 0.4,
  },
  // Reorder mode styles
  reorderCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surfaceLight,
    borderRadius: 10,
    padding: 16,
    marginBottom: 8,
  },
  reorderInfo: {
    flex: 1,
  },
  reorderName: {
    fontSize: 16,
    fontWeight: "600",
  },
  reorderProgram: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 2,
  },
  reorderButtons: {
    flexDirection: "row",
    gap: 8,
  },
  arrowButton: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: Colors.borderLight,
    justifyContent: "center",
    alignItems: "center",
  },
  arrowDisabled: {
    opacity: 0.3,
  },
  arrowText: {
    fontSize: 18,
    fontWeight: "600",
  },
  backButton: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: 8,
    padding: 16,
    alignItems: "center",
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.text,
  },
  // Modal styles
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
  exercisePickerRowDisabled: {
    opacity: 0.4,
  },
  exercisePickerName: {
    flex: 1,
    fontSize: 16,
    fontWeight: "500",
  },
  exercisePickerCategory: {
    fontSize: 13,
    color: Colors.textMuted,
    marginRight: 8,
  },
  exercisePickerAdded: {
    fontSize: 16,
    color: Colors.success,
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
