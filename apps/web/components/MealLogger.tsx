"use client";

import { useState } from "react";
import { getSupabaseClient } from "@/lib/supabaseClient";
import { awardXp } from "@/lib/gamification";
import type { Meal } from "@health-os/shared";

export function MealLogger({
  meals,
  onLogged,
}: {
  meals: Meal[];
  onLogged: (meal: Meal) => void;
}) {
  const [name, setName] = useState("");
  const [calories, setCalories] = useState("");
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || saving) return;
    setSaving(true);
    setFeedback(null);

    const supabase = getSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setSaving(false);
      setFeedback("Couldn't verify your session — try refreshing the page.");
      return;
    }

    const { data, error } = await supabase
      .from("meals")
      .insert({
        user_id: user.id,
        name: name.trim(),
        calories: calories ? Number(calories) : null,
      })
      .select()
      .single<Meal>();

    if (!error && data) {
      onLogged(data);
      setName("");
      setCalories("");
      try {
        await awardXp(supabase, user.id, 10, "logged_meal");
        setFeedback("Meal saved — +10 XP");
      } catch (xpErr) {
        console.error("XP award failed (meal was still saved):", xpErr);
        setFeedback("Meal saved, but XP didn't update this time.");
      }
    } else if (error) {
      console.error("Meal save failed:", error);
      setFeedback(`Couldn't save that meal: ${error.message}`);
    }
    setSaving(false);
  }

  return (
    <div>
      <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 mb-8">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="What did you eat?"
          required
          className="flex-1 bg-surface border border-surface2 rounded-lg px-4 py-3 text-bone placeholder:text-muted focus:border-vital outline-none"
        />
        <input
          value={calories}
          onChange={(e) => setCalories(e.target.value)}
          placeholder="Calories (optional)"
          type="number"
          className="sm:w-48 bg-surface border border-surface2 rounded-lg px-4 py-3 text-bone placeholder:text-muted focus:border-vital outline-none"
        />
        <button
          type="submit"
          disabled={saving}
          className="bg-vital text-ink font-semibold px-6 py-3 rounded-lg hover:opacity-90 transition disabled:opacity-50"
        >
          {saving ? "Logging…" : "Log meal"}
        </button>
      </form>

      {feedback && (
        <p className="text-sm text-muted mb-4 -mt-4">{feedback}</p>
      )}

      <div className="flex flex-col gap-3">
        {meals.length === 0 && (
          <p className="text-muted text-sm">No meals logged today yet.</p>
        )}
        {meals.map((meal) => (
          <div
            key={meal.id}
            className="flex items-center justify-between bg-surface border border-surface2 rounded-lg px-4 py-3"
          >
            <span className="text-bone">{meal.name}</span>
            {meal.calories != null && (
              <span className="text-muted font-mono text-sm">{meal.calories} kcal</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
