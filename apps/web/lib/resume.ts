import type { SupabaseClient } from "@supabase/supabase-js";
import { getXpTotal, getStreak, computeLevel } from "./gamification";

export interface HealthResume {
  level: number;
  xpTotal: number;
  currentStreak: number;
  longestStreak: number;
  totalMealsLogged: number;
  totalVitalsDaysLogged: number;
  memberSince: string | null;
}

export async function getHealthResume(
  supabase: SupabaseClient,
  userId: string
): Promise<HealthResume> {
  const [xpTotal, streak, { count: mealCount }, { count: vitalsCount }, { data: profile }] =
    await Promise.all([
      getXpTotal(supabase, userId),
      getStreak(supabase, userId),
      supabase
        .from("meals")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId),
      supabase
        .from("health_metrics")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId),
      supabase.from("profiles").select("created_at").eq("id", userId).maybeSingle(),
    ]);

  const { level } = computeLevel(xpTotal);

  return {
    level,
    xpTotal,
    currentStreak: streak?.current_streak ?? 0,
    longestStreak: streak?.longest_streak ?? 0,
    totalMealsLogged: mealCount ?? 0,
    totalVitalsDaysLogged: vitalsCount ?? 0,
    memberSince: profile?.created_at ?? null,
  };
}
