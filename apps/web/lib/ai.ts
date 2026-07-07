import type { ChatMessage, HealthScoreBreakdown } from "@health-os/shared";

export interface CoachContext {
  history: ChatMessage[];
  latestMessage: string;
  healthScore: HealthScoreBreakdown | null;
  memoryNotes?: string[];
}

const DEFAULT_TIMEOUT_MS = 20000;
const MAX_HISTORY_MESSAGES = 8;

export async function getCoachReply(ctx: CoachContext): Promise<string> {
  const chain = getProviderChain();
  let reply: string | null = null;
  const trimmedCtx: CoachContext = {
    ...ctx,
    history: ctx.history.slice(-MAX_HISTORY_MESSAGES),
  };

  for (const provider of chain) {
    try {
      reply = await callProvider(provider, trimmedCtx);
      if (reply) break;
    } catch (err) {
      console.error(`AI provider "${provider}" failed, trying next in chain:`, err);
    }
  }

  if (!reply) reply = getFreeRuleBasedReply(trimmedCtx);

  return `${reply}\n\n${buildExplanationFooter(ctx)}`;
}

function getProviderChain(): string[] {
  const explicit = process.env.AI_PROVIDER_CHAIN;
  if (explicit) {
    const chain = explicit
      .split(",")
      .map((p) => p.trim())
      .filter(Boolean);
    if (!chain.includes("free")) chain.push("free");
    return chain;
  }

  const single = process.env.AI_PROVIDER ?? "free";
  return single === "free" ? ["free"] : [single, "free"];
}

async function callProvider(provider: string, ctx: CoachContext): Promise<string | null> {
  switch (provider) {
    case "ollama":
      return getOllamaReply(ctx);
    case "anthropic":
      return getAnthropicReply(ctx);
    case "openai":
      return getOpenAIReply(ctx);
    case "free":
      return getFreeRuleBasedReply(ctx);
    default:
      console.warn(`Unknown AI provider "${provider}" in chain, skipping.`);
      return null;
  }
}

function getTimeoutMs(): number {
  const configured = Number(process.env.AI_TIMEOUT_MS);
  return Number.isFinite(configured) && configured > 0 ? configured : DEFAULT_TIMEOUT_MS;
}

async function fetchWithTimeout(url: string, init: RequestInit): Promise<Response> {
  const controller = new AbortController();
  const timeoutMs = getTimeoutMs();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { ...init, signal: controller.signal });
    return res;
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") {
      throw new Error(`Request timed out after ${timeoutMs}ms`);
    }
    throw err;
  } finally {
    clearTimeout(timeout);
  }
}

function buildExplanationFooter(ctx: CoachContext): string {
  if (!ctx.healthScore) {
    return "Why: no health data logged yet today — once you log vitals or a meal, I can point to exactly what's driving this.";
  }

  const lowest = ctx.healthScore.drivers.reduce((min, d) =>
    d.value < min.value ? d : min
  );
  const hasRealData = lowest.value !== 50;
  const confidence = hasRealData
    ? "Medium (based on today's logged data)"
    : "Low (no data logged for this yet — this is a default estimate)";

  return `Why: your ${lowest.label} score (${Math.round(lowest.value)}/100) is your lowest input right now. Confidence: ${confidence}.`;
}

function getFreeRuleBasedReply(ctx: CoachContext): string {
  const msg = ctx.latestMessage.toLowerCase();

  if (/sleep|tired|exhaust/.test(msg)) {
    return `Sleep is the single biggest lever on your score. Try keeping a consistent wake time, even on weekends — it does more than a fixed bedtime.`;
  }
  if (/eat|food|meal|nutrition|hungry/.test(msg)) {
    return `Log your next meal in the Nutrition tab and I'll factor it in. In general, protein at breakfast tends to reduce cravings later in the day.`;
  }
  if (/workout|exercise|gym|run|train/.test(msg)) {
    return `Even 20-30 minutes of movement counts toward your Activity score. What do you have access to today — gym, home, or just a walk?`;
  }
  if (/stress|anxious|overwhelm/.test(msg)) {
    return `Noted. A 2-minute paced breathing break (4s in, 6s out) measurably lowers stress in the short term. Want a short routine for the rest of today?`;
  }
  if (/motivat|give up|hard|struggl/.test(msg)) {
    return `Consistency beats intensity — one logged day is worth more than a perfect week you never track. What's the smallest version of today's goal you could still hit?`;
  }
  if (/hi|hello|hey/.test(msg)) {
    return `Hey — I'm your health coach. Log some data today and I'll start giving you specific guidance.`;
  }

  return `Got it. Keep logging your sleep, meals, and activity and I'll get sharper at spotting what actually moves your score.`;
}

async function getOllamaReply(ctx: CoachContext): Promise<string> {
  const baseUrl = process.env.OLLAMA_BASE_URL ?? "http://localhost:11434";
  const model = process.env.OLLAMA_MODEL ?? "llama3.1";

  const res = await fetchWithTimeout(`${baseUrl}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model,
      stream: false,
      options: { num_predict: 180 },
      messages: [
        { role: "system", content: buildSystemPrompt(ctx) },
        ...ctx.history.map((m) => ({ role: m.role, content: m.content })),
        { role: "user", content: ctx.latestMessage },
      ],
    }),
  });
  if (!res.ok) throw new Error(`Ollama returned ${res.status}`);
  const data = await res.json();
  const content = data.message?.content;
  if (!content) throw new Error("Ollama returned an empty response");
  return content;
}

async function getAnthropicReply(ctx: CoachContext): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY not configured");

  const res = await fetchWithTimeout("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-5",
      max_tokens: 300,
      system: buildSystemPrompt(ctx),
      messages: [
        ...ctx.history.map((m) => ({ role: m.role, content: m.content })),
        { role: "user", content: ctx.latestMessage },
      ],
    }),
  });
  if (!res.ok) throw new Error(`Anthropic returned ${res.status}`);
  const data = await res.json();
  const text = data.content?.find((c: any) => c.type === "text")?.text;
  if (!text) throw new Error("Anthropic returned an empty response");
  return text;
}

async function getOpenAIReply(ctx: CoachContext): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY not configured");

  const res = await fetchWithTimeout("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      max_tokens: 300,
      messages: [
        { role: "system", content: buildSystemPrompt(ctx) },
        ...ctx.history.map((m) => ({ role: m.role, content: m.content })),
        { role: "user", content: ctx.latestMessage },
      ],
    }),
  });
  if (!res.ok) throw new Error(`OpenAI returned ${res.status}`);
  const data = await res.json();
  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new Error("OpenAI returned an empty response");
  return content;
}

function buildSystemPrompt(ctx: CoachContext): string {
  const scoreLine = ctx.healthScore
    ? `The user's current Health Score is ${ctx.healthScore.score}/100. Today's top priority: ${ctx.healthScore.topPriority}`
    : "The user has no logged health data yet today.";

  const memoryLine =
    ctx.memoryNotes && ctx.memoryNotes.length > 0
      ? `\n\nDurable facts remembered about this user from past conversations:\n${ctx.memoryNotes.map((n) => `- ${n}`).join("\n")}`
      : "";

  return `You are an encouraging, evidence-based health coach inside the Health OS app. Keep replies short (2-4 sentences), specific, and non-judgmental. Never provide medical diagnoses — recommend seeing a doctor for anything symptom-related. ${scoreLine}${memoryLine}`;
}
