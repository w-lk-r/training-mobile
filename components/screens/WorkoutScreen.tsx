import { useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { observer } from "@legendapp/state/react";
import { useLocalSearchParams, router } from "expo-router";
import {
  useWorkoutDayExercises,
  type ExerciseGroup,
} from "../../hooks/use-program";
import { useMaxLifts } from "../../hooks/use-exercises";
import { useWorkoutSession } from "../../hooks/use-workout-session";

const WorkoutScreen = observer(() => {
  const { dayId, dayName } = useLocalSearchParams<{
    dayId: string;
    dayName: string;
  }>();

  if (!dayId) {
    return (
      <SafeAreaView style={styles.container} edges={["bottom"]}>
        <View style={styles.empty}>
          <Text style={styles.emptyText}>
            Select a workout from the Program tab.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return <ActiveWorkout dayId={dayId} dayName={dayName ?? "Workout"} />;
});

const ActiveWorkout = observer(
  ({ dayId, dayName }: { dayId: string; dayName: string }) => {
    const exerciseGroups = useWorkoutDayExercises(dayId);
    const maxLifts = useMaxLifts();
    const { sessionId, startSession, logSet, endSession } =
      useWorkoutSession(dayId);
    const [completedSets, setCompletedSets] = useState<Set<string>>(new Set());
    const [setInputs, setSetInputs] = useState<
      Record<string, { weight: string; reps: string }>
    >({});

    const handleStartSession = () => {
      startSession();
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

    const handleFinish = () => {
      endSession();
      router.back();
    };

    const getWeight = (exerciseId: string, percentage: number | null) => {
      if (!percentage) return 0;
      const max = maxLifts[exerciseId];
      if (!max) return 0;
      return Math.round(max * percentage * 2) / 2; // round to nearest 0.5
    };

    return (
      <SafeAreaView style={styles.container} edges={["bottom"]}>
        <ScrollView contentContainerStyle={styles.scroll}>
          <Text style={styles.heading}>{dayName}</Text>

          {!sessionId ? (
            <TouchableOpacity
              style={styles.startButton}
              onPress={handleStartSession}
            >
              <Text style={styles.startButtonText}>Start Workout</Text>
            </TouchableOpacity>
          ) : (
            <>
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
  onSetInputChange: (setId: string, field: "weight" | "reps", value: string) => void;
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
              placeholder={prescribedWeight ? `${prescribedWeight}` : "—"}
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
                  <Text style={styles.checkText}>&#x2713;</Text>
                </TouchableOpacity>
              ) : (
                <Text style={styles.doneCheck}>&#x2705;</Text>
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
    backgroundColor: "#fff",
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
    color: "#999",
  },
  heading: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 24,
  },
  startButton: {
    backgroundColor: "#333",
    borderRadius: 8,
    padding: 20,
    alignItems: "center",
  },
  startButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
  },
  exerciseCard: {
    backgroundColor: "#f8f8f8",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  exerciseName: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 4,
  },
  maxText: {
    fontSize: 13,
    color: "#666",
    marginBottom: 12,
  },
  setHeader: {
    flexDirection: "row",
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
    marginBottom: 4,
  },
  setHeaderText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#999",
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
    backgroundColor: "#fff",
    borderRadius: 6,
    paddingVertical: 8,
    marginHorizontal: 4,
  },
  checkButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#333",
    justifyContent: "center",
    alignItems: "center",
  },
  checkText: {
    color: "#fff",
    fontSize: 16,
  },
  doneCheck: {
    fontSize: 20,
  },
  finishButton: {
    backgroundColor: "#2a7",
    borderRadius: 8,
    padding: 20,
    alignItems: "center",
    marginTop: 8,
  },
  finishButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
  },
});
