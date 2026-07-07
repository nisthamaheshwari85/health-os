import type { HealthMetric, HealthScoreBreakdown } from "@health-os/shared";

const WEIGHTS = {
  sleep: 0.3,
  activity: 0.2,
  mood: 0.15,
  stress: 0.15,
  nutrition: 0.2,
};

function normalizeSleep(hours: number | null): number {
  if (hours == null) return 50;
  const target = 8;
  const diff = Math.abs(hours - target);
  return Math.max(0, 100 - diff * 20);
}

function normalizeActivity(minutes: number | null): number {
  if (minutes == null) return 50;
  return Math.min(100, (minutes / 30) * 100);
}

function normalizeMood(mood: number | null): number {
  if (mood == null) return 50;
  return (mood / 10) * 100;
}

function normalizeStress(stress: number | null): number {
  if (stress == null) return 50;
  return 100 - (stress / 10) * 100;
}

function normalizeNutrition(totalCalories: number | null): number {
  if (totalCalories == null) return 50;
  const targetMin = 1800;
  const targetMax = 2400;
  if (totalCalories >= targetMin && totalCalories <= targetMax) return 100;
  const diff = totalCalories < targetMin ? targetMin - totalCalories : totalCalories - targetMax;
  return Math.max(0, 100 - diff / 20);
}

export function computeHealthScore(
  todayMetric: HealthMetric | null,
  todayCaloriesTotal: number | null = null
): HealthScoreBreakdown {
  const sleep = normalizeSleep(todayMetric?.sleep_hours ?? null);
  const activity = normalizeActivity(todayMetric?.activity_minutes ?? null);
  const mood = normalizeMood(todayMetric?.mood_score ?? null);
  const stress = normalizeStress(todayMetric?.stress_score ?? null);
  const nutrition = normalizeNutrition(todayCaloriesTotal);

  const drivers = [
    { label: "Sleep", value: sleep, weight: WEIGHTS.sleep },
    { label: "Activity", value: activity, weight: WEIGHTS.activity },
    { label: "Nutrition", value: nutrition, weight: WEIGHTS.nutrition },
    { label: "Mood", value: mood, weight: WEIGHTS.mood },
    { label: "Stress", value: stress, weight: WEIGHTS.stress },
  ];

  const score = Math.round(
    drivers.reduce((sum, d) => sum + d.value * d.weight, 0)
  );

  const lowest = drivers.reduce((min, d) => (d.value < min.value ? d : min));
  const priorityCopy: Record<string, string> = {
    Sleep: "Aim for 7-9 hours tonight — this is dragging your score down most.",
    Activity: "Get 20-30 minutes of movement in today.",
    Nutrition: "Log today's meals — staying in a reasonable calorie range keeps this up.",
    Mood: "Check in with yourself today — log what's affecting your mood.",
    Stress: "Try a short breathing break — your stress input is high today.",
  };

  return {
    score,
    drivers,
    topPriority: priorityCopy[lowest.label] ?? "Log today's data to get a priority.",
  };
}
