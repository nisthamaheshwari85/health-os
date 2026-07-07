"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getSupabaseClient } from "@/lib/supabaseClient";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const supabase = getSupabaseClient();
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't log in. Try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <h1 className="font-display text-3xl text-bone mb-1">Welcome back</h1>
        <p className="text-muted mb-8">Log in to see today's Health Score.</p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input
            type="email"
            required
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="bg-surface border border-surface2 rounded-lg px-4 py-3 text-bone placeholder:text-muted focus:border-vital outline-none"
          />
          <input
            type="password"
            required
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="bg-surface border border-surface2 rounded-lg px-4 py-3 text-bone placeholder:text-muted focus:border-vital outline-none"
          />
          {error && <p className="text-coral text-sm">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="bg-vital text-ink font-semibold py-3 rounded-full hover:opacity-90 transition disabled:opacity-50"
          >
            {loading ? "Logging in…" : "Log in"}
          </button>
        </form>

        <p className="text-muted text-sm mt-6">
          No account?{" "}
          <Link href="/signup" className="text-vital hover:underline">
            Sign up
          </Link>
        </p>
      </div>
    </main>
  );
}
