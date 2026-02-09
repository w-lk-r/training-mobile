import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { observer } from "@legendapp/state/react";
import { router } from "expo-router";
import { useActiveProgram, useWeekWorkouts } from "../../hooks/use-program";

const HomeScreen = observer(() => {
  const program = useActiveProgram();
  const weekWorkouts = useWeekWorkouts(
    program?.id,
    program?.current_week ?? 1,
  );

  if (!program) {
    return (
      <SafeAreaView style={styles.container} edges={["bottom"]}>
        <View style={styles.empty}>
          <Text style={styles.emptyTitle}>No Program Yet</Text>
          <Text style={styles.emptySubtitle}>
            Set up your max lifts to generate a 4-week training program.
          </Text>
          <TouchableOpacity
            style={styles.button}
            onPress={() => router.push("/onboarding")}
          >
            <Text style={styles.buttonText}>Get Started</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["bottom"]}>
      <View style={styles.header}>
        <Text style={styles.programName}>{program.name}</Text>
        <Text style={styles.weekLabel}>
          Week {program.current_week} of {program.weeks_count}
        </Text>
      </View>

      <View style={styles.weekProgress}>
        {[1, 2, 3, 4].map((w) => (
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
                (w === program.current_week || w < (program.current_week ?? 1)) &&
                  styles.weekDotTextActive,
              ]}
            >
              W{w}
            </Text>
          </View>
        ))}
      </View>

      <Text style={styles.sectionTitle}>This Week's Workouts</Text>

      {weekWorkouts.map((day) => (
        <TouchableOpacity
          key={day.id}
          style={styles.dayCard}
          onPress={() =>
            router.push({
              pathname: "/(tabs)/workout",
              params: { dayId: day.id, dayName: day.name },
            })
          }
        >
          <Text style={styles.dayName}>{day.name}</Text>
          <Text style={styles.dayNumber}>Day {day.day_number}</Text>
        </TouchableOpacity>
      ))}
    </SafeAreaView>
  );
});

export default HomeScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    padding: 24,
  },
  empty: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    marginBottom: 32,
    lineHeight: 20,
  },
  button: {
    backgroundColor: "#333",
    borderRadius: 8,
    paddingHorizontal: 32,
    paddingVertical: 16,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
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
});
