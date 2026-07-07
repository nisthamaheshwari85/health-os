import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest } from "@/lib/serverAuth";
import { getCoachReply } from "@/lib/ai";
import { computeHealthScore } from "@/lib/healthScore";
import { getTodayCalories } from "@/lib/nutrition";
import { awardXp } from "@/lib/gamification";
import { getRecentMemoryNotes, saveMemoryIfRelevant } from "@/lib/memory";
import type { ChatMessage, HealthMetric } from "@health-os/shared";

export async function POST(req: NextRequest) {
  try {
    const { message } = await req.json();
    if (!message || typeof message !== "string") {
      return NextResponse.json({ error: "Missing message" }, { status: 400 });
    }

    const auth = await authenticateRequest(req);
    if (!auth.ok) return auth.response;
    const { supabase, user } = auth;

    const today = new Date().toISOString().slice(0, 10);
    const [{ data: history }, { data: metric }, todayCalories, memoryNotes] = await Promise.all([
      supabase
        .from("chat_messages")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: true })
        .limit(20)
        .returns<ChatMessage[]>(),
      supabase
        .from("health_metrics")
        .select("*")
        .eq("user_id", user.id)
        .eq("metric_date", today)
        .maybeSingle<HealthMetric>(),
      getTodayCalories(supabase, user.id),
      getRecentMemoryNotes(supabase, user.id),
    ]);

    const healthScore = computeHealthScore(metric ?? null, todayCalories);

    const reply = await getCoachReply({
      history: history ?? [],
      latestMessage: message,
      healthScore,
      memoryNotes,
    });

    await supabase.from("chat_messages").insert([
      { user_id: user.id, role: "user", content: message },
      { user_id: user.id, role: "assistant", content: reply },
    ]);

    try {
      await saveMemoryIfRelevant(supabase, user.id, message);
    } catch (memErr) {
      console.error("Memory save failed (non-fatal):", memErr);
    }

    try {
      await awardXp(supabase, user.id, 5, "chatted_with_coach");
    } catch (xpErr) {
      console.error("XP award failed (non-fatal):", xpErr);
    }

    return NextResponse.json({ reply });
  } catch (err) {
    console.error("Coach API error:", err);
    return NextResponse.json(
      { error: "Something went wrong. Try again." },
      { status: 500 }
    );
  }
}
