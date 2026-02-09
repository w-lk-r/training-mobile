import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { Alert } from "react-native";
import { Session } from "@supabase/supabase-js";
import {
  supabase,
  authUserId$,
  enableAllSync,
  disableAllSync,
} from "../utils/supabase";
import { migrateLocalDataToSupabase } from "../utils/data-migration";

interface AuthContextType {
  session: Session | null;
  isLoading: boolean;
  signUp: (email: string, password: string) => Promise<{ error: string | null }>;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  isLoading: true,
  signUp: async () => ({ error: null }),
  signIn: async () => ({ error: null }),
  signOut: async () => {},
});

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadSession = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      if (session?.user) {
        authUserId$.set(session.user.id);
        enableAllSync();
      }
    } catch (error) {
      console.error("Failed to get session:", error);
      Alert.alert(
        "Connection Error",
        "Could not restore your session. The app will continue in offline mode.",
        [{ text: "Retry", onPress: () => loadSession() }, { text: "Continue Offline" }],
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);

      if (session?.user) {
        try {
          await migrateLocalDataToSupabase(session.user.id);
        } catch (error) {
          console.error("Failed to migrate local data:", error);
          Alert.alert(
            "Migration Error",
            "Some local data could not be synced to your account. Your local data is safe — it will sync the next time you sign in.",
          );
        }
        enableAllSync();
      } else {
        authUserId$.set("local");
        disableAllSync();
      }
    });

    return () => subscription.unsubscribe();
  }, [loadSession]);

  const signUp = async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({ email, password });
    return { error: error?.message ?? null };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error: error?.message ?? null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ session, isLoading, signUp, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}
