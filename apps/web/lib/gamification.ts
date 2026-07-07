import type { SupabaseClient } from "@supabase/supabase-js";
import type { Streak } from "@health-os/shared";

const XP_PER_LEVEL = 100;

export function computeLevel(totalXp: number) {
  const level = Math.floor(totalXp / XP_PER_LEVEL) + 1;
  const xpIntoLevel = totalXp % XP_PER_LEVEL;
  return { level, xpIntoLevel, xpPerLevel: XP_PER_LEVEL };
}

export async function getXpTotal(
  supabase: SupabaseClient,
  userId: string
): Promise<number> {
  const { data } = await supabase
    .from("xp_events")
    .select("amount")
    .eq("user_id", userId);
  return (data ?? []).reduce((sum, e) => sum + (e.amount as number), 0);
}

export async function getStreak(
  supabase: SupabaseClient,
  userId: string
): Promise<Streak | null> {
  const { data } = await supabase
    .from("streaks")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle<Streak>();
  return data;
}

export async function awardXp(
  supabase: SupabaseClient,
  userId: string,
  amount: number,
  reason: string
): Promise<void> {
  await supabase.from("xp_events").insert({ user_id: userId, amount, reason });
  await touchStreak(supabase, userId);
}

async function touchStreak(supabase: SupabaseClient, userId: string): Promise<void> {
  const today = new Date().toISOString().slice(0, 10);
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);

  const { data: streak } = await supabase
    .from("streaks")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle<Streak>();

  if (!streak) {
    await supabase
      .from("streaks")
      .insert({ user_id: userId, current_streak: 1, longest_streak: 1, last_active_date: today });
    return;
  }

  if (streak.last_active_date === today) return;

  const newCurrent = streak.last_active_date === yesterday ? streak.current_streak + 1 : 1;
  const newLongest = Math.max(streak.longest_streak, newCurrent);

  await supabase
    .from("streaks")
    .update({ current_streak: newCurrent, longest_streak: newLongest, last_active_date: today })
    .eq("user_id", userId);
}
