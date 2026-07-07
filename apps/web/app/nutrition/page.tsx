"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseClient } from "@/lib/supabaseClient";
import type { Meal } from "@health-os/shared";
import { NavBar } from "@/components/NavBar";
import { MealLogger } from "@/components/MealLogger";
import { PhotoMealLogger } from "@/components/PhotoMealLogger";

export default function NutritionPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [meals, setMeals] = useState<Meal[]>([]);

  useEffect(() => {
    async function load() {
      const supabase = getSupabaseClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);

      const { data } = await supabase
        .from("meals")
        .select("*")
        .eq("user_id", user.id)
        .gte("logged_at", startOfDay.toISOString())
        .order("logged_at", { ascending: false });

      setMeals(data ?? []);
      setLoading(false);
    }
    load();
  }, [router]);

  return (
    <main className="min-h-screen">
      <NavBar />
      <div className="max-w-2xl mx-auto px-6 py-10">
        <h1 className="font-display text-3xl text-bone mb-1">Nutrition</h1>
        <p className="text-muted mb-8">
          Snap a photo or log manually — both feed your Health Score.
        </p>
        {!loading && (
          <div className="flex flex-col gap-6">
            <PhotoMealLogger onLogged={(m) => setMeals((prev) => [m, ...prev])} />
            <MealLogger meals={meals} onLogged={(m) => setMeals((prev) => [m, ...prev])} />
          </div>
        )}
      </div>
    </main>
  );
}
