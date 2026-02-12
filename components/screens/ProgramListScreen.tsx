import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { observer } from "@legendapp/state/react";
import { router } from "expo-router";
import { useAllPrograms } from "../../hooks/use-program";
import { deleteProgram } from "../../utils/supabase";
import { Colors } from "../../constants/colors";

const PROGRAM_TYPE_LABELS: Record<string, string> = {
  powerlifting: "Powerlifting",
  olympic_weightlifting: "Olympic Weightlifting",
  crossfit: "CrossFit",
  zone2_cardio: "Zone 2 Cardio",
};

const ProgramListScreen = observer(() => {
  const programs = useAllPrograms();

  const handleDelete = (programId: string, programName: string) => {
    Alert.alert(
      "Delete Program",
      `Are you sure you want to delete "${programName}"? This cannot be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => deleteProgram(programId),
        },
      ],
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={["bottom"]}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.headerRow}>
          <Text style={styles.heading}>Programs</Text>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => router.push("/program-type")}
          >
            <Text style={styles.addButtonText}>+ New</Text>
          </TouchableOpacity>
        </View>

        {programs.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>No Programs Yet</Text>
            <Text style={styles.emptySubtitle}>
              Create your first training program to get started.
            </Text>
            <TouchableOpacity
              style={styles.ctaButton}
              onPress={() => router.push("/program-type")}
            >
              <Text style={styles.ctaButtonText}>Create Program</Text>
            </TouchableOpacity>
          </View>
        ) : (
          programs.map((program) => (
            <TouchableOpacity
              key={program.id}
              style={styles.card}
              onPress={() =>
                router.push({
                  pathname: "/program-detail",
                  params: { programId: program.id },
                })
              }
              onLongPress={() => handleDelete(program.id, program.name)}
            >
              <View style={styles.cardHeader}>
                <Text style={styles.cardName}>{program.name}</Text>
                <View style={styles.typeBadge}>
                  <Text style={styles.typeBadgeText}>
                    {PROGRAM_TYPE_LABELS[program.program_type ?? "powerlifting"] ??
                      program.program_type}
                  </Text>
                </View>
              </View>
              <Text style={styles.cardMeta}>
                Week {program.current_week} of {program.weeks_count}
              </Text>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
});

export default ProgramListScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scroll: {
    padding: 24,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  heading: {
    fontSize: 28,
    fontWeight: "bold",
  },
  addButton: {
    backgroundColor: Colors.text,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  addButtonText: {
    color: Colors.background,
    fontSize: 14,
    fontWeight: "600",
  },
  empty: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 80,
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
  ctaButton: {
    backgroundColor: Colors.text,
    borderRadius: 8,
    paddingHorizontal: 32,
    paddingVertical: 16,
  },
  ctaButtonText: {
    color: Colors.background,
    fontSize: 16,
    fontWeight: "600",
  },
  card: {
    backgroundColor: Colors.surfaceLight,
    borderRadius: 12,
    padding: 20,
    marginBottom: 12,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  cardName: {
    fontSize: 18,
    fontWeight: "600",
    flex: 1,
  },
  typeBadge: {
    backgroundColor: Colors.borderLight,
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginLeft: 8,
  },
  typeBadgeText: {
    fontSize: 12,
    fontWeight: "500",
    color: Colors.textSecondary,
  },
  cardMeta: {
    fontSize: 13,
    color: Colors.textMuted,
  },
});
