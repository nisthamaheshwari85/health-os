import { callAI } from "@/lib/aiClient";
import type { AgentType } from "./personas";

const KEYWORDS: Record<Exclude<AgentType, "general">, string[]> = {
  nutrition: ["eat", "food", "diet", "meal", "calorie", "protein", "carb", "nutrition", "hungry", "khana"],
  workout: ["workout", "exercise", "gym", "reps", "sets", "muscle", "cardio", "strength", "training"],
  mental_health: ["stress", "motivat", "tired", "burnout", "lazy", "mood", "anxious", "overwhelm", "focus", "habit"],
  chef: ["cook", "recipe", "banau", "banana hai", "pantry", "ingredient", "kitchen", "leftover", "meal prep", "what should i make"],
};

export function classifyByKeywords(message: string): AgentType | null {
  const lower = message.toLowerCase();
  for (const [agent, words] of Object.entries(KEYWORDS)) {
    if (words.some((w) => lower.includes(w))) return agent as AgentType;
  }
  return null;
}

export async function routeToAgent(message: string): Promise<AgentType> {
  const keywordMatch = classifyByKeywords(message);
  if (keywordMatch) return keywordMatch;

  // fallback to AI classification for ambiguous messages
  const raw = await callAI(
    "Classify the user's message into exactly one category. Respond with ONLY one word, nothing else.",
    `Categories: nutrition, workout, mental_health, chef, general\n\nMessage: "${message}"`
  );
  const cleaned = raw.trim().toLowerCase().replace(/[^a-z_]/g, "");
  if (["nutrition", "workout", "mental_health", "chef"].includes(cleaned)) {
    return cleaned as AgentType;
  }
  return "general";
}
