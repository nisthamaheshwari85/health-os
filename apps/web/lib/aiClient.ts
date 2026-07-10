export async function callAI(
  systemPrompt: string,
  userPrompt: string,
  maxTokens: number = 600
): Promise<string> {
  const provider = process.env.AI_PROVIDER ?? "free";
  const timeout = Number(process.env.AI_TIMEOUT_MS ?? 20000);

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);

  try {
    if (provider === "ollama") {
      const res = await fetch(`${process.env.OLLAMA_BASE_URL}/api/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          model: process.env.OLLAMA_MODEL ?? "llama3.1",
          prompt: `${systemPrompt}\n\n${userPrompt}`,
          stream: false,
          options: { num_predict: maxTokens },
        }),
      });
      const data = await res.json();
      return data.response as string;
    }

    if (provider === "anthropic") {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": process.env.ANTHROPIC_API_KEY ?? "",
          "anthropic-version": "2023-06-01",
        },
        signal: controller.signal,
        body: JSON.stringify({
          model: "claude-sonnet-5",
          max_tokens: maxTokens,
          system: systemPrompt,
          messages: [{ role: "user", content: userPrompt }],
        }),
      });
      const data = await res.json();
      return data.content?.[0]?.text ?? "";
    }

    // "free" fallback — no AI configured, caller should handle empty string
    return "";
  } finally {
    clearTimeout(timer);
  }
}
