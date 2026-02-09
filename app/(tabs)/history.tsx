import { StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { observer } from "@legendapp/state/react";
import { useWorkoutHistory } from "../../hooks/use-workout-session";
import { workoutDays$ } from "../../utils/supabase";

const HistoryScreen = observer(() => {
  const sessions = useWorkoutHistory();

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
        sessions.map((session) => {
          const dayData = session.workout_day_id
            ? workoutDays$[session.workout_day_id].get()
            : null;

          return (
            <View key={session.id} style={styles.card}>
              <Text style={styles.dayName}>
                {(dayData as any)?.name ?? "Workout"}
              </Text>
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
            </View>
          );
        })
      )}
    </SafeAreaView>
  );
});

export default HistoryScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    padding: 24,
  },
  heading: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 24,
  },
  empty: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyText: {
    fontSize: 16,
    color: "#999",
    textAlign: "center",
  },
  card: {
    backgroundColor: "#f8f8f8",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  dayName: {
    fontSize: 16,
    fontWeight: "600",
  },
  date: {
    fontSize: 13,
    color: "#666",
    marginTop: 4,
  },
  notes: {
    fontSize: 13,
    color: "#999",
    marginTop: 8,
    fontStyle: "italic",
  },
});
