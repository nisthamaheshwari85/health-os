import type { SupabaseClient } from "@supabase/supabase-js";

const FACT_PATTERNS = [
  /\bi(?:'m| am) (vegetarian|vegan|pescatarian|allergic to [a-z ]+|diabetic|pregnant)\b/i,
  /\bi have (?:a |an )?([a-z ]+ (?:injury|condition|allergy))\b/i,
  /\bmy goal is to ([a-z0-9 ,'-]+)/i,
  /\bi (?:prefer|hate|love|can't stand) ([a-z0-9 ,'-]+)/i,
  /\bi(?:'m| am) training for ([a-z0-9 ,'-]+)/i,
];

export function extractMemoryNote(message: string): string | null {
  const trimmed = message.trim();
  if (trimmed.length < 6 || trimmed.length > 300) return null;

  for (const pattern of FACT_PATTERNS) {
    if (pattern.test(trimmed)) {
      return trimmed;
    }
  }
  return null;
}

export async function saveMemoryIfRelevant(
  supabase: SupabaseClient,
  userId: string,
  message: string
): Promise<void> {
  const note = extractMemoryNote(message);
  if (!note) return;

  const { data: existing } = await supabase
    .from("coach_memory")
    .select("note")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(20);

  const alreadyKnown = (existing ?? []).some(
    (e) => e.note.toLowerCase() === note.toLowerCase()
  );
  if (alreadyKnown) return;

  await supabase.from("coach_memory").insert({ user_id: userId, note });
}

export async function getRecentMemoryNotes(
  supabase: SupabaseClient,
  userId: string,
  limit = 10
): Promise<string[]> {
  const { data } = await supabase
    .from("coach_memory")
    .select("note")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);

  return (data ?? []).map((d) => d.note);
}
