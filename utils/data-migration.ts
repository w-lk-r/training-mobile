import { allObservables, authUserId$ } from "./supabase";

/** Type guard for records that have a user_id field */
function hasUserId(
  record: unknown,
): record is { user_id: string | null } {
  return (
    record != null &&
    typeof record === "object" &&
    "user_id" in record
  );
}

/**
 * Migrates all local data to be associated with a real user ID.
 * Called once on first signup/login before enabling sync.
 * Replaces any 'local' user_id values with the authenticated user's UUID.
 */
export async function migrateLocalDataToSupabase(userId: string) {
  authUserId$.set(userId);

  const errors: { table: string; id: string; error: unknown }[] = [];

  for (const [tableName, obs$] of Object.entries(allObservables)) {
    const data = obs$.get();
    if (!data) continue;

    for (const [id, record] of Object.entries(data as Record<string, unknown>)) {
      if (hasUserId(record) && (record.user_id === "local" || !record.user_id)) {
        try {
          obs$[id].user_id.set(userId);
        } catch (err) {
          errors.push({ table: tableName, id, error: err });
        }
      }
    }
  }

  if (errors.length > 0) {
    console.warn(
      `Migration completed with ${errors.length} failed record(s):`,
      errors,
    );
  }
}
