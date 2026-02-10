import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { observer } from "@legendapp/state/react";
import { router, useLocalSearchParams } from "expo-router";
import { useSelector } from "@legendapp/state/react";
import { useWeekWorkouts } from "../../hooks/use-program";
import { deleteProgram, programs$ } from "../../utils/supabase";
import type { Tables } from "../../utils/database.types";

const ProgramDetailScreen = observer(() => {
  const { programId } = useLocalSearchParams<{ programId: string }>();

  const program = useSelector((): Tables<"programs"> | null => {
    if (!programId) return null;
    const p = programs$[programId].get() as any;
    if (!p || p.deleted) return null;
    return p as Tables<"programs">;
  });

  const weekWorkouts = useWeekWorkouts(
    program?.id,
    program?.current_week ?? 1,
  );

  if (!program) {
    return (
      <SafeAreaView style={styles.container} edges={["bottom"]}>
        <View style={styles.empty}>
          <Text style={styles.emptyText}>Program not found.</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["bottom"]}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <Text style={styles.programName}>{program.name}</Text>
          <Text style={styles.weekLabel}>
            Week {program.current_week} of {program.weeks_count}
          </Text>
        </View>

        <View style={styles.weekProgress}>
          {Array.from({ length: program.weeks_count ?? 4 }, (_, i) => i + 1).map(
            (w) => (
              <View
                key={w}
                style={[
                  styles.weekDot,
                  w === program.current_week && styles.weekDotActive,
                  w < (program.current_week ?? 1) && styles.weekDotDone,
                ]}
              >
                <Text
                  style={[
                    styles.weekDotText,
                    (w === program.current_week ||
                      w < (program.current_week ?? 1)) &&
                      styles.weekDotTextActive,
                  ]}
                >
                  W{w}
                </Text>
              </View>
            ),
          )}
        </View>

        <Text style={styles.sectionTitle}>This Week's Workouts</Text>

        {weekWorkouts.map((day) => (
          <TouchableOpacity
            key={day.id}
            style={styles.dayCard}
            onPress={() =>
              router.push({
                pathname: "/active-workout",
                params: { dayId: day.id, dayName: day.name },
              })
            }
          >
            <Text style={styles.dayName}>{day.name}</Text>
            <Text style={styles.dayNumber}>Day {day.day_number}</Text>
          </TouchableOpacity>
        ))}

        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() =>
            Alert.alert(
              "Delete Program",
              "Are you sure you want to delete this program? This cannot be undone.",
              [
                { text: "Cancel", style: "cancel" },
                {
                  text: "Delete",
                  style: "destructive",
                  onPress: () => {
                    deleteProgram(program.id);
                    router.back();
                  },
                },
              ],
            )
          }
        >
          <Text style={styles.deleteButtonText}>Delete Program</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
});

export default ProgramDetailScreen;

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
  header: {
    marginBottom: 16,
  },
  programName: {
    fontSize: 24,
    fontWeight: "bold",
  },
  weekLabel: {
    fontSize: 14,
    color: "#666",
    marginTop: 4,
  },
  weekProgress: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 32,
  },
  weekDot: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: "#f0f0f0",
    alignItems: "center",
  },
  weekDotActive: {
    backgroundColor: "#333",
  },
  weekDotDone: {
    backgroundColor: "#dfd",
  },
  weekDotText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#999",
  },
  weekDotTextActive: {
    color: "#fff",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 16,
  },
  dayCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#f8f8f8",
    borderRadius: 12,
    padding: 20,
    marginBottom: 12,
  },
  dayName: {
    fontSize: 16,
    fontWeight: "600",
  },
  dayNumber: {
    fontSize: 13,
    color: "#999",
  },
  deleteButton: {
    alignSelf: "center",
    marginTop: 24,
    marginBottom: 16,
  },
  deleteButtonText: {
    color: "#c33",
    fontSize: 14,
  },
});
