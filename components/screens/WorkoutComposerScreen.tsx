import { useState } from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { observer } from "@legendapp/state/react";
import { router } from "expo-router";
import {
  useAllCurrentWorkoutDays,
  useWorkoutTemplates,
  useTemplateItems,
} from "../../hooks/use-program";
import type { Tables } from "../../utils/database.types";

type WorkoutDayWithProgram = Tables<"workout_days"> & {
  programName: string;
  programId: string;
  weekNumber: number;
};

const WorkoutComposerScreen = observer(() => {
  const allDays = useAllCurrentWorkoutDays();
  const templates = useWorkoutTemplates();
  const [selectedDayIds, setSelectedDayIds] = useState<string[]>([]);
  const [mode, setMode] = useState<"pick" | "reorder">("pick");

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

  const selectedDays = selectedDayIds
    .map((id) => allDays.find((d) => d.id === id))
    .filter(Boolean) as WorkoutDayWithProgram[];

  const handleStart = () => {
    router.push({
      pathname: "/active-workout",
      params: { dayIds: selectedDayIds.join(",") },
    });
  };

  const handleStartFromTemplate = (templateId: string) => {
    router.push({
      pathname: "/active-workout",
      params: { templateId },
    });
  };

  // Group days by program for the picker
  const daysByProgram: Record<string, { programName: string; days: WorkoutDayWithProgram[] }> = {};
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
                  style={[styles.arrowButton, index === 0 && styles.arrowDisabled]}
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
          Select workout days from any of your programs to combine into one
          session.
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

        {Object.entries(daysByProgram).map(([progId, { programName, days }]) => (
          <View key={progId} style={styles.programGroup}>
            <Text style={styles.programLabel}>
              {programName} (Week {days[0]?.weekNumber})
            </Text>
            {days.map((day) => {
              const isSelected = selectedDayIds.includes(day.id);
              return (
                <TouchableOpacity
                  key={day.id}
                  style={[styles.dayRow, isSelected && styles.dayRowSelected]}
                  onPress={() => toggleDay(day.id)}
                >
                  <View style={[styles.checkbox, isSelected && styles.checkboxChecked]}>
                    {isSelected && <Text style={styles.checkmark}>{"\u2713"}</Text>}
                  </View>
                  <Text style={styles.dayRowName}>{day.name}</Text>
                  <Text style={styles.dayRowNumber}>Day {day.day_number}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        ))}

        {Object.keys(daysByProgram).length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>
              No programs yet. Create a program first.
            </Text>
            <TouchableOpacity
              style={styles.ctaButton}
              onPress={() => router.push("/program-type")}
            >
              <Text style={styles.ctaButtonText}>Create Program</Text>
            </TouchableOpacity>
          </View>
        )}

        {selectedDayIds.length > 0 && (
          <View style={styles.bottomActions}>
            <Text style={styles.selectedCount}>
              {selectedDayIds.length} day{selectedDayIds.length > 1 ? "s" : ""}{" "}
              selected
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
              <TouchableOpacity style={styles.startButton} onPress={handleStart}>
                <Text style={styles.startButtonText}>Start Workout</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
});

export default WorkoutComposerScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
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
    color: "#666",
    marginBottom: 24,
    lineHeight: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 12,
    marginTop: 8,
  },
  templateCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f0f0ff",
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
    color: "#999",
  },
  programGroup: {
    marginBottom: 20,
  },
  programLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#666",
    marginBottom: 8,
  },
  dayRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8f8f8",
    borderRadius: 10,
    padding: 16,
    marginBottom: 6,
  },
  dayRowSelected: {
    backgroundColor: "#e8f5e8",
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: "#ccc",
    marginRight: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  checkboxChecked: {
    backgroundColor: "#333",
    borderColor: "#333",
  },
  checkmark: {
    color: "#fff",
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
    color: "#999",
  },
  emptyState: {
    alignItems: "center",
    paddingTop: 40,
  },
  emptyText: {
    fontSize: 16,
    color: "#999",
    marginBottom: 16,
  },
  ctaButton: {
    backgroundColor: "#333",
    borderRadius: 8,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  ctaButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  bottomActions: {
    marginTop: 24,
    borderTopWidth: 1,
    borderTopColor: "#eee",
    paddingTop: 16,
  },
  selectedCount: {
    fontSize: 14,
    color: "#666",
    marginBottom: 12,
  },
  buttonRow: {
    flexDirection: "row",
    gap: 12,
  },
  reorderButton: {
    flex: 1,
    backgroundColor: "#f0f0f0",
    borderRadius: 8,
    padding: 16,
    alignItems: "center",
  },
  reorderButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  startButton: {
    flex: 1,
    backgroundColor: "#333",
    borderRadius: 8,
    padding: 16,
    alignItems: "center",
  },
  startButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  // Reorder mode styles
  reorderCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8f8f8",
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
    color: "#999",
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
    backgroundColor: "#e0e0e0",
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
    backgroundColor: "#f0f0f0",
    borderRadius: 8,
    padding: 16,
    alignItems: "center",
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
});
