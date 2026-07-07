"use client";

import { useEffect, useRef, useState } from "react";
import type { ChatMessage } from "@health-os/shared";
import { getSupabaseClient } from "@/lib/supabaseClient";

export function ChatWindow({ initialMessages }: { initialMessages: ChatMessage[] }) {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    const text = input.trim();
    if (!text || sending) return;

    const optimisticUserMsg: ChatMessage = {
      id: `local-${Date.now()}`,
      user_id: "",
      role: "user",
      content: text,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimisticUserMsg]);
    setInput("");
    setSending(true);

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
        body: JSON.stringify({ message: text }),
      });
      const data = await res.json();
      const assistantMsg: ChatMessage = {
        id: `local-${Date.now()}-a`,
        user_id: "",
        role: "assistant",
        content: data.reply ?? "Sorry, something went wrong on my end.",
        created_at: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: `local-${Date.now()}-err`,
          user_id: "",
          role: "assistant",
          content: "I couldn't reach the coach service. Check your connection and try again.",
          created_at: new Date().toISOString(),
        },
      ]);
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="flex flex-col h-[70vh] bg-surface rounded-2xl border border-surface2">
      <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-4">
        {messages.length === 0 && (
          <p className="text-muted text-sm">
            Ask about sleep, nutrition, workouts, or just say how you're feeling today.
          </p>
        )}
        {messages.map((m) => (
          <div
            key={m.id}
            className={`max-w-[80%] px-4 py-3 rounded-2xl text-sm leading-relaxed ${
              m.role === "user"
                ? "self-end bg-vital text-ink"
                : "self-start bg-surface2 text-bone"
            }`}
          >
            {m.content}
          </div>
        ))}
        {sending && (
          <div className="self-start bg-surface2 text-muted px-4 py-3 rounded-2xl text-sm">
            Thinking…
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={handleSend} className="flex gap-3 p-4 border-t border-surface2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Message your coach…"
          className="flex-1 bg-ink border border-surface2 rounded-full px-4 py-2 text-bone placeholder:text-muted focus:border-vital outline-none"
        />
        <button
          type="submit"
          disabled={sending}
          className="bg-vital text-ink font-semibold px-5 py-2 rounded-full hover:opacity-90 transition disabled:opacity-50"
        >
          Send
        </button>
      </form>
    </div>
  );
}
