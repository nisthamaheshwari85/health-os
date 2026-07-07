// Mirrors supabase/schema.sql — keep in sync when the schema changes.
// Shared between apps/web and apps/mobile (Phase 2) so both talk to the
// same backend with the same shapes.

export interface Profile {
  id: string;
  full_name: string | null;
  goal: string | null;
  constraints: string[] | null;
  created_at: string;
}

export interface HealthMetric {
  id: string;
  user_id: string;
  metric_date: string; // ISO date
  sleep_hours: number | null;
  activity_minutes: number | null;
  mood_score: number | null; // 1-10
  stress_score: number | null; // 1-10
  source: "manual" | "wearable" | "derived";
  created_at: string;
}

export interface Meal {
  id: string;
  user_id: string;
  name: string;
  calories: number | null;
  protein_g: number | null;
  carbs_g: number | null;
  fat_g: number | null;
  logged_at: string;
}

export interface ChatMessage {
  id: string;
  user_id: string;
  role: "user" | "assistant";
  content: string;
  created_at: string;
}

export interface Streak {
  user_id: string;
  current_streak: number;
  longest_streak: number;
  last_active_date: string | null;
}

export interface XpEvent {
  id: string;
  user_id: string;
  amount: number;
  reason: string;
  created_at: string;
}

export interface HealthScoreBreakdown {
  score: number; // 0-100
  drivers: {
    label: string;
    value: number; // 0-100 contribution
    weight: number; // 0-1
  }[];
  topPriority: string;
}


