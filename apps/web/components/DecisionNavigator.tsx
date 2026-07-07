"use client";

import { useState } from "react";
import { getSupabaseClient } from "@/lib/supabaseClient";

export function DecisionNavigator() {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState<string | null>(null);
  const [asking, setAsking] = useState(false);

  async function handleAsk(e: React.FormEvent) {
    e.preventDefault();
    const q = question.trim();
    if (!q || asking) return;
    setAsking(true);
    setAnswer(null);

    try {
      const supabase = getSupabaseClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();

      const res = await fetch("/api/coach", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(session?.access_token
            ? { Authorization: `Bearer ${session.access_token}` }
            : {}),
        },
        body: JSON.stringify({ message: q }),
      });

      if (!res.ok) throw new Error(`Server returned ${res.status}`);
      const data = await res.json();
      setAnswer(data.reply ?? "Couldn't get an answer right now.");
    } catch (err) {
      console.error(err);
      setAnswer("Couldn't reach the coach — check your connection and try again.");
    } finally {
      setAsking(false);
    }
  }

  return (
    <div className="bg-surface rounded-2xl p-6 border border-surface2 flex flex-col gap-4">
      <p className="font-mono text-xs tracking-[0.2em] text-muted uppercase">
        Quick decision
      </p>
      <form onSubmit={handleAsk} className="flex flex-col sm:flex-row gap-3">
        <input
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Should I eat this? Skip today's workout?"
          className="flex-1 bg-ink border border-surface2 rounded-lg px-4 py-3 text-bone placeholder:text-muted focus:border-vital outline-none"
        />
        <button
          type="submit"
          disabled={asking}
          className="bg-vital text-ink font-semibold px-6 py-3 rounded-lg hover:opacity-90 transition disabled:opacity-50"
        >
          {asking ? "Asking…" : "Ask"}
        </button>
      </form>
      {answer && (
        <p className="text-bone text-sm bg-surface2 rounded-lg p-4 leading-relaxed">
          {answer}
        </p>
      )}
    </div>
  );
}
