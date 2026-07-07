import type { SupabaseClient } from "@supabase/supabase-js";

export async function getTodayCalories(
  supabase: SupabaseClient,
  userId: string
): Promise<number | null> {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const { data } = await supabase
    .from("meals")
    .select("calories")
    .eq("user_id", userId)
    .gte("logged_at", startOfDay.toISOString());

  if (!data || data.length === 0) return null;

  const loggedCalories = data.filter((m) => m.calories != null);
  if (loggedCalories.length === 0) return null;

  return loggedCalories.reduce((sum, m) => sum + (m.calories as number), 0);
}
