import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";

interface ProgramTypeOption {
  type: string;
  name: string;
  description: string;
  detail: string;
}

const PROGRAM_TYPES: ProgramTypeOption[] = [
  {
    type: "powerlifting",
    name: "Powerlifting",
    description: "Squat, bench, deadlift, and press with linear periodization.",
    detail: "4 weeks, 4 days/week",
  },
  {
    type: "olympic_weightlifting",
    name: "Olympic Weightlifting",
    description: "Snatch and clean & jerk focused with pulls and squats.",
    detail: "4 weeks, 5 days/week",
  },
  {
    type: "crossfit",
    name: "CrossFit",
    description: "Mixed modality workouts combining strength, gymnastics, and cardio.",
    detail: "4 weeks, 5 days/week",
  },
  {
    type: "zone2_cardio",
    name: "Zone 2 Cardio",
    description: "Low-intensity steady-state cardio for aerobic base building.",
    detail: "Ongoing, 3-5 days/week",
  },
];

export default function ProgramTypeScreen() {
  return (
    <SafeAreaView style={styles.container} edges={["bottom"]}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.heading}>Choose Program Type</Text>
        <Text style={styles.subtitle}>
          Pick a training style. You can have multiple programs running at the
          same time and mix days from different programs into a single workout.
        </Text>

        {PROGRAM_TYPES.map((pt) => (
          <TouchableOpacity
            key={pt.type}
            style={styles.card}
            onPress={() =>
              router.push({
                pathname: "/onboarding",
                params: { programType: pt.type },
              })
            }
          >
            <View style={styles.cardContent}>
              <Text style={styles.cardName}>{pt.name}</Text>
              <Text style={styles.cardDescription}>{pt.description}</Text>
              <Text style={styles.cardDetail}>{pt.detail}</Text>
            </View>
            <Text style={styles.chevron}>&rsaquo;</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  scroll: {
    padding: 24,
  },
  heading: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: "#666",
    marginBottom: 32,
    lineHeight: 20,
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8f8f8",
    borderRadius: 12,
    padding: 20,
    marginBottom: 12,
  },
  cardContent: {
    flex: 1,
  },
  cardName: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 4,
  },
  cardDescription: {
    fontSize: 13,
    color: "#666",
    lineHeight: 18,
    marginBottom: 4,
  },
  cardDetail: {
    fontSize: 12,
    color: "#999",
  },
  chevron: {
    fontSize: 28,
    color: "#ccc",
    marginLeft: 12,
  },
});
