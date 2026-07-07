"use client";

import { useState } from "react";
import { getSupabaseClient } from "@/lib/supabaseClient";
import { awardXp } from "@/lib/gamification";
import type { Meal } from "@health-os/shared";
import type { FoodGuess } from "@/lib/foodVision";

const MAX_BYTES = 4 * 1024 * 1024;

export function PhotoMealLogger({ onLogged }: { onLogged: (meal: Meal) => void }) {
  const [preview, setPreview] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [mimeType, setMimeType] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [guess, setGuess] = useState<FoodGuess | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saveFeedback, setSaveFeedback] = useState<string | null>(null);

  function reset() {
    setPreview(null);
    setImageBase64(null);
    setMimeType(null);
    setGuess(null);
    setError(null);
  }

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    setGuess(null);
    setSaveFeedback(null);

    if (file.size > MAX_BYTES) {
      setError("That photo is too large — please use one under 4MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setPreview(result);
      setImageBase64(result.split(",")[1] ?? "");
      setMimeType(file.type);
    };
    reader.readAsDataURL(file);
  }

  async function handleAnalyze() {
    if (!imageBase64 || !mimeType || analyzing) return;
    setAnalyzing(true);
    setError(null);

    try {
      const supabase = getSupabaseClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();

      const res = await fetch("/api/food-photo", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(session?.access_token
            ? { Authorization: `Bearer ${session.access_token}` }
            : {}),
        },
        body: JSON.stringify({ imageBase64, mimeType }),
      });

      if (!res.ok) throw new Error(`Server returned ${res.status}`);
      const data: FoodGuess = await res.json();
      setGuess(data);
    } catch (err) {
      console.error(err);
      setError("Couldn't analyze that photo. You can still log it manually below.");
      setGuess({
        name: "New meal (edit details)",
        calories: null,
        protein_g: null,
        carbs_g: null,
        fat_g: null,
        note: "",
      });
    } finally {
      setAnalyzing(false);
    }
  }

  async function handleSave() {
    if (!guess || saving) return;
    setSaving(true);

    const supabase = getSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setSaving(false);
      setSaveFeedback("Couldn't verify your session — try refreshing the page.");
      return;
    }

    const { data, error: insertError } = await supabase
      .from("meals")
      .insert({
        user_id: user.id,
        name: guess.name,
        calories: guess.calories,
        protein_g: guess.protein_g,
        carbs_g: guess.carbs_g,
        fat_g: guess.fat_g,
      })
      .select()
      .single<Meal>();

    if (!insertError && data) {
      onLogged(data);
      try {
        await awardXp(supabase, user.id, 12, "logged_meal_photo");
        setSaveFeedback("Meal saved — +12 XP");
      } catch (xpErr) {
        console.error("XP award failed (meal was still saved):", xpErr);
        setSaveFeedback("Meal saved, but XP didn't update this time.");
      }
      reset();
    } else if (insertError) {
      console.error("Photo meal save failed:", insertError);
      setSaveFeedback(`Couldn't save that meal: ${insertError.message}`);
    }
    setSaving(false);
  }

  return (
    <div className="bg-surface rounded-2xl p-6 border border-surface2 flex flex-col gap-4">
      <p className="font-mono text-xs tracking-[0.2em] text-muted uppercase">
        Log via photo
      </p>

      {!preview && (
        <label className="border-2 border-dashed border-surface2 rounded-xl py-10 flex flex-col items-center justify-center cursor-pointer hover:border-vital/50 transition text-center gap-2">
          <span className="text-bone">Tap to take or upload a photo</span>
          <span className="text-muted text-xs">JPG or PNG, under 4MB</span>
          <input
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleFile}
            className="hidden"
          />
        </label>
      )}

      {preview && (
        <div className="flex flex-col gap-4">
          <img
            src={preview}
            alt="Meal preview"
            className="w-full max-h-64 object-cover rounded-xl border border-surface2"
          />

          {!guess && (
            <div className="flex gap-3">
              <button
                onClick={handleAnalyze}
                disabled={analyzing}
                className="flex-1 bg-vital text-ink font-semibold py-3 rounded-full hover:opacity-90 transition disabled:opacity-50"
              >
                {analyzing ? "Analyzing…" : "Analyze photo"}
              </button>
              <button
                onClick={reset}
                className="border border-surface2 text-bone px-5 py-3 rounded-full hover:border-coral transition"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      )}

      {error && <p className="text-coral text-sm">{error}</p>}

      {guess && (
        <div className="flex flex-col gap-3 border-t border-surface2 pt-4">
          {guess.note && <p className="text-muted text-xs">{guess.note}</p>}

          <label className="flex flex-col gap-1">
            <span className="text-sm text-muted">Meal name</span>
            <input
              value={guess.name}
              onChange={(e) => setGuess({ ...guess, name: e.target.value })}
              className="bg-ink border border-surface2 rounded-lg px-3 py-2 text-bone focus:border-vital outline-none"
            />
          </label>

          <div className="grid grid-cols-3 gap-3">
            <label className="flex flex-col gap-1">
              <span className="text-sm text-muted">Calories</span>
              <input
                type="number"
                value={guess.calories ?? ""}
                onChange={(e) =>
                  setGuess({ ...guess, calories: e.target.value ? Number(e.target.value) : null })
                }
                className="bg-ink border border-surface2 rounded-lg px-3 py-2 text-bone focus:border-vital outline-none"
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-sm text-muted">Protein (g)</span>
              <input
                type="number"
                value={guess.protein_g ?? ""}
                onChange={(e) =>
                  setGuess({ ...guess, protein_g: e.target.value ? Number(e.target.value) : null })
                }
                className="bg-ink border border-surface2 rounded-lg px-3 py-2 text-bone focus:border-vital outline-none"
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-sm text-muted">Carbs (g)</span>
              <input
                type="number"
                value={guess.carbs_g ?? ""}
                onChange={(e) =>
                  setGuess({ ...guess, carbs_g: e.target.value ? Number(e.target.value) : null })
                }
                className="bg-ink border border-surface2 rounded-lg px-3 py-2 text-bone focus:border-vital outline-none"
              />
            </label>
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 bg-vital text-ink font-semibold py-3 rounded-full hover:opacity-90 transition disabled:opacity-50"
            >
              {saving ? "Saving…" : "Save meal (+12 XP)"}
            </button>
            <button
              onClick={reset}
              className="border border-surface2 text-bone px-5 py-3 rounded-full hover:border-coral transition"
            >
              Discard
            </button>
          </div>
        </div>
      )}

      {saveFeedback && <p className="text-sm text-muted">{saveFeedback}</p>}
    </div>
  );
}
