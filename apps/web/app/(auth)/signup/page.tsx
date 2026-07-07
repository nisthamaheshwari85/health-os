"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getSupabaseClient } from "@/lib/supabaseClient";

export default function SignupPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
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
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: fullName } },
      });
      if (error) throw error;
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't sign up. Try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <h1 className="font-display text-3xl text-bone mb-1">Start your Health Twin</h1>
        <p className="text-muted mb-8">Takes under a minute — no credit card.</p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input
            type="text"
            required
            placeholder="Full name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="bg-surface border border-surface2 rounded-lg px-4 py-3 text-bone placeholder:text-muted focus:border-vital outline-none"
          />
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
            minLength={6}
            placeholder="Password (min 6 characters)"
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
            {loading ? "Creating account…" : "Create account"}
          </button>
        </form>

        <p className="text-muted text-sm mt-6">
          Already have an account?{" "}
          <Link href="/login" className="text-vital hover:underline">
            Log in
          </Link>
        </p>
      </div>
    </main>
  );
}
