"use client";

import { useEffect, useState } from "react";
import { getSupabaseClient } from "@/lib/supabaseClient";
import { useSupabaseUser } from "@/hooks/useSupabaseUser";
import { getHealthResume, type HealthResume } from "@/lib/resume";
import { NavBar } from "@/components/NavBar";

function formatDate(iso: string | null): string {
  if (!iso) return "recently";
  return new Date(iso).toLocaleDateString(undefined, {
    month: "long",
    year: "numeric",
  });
}

export default function ResumePage() {
  const { user, loading: authLoading } = useSupabaseUser();
  const [resume, setResume] = useState<HealthResume | null>(null);

  useEffect(() => {
    async function load() {
      if (!user) return;
      const supabase = getSupabaseClient();
      const data = await getHealthResume(supabase, user.id);
      setResume(data);
    }
    load();
  }, [user]);

  if (authLoading || !resume) {
    return (
      <main className="min-h-screen">
        <NavBar />
        <div className="px-6 py-16 text-center text-muted">Loading your resume…</div>
      </main>
    );
  }

  const name = user?.user_metadata?.full_name as string | undefined;

  return (
    <main className="min-h-screen">
      <NavBar />
      <div className="max-w-2xl mx-auto px-6 py-10">
        <div className="bg-surface rounded-2xl p-8 border border-surface2">
          <p className="font-mono text-xs tracking-[0.2em] text-vital uppercase mb-2">
            Health Resume
          </p>
          <h1 className="font-display text-3xl text-bone mb-1">
            {name ?? "Your health journey"}
          </h1>
          <p className="text-muted text-sm mb-8">
            Member since {formatDate(resume.memberSince)}
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-6 mb-8">
            <div>
              <p className="font-display text-3xl text-vital">{resume.level}</p>
              <p className="font-mono text-xs text-muted uppercase tracking-wide">Level</p>
            </div>
            <div>
              <p className="font-display text-3xl text-bone">{resume.xpTotal}</p>
              <p className="font-mono text-xs text-muted uppercase tracking-wide">Total XP</p>
            </div>
            <div>
              <p className="font-display text-3xl text-coral">{resume.longestStreak}</p>
              <p className="font-mono text-xs text-muted uppercase tracking-wide">
                Longest streak
              </p>
            </div>
            <div>
              <p className="font-display text-3xl text-bone">{resume.currentStreak}</p>
              <p className="font-mono text-xs text-muted uppercase tracking-wide">
                Current streak
              </p>
            </div>
            <div>
              <p className="font-display text-3xl text-bone">{resume.totalMealsLogged}</p>
              <p className="font-mono text-xs text-muted uppercase tracking-wide">
                Meals logged
              </p>
            </div>
            <div>
              <p className="font-display text-3xl text-bone">
                {resume.totalVitalsDaysLogged}
              </p>
              <p className="font-mono text-xs text-muted uppercase tracking-wide">
                Vitals days logged
              </p>
            </div>
          </div>

          <p className="text-muted text-xs border-t border-surface2 pt-4">
            This is a personal summary for now — public shareable links (with
            privacy controls) are a natural next step once you want to share
            progress outside the app.
          </p>
        </div>
      </div>
    </main>
  );
}
