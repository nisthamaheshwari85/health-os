"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseClient } from "@/lib/supabaseClient";
import type { ChatMessage } from "@health-os/shared";
import { NavBar } from "@/components/NavBar";
import { ChatWindow } from "@/components/ChatWindow";

export default function CoachPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [messages, setMessages] = useState<ChatMessage[]>([]);

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

      const { data } = await supabase
        .from("chat_messages")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: true })
        .limit(50);

      setMessages(data ?? []);
      setLoading(false);
    }
    load();
  }, [router]);

  return (
    <main className="min-h-screen">
      <NavBar />
      <div className="max-w-3xl mx-auto px-6 py-10">
        <h1 className="font-display text-3xl text-bone mb-1">AI Coach</h1>
        <p className="text-muted mb-8">
          Running on the free tier by default — see README to upgrade the model.
        </p>
        {!loading && <ChatWindow initialMessages={messages} />}
      </div>
    </main>
  );
}
