import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest } from "@/lib/serverAuth";
import { computeHealthScore } from "@/lib/healthScore";
import { getTodayCalories } from "@/lib/nutrition";
import type { HealthMetric } from "@health-os/shared";

export async function GET(req: NextRequest) {
  const auth = await authenticateRequest(req);
  if (!auth.ok) return auth.response;
  const { supabase, user } = auth;

  const today = new Date().toISOString().slice(0, 10);
  const [{ data: metric }, todayCalories] = await Promise.all([
    supabase
      .from("health_metrics")
      .select("*")
      .eq("user_id", user.id)
      .eq("metric_date", today)
      .maybeSingle<HealthMetric>(),
    getTodayCalories(supabase, user.id),
  ]);

  return NextResponse.json(computeHealthScore(metric ?? null, todayCalories));
}
