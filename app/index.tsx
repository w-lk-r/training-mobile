import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { Link } from "expo-router";
import { useAuth } from "../contexts/auth-context";

export default function Index() {
  const { session, isLoading, signOut } = useAuth();

  if (isLoading) {
    return (
      <SafeAreaProvider>
        <SafeAreaView style={styles.container}>
          <Text style={styles.heading}>Loading...</Text>
        </SafeAreaView>
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.container}>
        <Text style={styles.heading}>Training</Text>

        <View style={styles.content}>
          <Text style={styles.statusText}>
            {session
              ? `Signed in as ${session.user.email}`
              : "Working offline (local data only)"}
          </Text>

          <Text style={styles.placeholder}>
            Program and workout features coming in Phase 2
          </Text>
        </View>

        <View style={styles.footer}>
          {session ? (
            <TouchableOpacity style={styles.button} onPress={signOut}>
              <Text style={styles.buttonText}>Sign Out</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.authLinks}>
              <Link href="/(auth)/login" asChild>
                <TouchableOpacity style={styles.button}>
                  <Text style={styles.buttonText}>Sign In</Text>
                </TouchableOpacity>
              </Link>
              <Link href="/(auth)/signup" asChild>
                <TouchableOpacity style={[styles.button, styles.buttonOutline]}>
                  <Text style={[styles.buttonText, styles.buttonOutlineText]}>
                    Create Account
                  </Text>
                </TouchableOpacity>
              </Link>
            </View>
          )}
        </View>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    padding: 24,
  },
  heading: {
    fontSize: 28,
    fontWeight: "bold",
    textAlign: "center",
    marginTop: 16,
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  statusText: {
    fontSize: 14,
    color: "#666",
    marginBottom: 24,
  },
  placeholder: {
    fontSize: 16,
    color: "#999",
    textAlign: "center",
  },
  footer: {
    paddingBottom: 16,
  },
  authLinks: {
    gap: 12,
  },
  button: {
    backgroundColor: "#333",
    borderRadius: 8,
    padding: 16,
    alignItems: "center",
  },
  buttonOutline: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "#333",
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  buttonOutlineText: {
    color: "#333",
  },
});
