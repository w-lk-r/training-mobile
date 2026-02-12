import { useState } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { observer } from "@legendapp/state/react";
import { useLocalSearchParams } from "expo-router";
import {
  useWorkoutDayExercises,
  useMultiDayExercises,
  type ExerciseGroup,
} from "../../hooks/use-program";
import { useExercises, useMaxLifts } from "../../hooks/use-exercises";
import { useWorkoutSession } from "../../hooks/use-workout-session";
import { addSessionWorkoutDay } from "../../utils/supabase";
import { Colors } from "../../constants/colors";

interface WorkoutScreenProps {
  dayIds?: string[];
  adHocExerciseIds?: string[];
}

const WorkoutScreen = observer((props: WorkoutScreenProps) => {
  const params = useLocalSearchParams<{
    dayId?: string;
    dayName?: string;
    dayIds?: string;
    templateId?: string;
  }>();

  // Support both props (from tab) and search params (from router push)
  const workoutDayIds = props.dayIds
    ? props.dayIds.filter((id) => id !== "adhoc")
    : params.dayIds
      ? params.dayIds.split(",").filter(Boolean)
      : params.dayId
        ? [params.dayId]
        : [];

  const adHocExerciseIds = props.adHocExerciseIds ?? [];

  if (workoutDayIds.length === 0 && adHocExerciseIds.length === 0 && !params.templateId) {
    return (
      <SafeAreaView style={styles.container} edges={["bottom"]}>
        <View style={styles.empty}>
          <Text style={styles.emptyText}>
            Select a workout from the Program tab or use Start Workout to
            compose one.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <ActiveWorkout
      dayIds={workoutDayIds}
      dayName={params.dayName ?? "Workout"}
      adHocExerciseIds={adHocExerciseIds}
    />
  );
});

const ActiveWorkout = observer(
  ({
    dayIds,
    dayName,
    adHocExerciseIds,
  }: {
    dayIds: string[];
    dayName: string;
    adHocExerciseIds: string[];
  }) => {
    const exerciseGroups =
      dayIds.length === 1
        ? useWorkoutDayExercises(dayIds[0])
        : dayIds.length > 1
          ? useMultiDayExercises(dayIds)
          : [];
    const maxLifts = useMaxLifts();
    const { sessionId, startSession, logSet, endSession } = useWorkoutSession();
    const [completedSets, setCompletedSets] = useState<Set<string>>(new Set());
    const [setInputs, setSetInputs] = useState<
      Record<string, { weight: string; reps: string }>
    >({});
    // Ad-hoc exercise set tracking (user adds sets manually)
    const [adHocSets, setAdHocSets] = useState<
      Record<string, { weight: string; reps: string }[]>
    >({});
    const [completedAdHocSets, setCompletedAdHocSets] = useState<Set<string>>(
      new Set(),
    );

    // Get exercise details for ad-hoc exercises
    const allExercises = useExercises();
    const adHocExercises = adHocExerciseIds
      .map((id) => allExercises.find((e) => e.id === id))
      .filter(Boolean);

    const handleStartSession = () => {
      const id = startSession(
        dayIds.length > 0 ? dayIds : ["adhoc"],
        adHocExerciseIds,
      );
      // Link all workout days to this session (including single-day)
      dayIds.forEach((dayId, index) => {
        addSessionWorkoutDay(id, dayId, index);
      });
    };

    const handleCompleteSet = (
      setId: string,
      exerciseId: string,
      prescribedWeight: number,
      prescribedReps: number,
    ) => {
      const input = setInputs[setId];
      const weight = input?.weight
        ? parseFloat(input.weight)
        : prescribedWeight;
      const reps = input?.reps ? parseInt(input.reps, 10) : prescribedReps;

      logSet(exerciseId, weight, reps, setId);
      setCompletedSets((prev) => new Set([...prev, setId]));
    };

    const handleCompleteAdHocSet = (
      exerciseId: string,
      setIndex: number,
    ) => {
      const sets = adHocSets[exerciseId] ?? [];
      const set = sets[setIndex];
      if (!set) return;

      const weight = set.weight ? parseFloat(set.weight) : 0;
      const reps = set.reps ? parseInt(set.reps, 10) : 0;
      if (weight === 0 && reps === 0) return;

      logSet(exerciseId, weight, reps);
      setCompletedAdHocSets(
        (prev) => new Set([...prev, `${exerciseId}-${setIndex}`]),
      );
    };

    const addAdHocSet = (exerciseId: string) => {
      setAdHocSets((prev) => ({
        ...prev,
        [exerciseId]: [...(prev[exerciseId] ?? []), { weight: "", reps: "" }],
      }));
    };

    const updateAdHocSetInput = (
      exerciseId: string,
      setIndex: number,
      field: "weight" | "reps",
      value: string,
    ) => {
      setAdHocSets((prev) => {
        const sets = [...(prev[exerciseId] ?? [])];
        sets[setIndex] = { ...sets[setIndex], [field]: value };
        return { ...prev, [exerciseId]: sets };
      });
    };

    const handleFinish = () => {
      Alert.alert(
        "Finish Workout",
        "Are you sure you want to end this workout?",
        [
          { text: "Keep Going", style: "cancel" },
          {
            text: "Finish",
            onPress: () => {
              const totalSets = completedSets.size +
                Object.values(adHocSets).reduce(
                  (sum, sets) => sum + sets.filter((_, i) => completedAdHocSets.has(`${Object.keys(adHocSets).find((k) => adHocSets[k] === sets)}-${i}`)).length,
                  0,
                );
              endSession();
              Alert.alert(
                "Workout Complete!",
                `Great work! You completed ${completedSets.size} set${completedSets.size !== 1 ? "s" : ""}.`,
              );
            },
          },
        ],
      );
    };

    const getWeight = (exerciseId: string, percentage: number | null) => {
      if (percentage === null || percentage === undefined) return 0;
      const max = maxLifts[exerciseId];
      if (!max) return 0;
      return Math.round(max * percentage * 2) / 2;
    };

    const hasAdHoc = adHocExercises.length > 0;
    const title =
      dayIds.length > 1
        ? `Combined Workout (${dayIds.length} days)`
        : dayIds.length === 0 && hasAdHoc
          ? "Ad-Hoc Workout"
          : dayName;

    return (
      <SafeAreaView style={styles.container} edges={["bottom"]}>
        <ScrollView contentContainerStyle={styles.scroll}>
          <Text style={styles.heading}>{title}</Text>

          {!sessionId ? (
            <TouchableOpacity
              style={styles.startButton}
              onPress={handleStartSession}
            >
              <Text style={styles.startButtonText}>Start Workout</Text>
            </TouchableOpacity>
          ) : (
            <>
              {/* Program exercise groups */}
              {exerciseGroups.map((group) => (
                <ExerciseGroupCard
                  key={group.exerciseId}
                  group={group}
                  maxLifts={maxLifts}
                  completedSets={completedSets}
                  setInputs={setInputs}
                  onSetInputChange={(setId, field, value) =>
                    setSetInputs((prev) => ({
                      ...prev,
                      [setId]: { ...prev[setId], [field]: value },
                    }))
                  }
                  onCompleteSet={handleCompleteSet}
                  getWeight={getWeight}
                />
              ))}

              {/* Ad-hoc exercises */}
              {adHocExercises.map((ex) => {
                if (!ex) return null;
                const sets = adHocSets[ex.id] ?? [];
                return (
                  <View key={ex.id} style={styles.exerciseCard}>
                    <Text style={styles.exerciseName}>{ex.name}</Text>
                    <Text style={styles.adHocLabel}>Ad-hoc exercise</Text>
                    {maxLifts[ex.id] && (
                      <Text style={styles.maxText}>
                        1RM: {maxLifts[ex.id]}kg
                      </Text>
                    )}

                    <View style={styles.setHeader}>
                      <Text style={[styles.setHeaderText, styles.setCol]}>
                        Set
                      </Text>
                      <Text style={[styles.setHeaderText, styles.weightCol]}>
                        Weight
                      </Text>
                      <Text style={[styles.setHeaderText, styles.repsCol]}>
                        Reps
                      </Text>
                      <View style={styles.actionCol} />
                    </View>

                    {sets.map((set, idx) => {
                      const key = `${ex.id}-${idx}`;
                      const isDone = completedAdHocSets.has(key);
                      return (
                        <View
                          key={key}
                          style={[styles.setRow, isDone && styles.setRowDone]}
                        >
                          <Text style={[styles.setText, styles.setCol]}>
                            {idx + 1}
                          </Text>
                          <TextInput
                            style={[styles.setInput, styles.weightCol]}
                            value={set.weight}
                            onChangeText={(v) =>
                              updateAdHocSetInput(ex.id, idx, "weight", v)
                            }
                            placeholder={"0"}
                            keyboardType="decimal-pad"
                            editable={!isDone}
                          />
                          <TextInput
                            style={[styles.setInput, styles.repsCol]}
                            value={set.reps}
                            onChangeText={(v) =>
                              updateAdHocSetInput(ex.id, idx, "reps", v)
                            }
                            placeholder={"0"}
                            keyboardType="number-pad"
                            editable={!isDone}
                          />
                          <View style={styles.actionCol}>
                            {!isDone ? (
                              <TouchableOpacity
                                style={styles.checkButton}
                                onPress={() =>
                                  handleCompleteAdHocSet(ex.id, idx)
                                }
                              >
                                <Text style={styles.checkText}>
                                  {"\u2713"}
                                </Text>
                              </TouchableOpacity>
                            ) : (
                              <Text style={styles.doneCheck}>{"\u2705"}</Text>
                            )}
                          </View>
                        </View>
                      );
                    })}

                    <TouchableOpacity
                      style={styles.addSetButton}
                      onPress={() => addAdHocSet(ex.id)}
                    >
                      <Text style={styles.addSetText}>+ Add Set</Text>
                    </TouchableOpacity>
                  </View>
                );
              })}

              <TouchableOpacity
                style={styles.finishButton}
                onPress={handleFinish}
              >
                <Text style={styles.finishButtonText}>Finish Workout</Text>
              </TouchableOpacity>
            </>
          )}
        </ScrollView>
      </SafeAreaView>
    );
  },
);

function ExerciseGroupCard({
  group,
  maxLifts,
  completedSets,
  setInputs,
  onSetInputChange,
  onCompleteSet,
  getWeight,
}: {
  group: ExerciseGroup;
  maxLifts: Record<string, number>;
  completedSets: Set<string>;
  setInputs: Record<string, { weight: string; reps: string }>;
  onSetInputChange: (
    setId: string,
    field: "weight" | "reps",
    value: string,
  ) => void;
  onCompleteSet: (
    setId: string,
    exerciseId: string,
    weight: number,
    reps: number,
  ) => void;
  getWeight: (exerciseId: string, percentage: number | null) => number;
}) {
  return (
    <View style={styles.exerciseCard}>
      <Text style={styles.exerciseName}>{group.exerciseName}</Text>
      {maxLifts[group.exerciseId] && (
        <Text style={styles.maxText}>
          1RM: {maxLifts[group.exerciseId]}kg
        </Text>
      )}

      <View style={styles.setHeader}>
        <Text style={[styles.setHeaderText, styles.setCol]}>Set</Text>
        <Text style={[styles.setHeaderText, styles.weightCol]}>Weight</Text>
        <Text style={[styles.setHeaderText, styles.repsCol]}>Reps</Text>
        <View style={styles.actionCol} />
      </View>

      {group.sets.map((set, idx) => {
        const prescribedWeight = getWeight(
          group.exerciseId,
          set.percentage_of_max,
        );
        const isDone = completedSets.has(set.id);
        const input = setInputs[set.id];

        return (
          <View
            key={set.id}
            style={[styles.setRow, isDone && styles.setRowDone]}
          >
            <Text style={[styles.setText, styles.setCol]}>{idx + 1}</Text>
            <TextInput
              style={[styles.setInput, styles.weightCol]}
              value={input?.weight ?? ""}
              onChangeText={(v) => onSetInputChange(set.id, "weight", v)}
              placeholder={prescribedWeight ? `${prescribedWeight}` : "\u2014"}
              keyboardType="decimal-pad"
              editable={!isDone}
            />
            <TextInput
              style={[styles.setInput, styles.repsCol]}
              value={input?.reps ?? ""}
              onChangeText={(v) => onSetInputChange(set.id, "reps", v)}
              placeholder={`${set.reps}`}
              keyboardType="number-pad"
              editable={!isDone}
            />
            <View style={styles.actionCol}>
              {!isDone ? (
                <TouchableOpacity
                  style={styles.checkButton}
                  onPress={() =>
                    onCompleteSet(
                      set.id,
                      group.exerciseId,
                      prescribedWeight,
                      set.reps,
                    )
                  }
                >
                  <Text style={styles.checkText}>{"\u2713"}</Text>
                </TouchableOpacity>
              ) : (
                <Text style={styles.doneCheck}>{"\u2705"}</Text>
              )}
            </View>
          </View>
        );
      })}
    </View>
  );
}

export default WorkoutScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scroll: {
    padding: 24,
  },
  empty: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyText: {
    fontSize: 16,
    color: Colors.textMuted,
    textAlign: "center",
    paddingHorizontal: 24,
  },
  heading: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 24,
  },
  startButton: {
    backgroundColor: Colors.text,
    borderRadius: 8,
    padding: 20,
    alignItems: "center",
  },
  startButtonText: {
    color: Colors.background,
    fontSize: 18,
    fontWeight: "600",
  },
  exerciseCard: {
    backgroundColor: Colors.surfaceLight,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  exerciseName: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 4,
  },
  adHocLabel: {
    fontSize: 12,
    color: Colors.primary,
    marginBottom: 8,
  },
  maxText: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: 12,
  },
  setHeader: {
    flexDirection: "row",
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
    marginBottom: 4,
  },
  setHeaderText: {
    fontSize: 12,
    fontWeight: "600",
    color: Colors.textMuted,
    textTransform: "uppercase",
  },
  setCol: {
    width: 36,
    textAlign: "center",
  },
  weightCol: {
    flex: 1,
    textAlign: "center",
  },
  repsCol: {
    width: 60,
    textAlign: "center",
  },
  actionCol: {
    width: 44,
    alignItems: "center",
  },
  setRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 6,
  },
  setRowDone: {
    opacity: 0.5,
  },
  setText: {
    fontSize: 14,
    fontWeight: "500",
  },
  setInput: {
    fontSize: 16,
    textAlign: "center",
    backgroundColor: Colors.background,
    borderRadius: 6,
    paddingVertical: 8,
    marginHorizontal: 4,
  },
  checkButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.text,
    justifyContent: "center",
    alignItems: "center",
  },
  checkText: {
    color: Colors.background,
    fontSize: 16,
  },
  doneCheck: {
    fontSize: 20,
  },
  addSetButton: {
    marginTop: 8,
    padding: 10,
    alignItems: "center",
    backgroundColor: Colors.borderLight,
    borderRadius: 6,
  },
  addSetText: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.textSecondary,
  },
  finishButton: {
    backgroundColor: Colors.success,
    borderRadius: 8,
    padding: 20,
    alignItems: "center",
    marginTop: 8,
  },
  finishButtonText: {
    color: Colors.background,
    fontSize: 18,
    fontWeight: "600",
  },
});
