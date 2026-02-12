import { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import { createProgramFromMaxes } from "../../services/program-generator";
import type { MainLiftCategory } from "../../types/program";
import { Colors } from "../../constants/colors";

const LIFTS: { key: MainLiftCategory; label: string }[] = [
  { key: "squat", label: "Back Squat" },
  { key: "bench", label: "Bench Press" },
  { key: "deadlift", label: "Deadlift" },
  { key: "press", label: "Strict Press" },
];

export default function OnboardingScreen() {
  const { programType } = useLocalSearchParams<{ programType?: string }>();
  const [maxes, setMaxes] = useState<Record<string, string>>({
    squat: "",
    bench: "",
    deadlift: "",
    press: "",
  });

  const handleGenerate = () => {
    const parsed: Record<MainLiftCategory, number> = {
      squat: 0,
      bench: 0,
      deadlift: 0,
      press: 0,
    };

    for (const lift of LIFTS) {
      const value = parseFloat(maxes[lift.key]);
      if (isNaN(value) || value <= 0) {
        Alert.alert("Invalid Input", `Please enter a valid weight for ${lift.label}.`);
        return;
      }
      parsed[lift.key] = value;
    }

    try {
      createProgramFromMaxes(parsed, programType);
      router.replace("/(tabs)/home");
    } catch (error) {
      console.error("Failed to generate program:", error);
      Alert.alert(
        "Error",
        "Failed to generate your program. Please try again.",
      );
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.flex}
      >
        <ScrollView contentContainerStyle={styles.scroll}>
          <Text style={styles.heading}>Set Up Your Program</Text>
          <Text style={styles.subtitle}>
            Enter your current 1 rep max (or estimated) for each lift in
            kilograms.
          </Text>

          {LIFTS.map((lift) => (
            <View key={lift.key} style={styles.inputGroup}>
              <Text style={styles.label}>{lift.label}</Text>
              <View style={styles.inputRow}>
                <TextInput
                  style={styles.input}
                  value={maxes[lift.key]}
                  onChangeText={(text) =>
                    setMaxes((prev) => ({ ...prev, [lift.key]: text }))
                  }
                  keyboardType="decimal-pad"
                  placeholder="0"
                />
                <Text style={styles.unit}>kg</Text>
              </View>
            </View>
          ))}

          <TouchableOpacity style={styles.button} onPress={handleGenerate}>
            <Text style={styles.buttonText}>Generate Program</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  flex: {
    flex: 1,
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
    color: Colors.textSecondary,
    marginBottom: 32,
    lineHeight: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 8,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  input: {
    flex: 1,
    borderColor: Colors.border,
    borderWidth: 1,
    borderRadius: 8,
    padding: 16,
    fontSize: 20,
  },
  unit: {
    fontSize: 16,
    color: Colors.textSecondary,
    marginLeft: 12,
    width: 24,
  },
  button: {
    backgroundColor: Colors.text,
    borderRadius: 8,
    padding: 16,
    alignItems: "center",
    marginTop: 16,
  },
  buttonText: {
    color: Colors.background,
    fontSize: 16,
    fontWeight: "600",
  },
});
