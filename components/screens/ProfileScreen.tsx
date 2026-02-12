import { Alert, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { observer } from "@legendapp/state/react";
import { router } from "expo-router";
import { useAuth } from "../../contexts/auth-context";
import { useExercises, useMaxLifts } from "../../hooks/use-exercises";
import { clearLocalCache } from "../../utils/supabase";
import { Colors } from "../../constants/colors";

const ProfileScreen = observer(() => {
  const { session, signOut } = useAuth();
  const exercises = useExercises();
  const maxLifts = useMaxLifts();

  const mainLifts = exercises.filter((e) =>
    ["squat", "bench", "deadlift", "press"].includes(e.category ?? ""),
  );

  return (
    <SafeAreaView style={styles.container} edges={["bottom"]}>
      <Text style={styles.heading}>Profile</Text>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account</Text>
        {session ? (
          <View>
            <Text style={styles.email}>{session.user.email}</Text>
            <Text style={styles.syncStatus}>Data syncing to cloud</Text>
            <TouchableOpacity style={styles.signOutButton} onPress={signOut}>
              <Text style={styles.signOutText}>Sign Out</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View>
            <Text style={styles.offlineText}>Working offline (local only)</Text>
            <TouchableOpacity
              style={styles.button}
              onPress={() => router.push("/(auth)/signup")}
            >
              <Text style={styles.buttonText}>Create Account to Sync</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Current Max Lifts</Text>
        {mainLifts.length === 0 ? (
          <Text style={styles.emptyText}>
            No exercises set up yet. Complete onboarding to get started.
          </Text>
        ) : (
          mainLifts.map((exercise) => {
            const max = maxLifts[exercise.id];
            return (
              <View key={exercise.id} style={styles.liftRow}>
                <Text style={styles.liftName}>{exercise.name}</Text>
                <Text style={styles.liftWeight}>
                  {max ? `${max} kg` : "—"}
                </Text>
              </View>
            );
          })
        )}
      </View>

      {exercises.length > 0 && (
        <TouchableOpacity
          style={[styles.button, styles.buttonOutline]}
          onPress={() => router.push("/onboarding")}
        >
          <Text style={[styles.buttonText, styles.buttonOutlineText]}>
            Update Max Lifts
          </Text>
        </TouchableOpacity>
      )}

      <TouchableOpacity
        style={styles.clearCacheButton}
        onPress={() =>
          Alert.alert(
            "Clear Local Cache",
            "This will remove all locally cached data. If you're signed in, your data will re-sync from the server. If you're offline-only, all data will be lost. Continue?",
            [
              { text: "Cancel", style: "cancel" },
              {
                text: "Clear Cache",
                style: "destructive",
                onPress: async () => {
                  await clearLocalCache();
                  Alert.alert(
                    "Cache Cleared",
                    "Please restart the app for changes to take effect.",
                  );
                },
              },
            ],
          )
        }
      >
        <Text style={styles.clearCacheText}>Clear Local Cache</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
});

export default ProfileScreen;

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
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 12,
    color: Colors.text,
  },
  email: {
    fontSize: 16,
    marginBottom: 4,
  },
  syncStatus: {
    fontSize: 13,
    color: Colors.success,
    marginBottom: 12,
  },
  offlineText: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 14,
    color: Colors.textMuted,
  },
  liftRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.surface,
  },
  liftName: {
    fontSize: 16,
  },
  liftWeight: {
    fontSize: 16,
    fontWeight: "600",
  },
  button: {
    backgroundColor: Colors.text,
    borderRadius: 8,
    padding: 16,
    alignItems: "center",
  },
  buttonText: {
    color: Colors.background,
    fontSize: 16,
    fontWeight: "600",
  },
  buttonOutline: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: Colors.text,
  },
  buttonOutlineText: {
    color: Colors.text,
  },
  signOutButton: {
    paddingVertical: 8,
  },
  signOutText: {
    color: Colors.danger,
    fontSize: 14,
  },
  clearCacheButton: {
    marginTop: 32,
    alignSelf: "center",
    paddingVertical: 8,
  },
  clearCacheText: {
    color: Colors.danger,
    fontSize: 14,
  },
});
