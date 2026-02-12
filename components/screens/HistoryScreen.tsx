import { useState } from "react";
import {
  ActivityIndicator,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { observer } from "@legendapp/state/react";
import { useWorkoutHistory, useSessionLogs } from "../../hooks/use-workout-session";
import { useWorkoutDayNames } from "../../hooks/use-program";
import { useExercises } from "../../hooks/use-exercises";
import { Colors } from "../../constants/colors";

const HistoryScreen = observer(() => {
  const sessions = useWorkoutHistory();
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);

  // Collect all unique workout_day_ids so we can resolve names via a single selector
  const dayIds = sessions
    .map((s) => s.workout_day_id)
    .filter((id): id is string => id != null);
  const dayNames = useWorkoutDayNames(dayIds);

  const selectedSession = selectedSessionId
    ? sessions.find((s) => s.id === selectedSessionId)
    : null;

  return (
    <SafeAreaView style={styles.container} edges={["bottom"]}>
      <Text style={styles.heading}>Workout History</Text>

      {sessions.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>
            No workouts completed yet. Start training!
          </Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {sessions.map((session) => {
            const dayName = session.workout_day_id
              ? dayNames.get(session.workout_day_id) ?? "Workout"
              : "Workout";

            return (
              <TouchableOpacity
                key={session.id}
                style={styles.card}
                onPress={() => setSelectedSessionId(session.id)}
                activeOpacity={0.7}
              >
                <View style={styles.cardRow}>
                  <Text style={styles.dayName}>{dayName}</Text>
                  <Text style={styles.chevron}>{"\u203A"}</Text>
                </View>
                <Text style={styles.date}>
                  {new Date(session.completed_at!).toLocaleDateString(undefined, {
                    weekday: "short",
                    month: "short",
                    day: "numeric",
                  })}
                </Text>
                {session.notes ? (
                  <Text style={styles.notes}>{session.notes}</Text>
                ) : null}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}

      <Modal visible={selectedSessionId != null} animationType="slide">
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {selectedSession?.workout_day_id
                ? dayNames.get(selectedSession.workout_day_id) ?? "Workout"
                : "Workout"}
            </Text>
            <TouchableOpacity onPress={() => setSelectedSessionId(null)}>
              <Text style={styles.modalClose}>{"\u2715"}</Text>
            </TouchableOpacity>
          </View>
          {selectedSession && (
            <Text style={styles.modalDate}>
              {new Date(selectedSession.completed_at!).toLocaleDateString(undefined, {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </Text>
          )}
          {selectedSessionId && (
            <SessionDetail sessionId={selectedSessionId} />
          )}
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
});

const SessionDetail = observer(({ sessionId }: { sessionId: string }) => {
  const logs = useSessionLogs(sessionId);
  const exercises = useExercises();

  const exerciseMap = new Map(exercises.map((e) => [e.id, e.name]));

  if (logs.length === 0) {
    return (
      <View style={styles.detailEmpty}>
        <ActivityIndicator size="small" color={Colors.textMuted} />
        <Text style={styles.detailEmptyText}>Loading sets...</Text>
      </View>
    );
  }

  // Group logs by exercise
  const groups: { exerciseId: string; exerciseName: string; sets: typeof logs }[] = [];
  const groupMap = new Map<string, typeof logs>();
  const order: string[] = [];

  for (const log of logs) {
    if (!groupMap.has(log.exercise_id)) {
      groupMap.set(log.exercise_id, []);
      order.push(log.exercise_id);
    }
    groupMap.get(log.exercise_id)!.push(log);
  }

  for (const id of order) {
    groups.push({
      exerciseId: id,
      exerciseName: exerciseMap.get(id) ?? "Unknown",
      sets: groupMap.get(id)!,
    });
  }

  return (
    <ScrollView contentContainerStyle={styles.detailScroll}>
      {groups.map((group) => (
        <View key={group.exerciseId} style={styles.detailGroup}>
          <Text style={styles.detailExerciseName}>{group.exerciseName}</Text>
          <View style={styles.detailHeader}>
            <Text style={[styles.detailHeaderText, styles.detailSetCol]}>Set</Text>
            <Text style={[styles.detailHeaderText, styles.detailWeightCol]}>Weight</Text>
            <Text style={[styles.detailHeaderText, styles.detailRepsCol]}>Reps</Text>
            <Text style={[styles.detailHeaderText, styles.detailRpeCol]}>RPE</Text>
          </View>
          {group.sets.map((set, idx) => (
            <View key={set.id} style={styles.detailRow}>
              <Text style={[styles.detailText, styles.detailSetCol]}>{idx + 1}</Text>
              <Text style={[styles.detailText, styles.detailWeightCol]}>{set.weight_kg}kg</Text>
              <Text style={[styles.detailText, styles.detailRepsCol]}>{set.reps_completed}</Text>
              <Text style={[styles.detailText, styles.detailRpeCol]}>
                {set.rpe != null ? set.rpe : "\u2014"}
              </Text>
            </View>
          ))}
        </View>
      ))}
    </ScrollView>
  );
});

export default HistoryScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    padding: 24,
  },
  heading: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 24,
  },
  scrollContent: {
    paddingBottom: 24,
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
  },
  card: {
    backgroundColor: Colors.surfaceLight,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  cardRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  dayName: {
    fontSize: 16,
    fontWeight: "600",
  },
  chevron: {
    fontSize: 24,
    color: Colors.textMuted,
  },
  date: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  notes: {
    fontSize: 13,
    color: Colors.textMuted,
    marginTop: 8,
    fontStyle: "italic",
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
  modalDate: {
    fontSize: 14,
    color: Colors.textSecondary,
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  // Detail styles
  detailEmpty: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
  },
  detailEmptyText: {
    fontSize: 14,
    color: Colors.textMuted,
  },
  detailScroll: {
    padding: 20,
  },
  detailGroup: {
    backgroundColor: Colors.surfaceLight,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  detailExerciseName: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 12,
  },
  detailHeader: {
    flexDirection: "row",
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
    marginBottom: 4,
  },
  detailHeaderText: {
    fontSize: 12,
    fontWeight: "600",
    color: Colors.textMuted,
    textTransform: "uppercase",
  },
  detailSetCol: {
    width: 36,
    textAlign: "center",
  },
  detailWeightCol: {
    flex: 1,
    textAlign: "center",
  },
  detailRepsCol: {
    width: 50,
    textAlign: "center",
  },
  detailRpeCol: {
    width: 40,
    textAlign: "center",
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 6,
  },
  detailText: {
    fontSize: 14,
  },
});
