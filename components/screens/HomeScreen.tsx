import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { observer } from "@legendapp/state/react";
import { router } from "expo-router";
import {
  useActiveProgram,
  useAutoAdvanceWeek,
  useCompletedWeeks,
  useWeekCompletion,
  useWeekWorkouts,
} from "../../hooks/use-program";
import { setCurrentWeek } from "../../utils/supabase";
import { useAuth } from "../../contexts/auth-context";
import { Colors } from "../../constants/colors";

const HomeScreen = observer(() => {
  const { isLoading } = useAuth();
  const program = useActiveProgram();
  const currentWeek = program?.current_week ?? 1;
  const weeksCount = program?.weeks_count ?? 4;
  const weekWorkouts = useWeekWorkouts(program?.id, currentWeek);
  const completion = useWeekCompletion(program?.id, currentWeek);
  const completedWeeks = useCompletedWeeks(program?.id, weeksCount);

  useAutoAdvanceWeek(program);

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container} edges={["bottom"]}>
        <View style={styles.empty}>
          <ActivityIndicator size="large" color={Colors.textMuted} />
        </View>
      </SafeAreaView>
    );
  }

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
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.programName}>{program.name}</Text>
          <Text style={styles.weekLabel}>
            Week {currentWeek} of {weeksCount}
          </Text>
        </View>

        <View style={styles.weekProgress}>
          {Array.from({ length: weeksCount }, (_, i) => i + 1).map((w) => {
            const weekDone = completedWeeks.has(w);
            return (
              <TouchableOpacity
                key={w}
                style={[
                  styles.weekDot,
                  w === currentWeek && styles.weekDotActive,
                ]}
                onPress={() => setCurrentWeek(program.id, w)}
              >
                <Text
                  style={[
                    styles.weekDotText,
                    w === currentWeek && styles.weekDotTextActive,
                  ]}
                >
                  {weekDone ? "✓ " : ""}W{w}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <Text style={styles.sectionTitle}>This Week's Workouts</Text>

        {weekWorkouts.map((day) => {
          const isCompleted = completion.completedDayIds.has(day.id);
          return (
            <TouchableOpacity
              key={day.id}
              style={[styles.dayCard, isCompleted && styles.dayCardCompleted]}
              onPress={() =>
                router.push({
                  pathname: "/(tabs)/workout",
                  params: { dayId: day.id, dayName: day.name },
                })
              }
            >
              {isCompleted && <Text style={styles.checkmark}>✓</Text>}
              <Text style={styles.dayName}>{day.name}</Text>
            </TouchableOpacity>
          );
        })}

      </ScrollView>
    </SafeAreaView>
  );
});

export default HomeScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    padding: 24,
    paddingBottom: 48,
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
    color: Colors.textSecondary,
    textAlign: "center",
    marginBottom: 32,
    lineHeight: 20,
  },
  button: {
    backgroundColor: Colors.text,
    borderRadius: 8,
    paddingHorizontal: 32,
    paddingVertical: 16,
  },
  buttonText: {
    color: Colors.background,
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
    color: Colors.textSecondary,
    marginTop: 4,
  },
  weekProgress: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 16,
  },
  weekDot: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: Colors.surface,
    alignItems: "center",
  },
  weekDotActive: {
    backgroundColor: Colors.text,
  },
  weekDotText: {
    fontSize: 13,
    fontWeight: "600",
    color: Colors.textMuted,
  },
  weekDotTextActive: {
    color: Colors.background,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 16,
  },
  dayCard: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: Colors.surfaceLight,
    borderRadius: 12,
    padding: 20,
    marginBottom: 12,
  },
  dayCardCompleted: {
    backgroundColor: Colors.successLight,
  },
  checkmark: {
    position: "absolute",
    left: 20,
    fontSize: 16,
    fontWeight: "bold",
    color: Colors.successText,
  },
  dayName: {
    fontSize: 16,
    fontWeight: "600",
  },
});
