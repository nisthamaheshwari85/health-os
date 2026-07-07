import type { HealthScoreBreakdown } from "@health-os/shared";

export interface GPSStep {
  week: number;
  focus: string;
  action: string;
  targetScoreByWeek: number;
}

export interface HealthGPS {
  currentScore: number;
  targetScore: number;
  steps: GPSStep[];
}

const ACTION_COPY: Record<string, string> = {
  Sleep: "Get 7-9 hours for at least 5 of 7 nights.",
  Activity: "Hit 20+ active minutes daily.",
  Nutrition: "Stay within a reasonable calorie range on most days.",
  Mood: "Check in daily and note what's actually helping.",
  Stress: "Add one daily 2-minute breathing break.",
};

export function computeHealthGPS(breakdown: HealthScoreBreakdown): HealthGPS {
  const sorted = [...breakdown.drivers].sort((a, b) => a.value - b.value);
  const [lowest, secondLowest] = sorted;

  const targetScore = Math.min(100, breakdown.score + 15);
  const totalGain = targetScore - breakdown.score;
  const perWeekGain = Math.max(1, Math.round(totalGain / 3));

  return {
    currentScore: breakdown.score,
    targetScore,
    steps: [
      {
        week: 1,
        focus: lowest.label,
        action: ACTION_COPY[lowest.label] ?? "Log this consistently for a week.",
        targetScoreByWeek: Math.min(100, breakdown.score + perWeekGain),
      },
      {
        week: 2,
        focus: secondLowest.label,
        action: ACTION_COPY[secondLowest.label] ?? "Log this consistently for a week.",
        targetScoreByWeek: Math.min(100, breakdown.score + perWeekGain * 2),
      },
      {
        week: 3,
        focus: "Consistency",
        action: "Keep both habits going — consistency compounds more than intensity.",
        targetScoreByWeek: targetScore,
      },
    ],
  };
}
