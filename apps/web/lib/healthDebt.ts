import type { HealthMetric } from "@health-os/shared";

export interface HealthDebt {
  sleepDebtHours: number;
  avgStress: number | null;
  inactiveDays: number;
  daysTracked: number;
}

const SLEEP_TARGET_HOURS = 8;
const ACTIVE_MINUTES_THRESHOLD = 20;

export function computeHealthDebt(metrics: HealthMetric[]): HealthDebt {
  let sleepDebtHours = 0;
  let stressSum = 0;
  let stressCount = 0;
  let inactiveDays = 0;

  for (const m of metrics) {
    if (m.sleep_hours != null && m.sleep_hours < SLEEP_TARGET_HOURS) {
      sleepDebtHours += SLEEP_TARGET_HOURS - m.sleep_hours;
    }
    if (m.stress_score != null) {
      stressSum += m.stress_score;
      stressCount += 1;
    }
    if (m.activity_minutes != null && m.activity_minutes < ACTIVE_MINUTES_THRESHOLD) {
      inactiveDays += 1;
    }
  }

  return {
    sleepDebtHours: Math.round(sleepDebtHours * 10) / 10,
    avgStress: stressCount > 0 ? Math.round((stressSum / stressCount) * 10) / 10 : null,
    inactiveDays,
    daysTracked: metrics.length,
  };
}
