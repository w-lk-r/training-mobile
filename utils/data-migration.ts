import { allObservables, authUserId$ } from "./supabase";

/**
 * Migrates all local data to be associated with a real user ID.
 * Called once on first signup/login before enabling sync.
 * Replaces any 'local' user_id values with the authenticated user's UUID.
 */
export function migrateLocalDataToSupabase(userId: string) {
  authUserId$.set(userId);

  for (const obs$ of Object.values(allObservables)) {
    const data = obs$.get();
    if (!data) continue;

    Object.entries(data).forEach(([id, record]: [string, any]) => {
      if (record && (record.user_id === "local" || !record.user_id)) {
        obs$[id].user_id.set(userId);
      }
    });
  }
}
