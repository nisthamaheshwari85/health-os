export interface FoodGuess {
  name: string;
  calories: number | null;
  protein_g: number | null;
  carbs_g: number | null;
  fat_g: number | null;
  note: string;
}

export interface FoodPhotoInput {
  imageBase64: string;
  mimeType: string;
}

const PROMPT = `Look at this food photo and estimate the meal. Respond with ONLY a JSON object, no markdown, no explanation, in exactly this shape:
{"name": "short meal description", "calories": number or null, "protein_g": number or null, "carbs_g": number or null, "fat_g": number or null}
If you can't identify the food, still return your best-guess name and use null for values you're unsure of.`;

export async function analyzeFoodPhoto(input: FoodPhotoInput): Promise<FoodGuess> {
  const provider = process.env.AI_PROVIDER ?? "free";

  switch (provider) {
    case "ollama":
      return analyzeWithOllama(input);
    case "anthropic":
      return analyzeWithAnthropic(input);
    case "openai":
      return analyzeWithOpenAI(input);
    case "free":
    default:
      return freeFallback();
  }
}

function freeFallback(): FoodGuess {
  return {
    name: "New meal (edit details below)",
    calories: null,
    protein_g: null,
    carbs_g: null,
    fat_g: null,
    note: "Automatic photo recognition needs a vision-capable model — the free tier can't see the image. Enable Ollama (free, local) or a paid API in .env.local to get real estimates. Edit the fields yourself for now.",
  };
}

function parseGuess(text: string, fallbackNote: string): FoodGuess {
  try {
    const cleaned = text.replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(cleaned);
    return {
      name: typeof parsed.name === "string" ? parsed.name : "New meal (edit details)",
      calories: typeof parsed.calories === "number" ? parsed.calories : null,
      protein_g: typeof parsed.protein_g === "number" ? parsed.protein_g : null,
      carbs_g: typeof parsed.carbs_g === "number" ? parsed.carbs_g : null,
      fat_g: typeof parsed.fat_g === "number" ? parsed.fat_g : null,
      note: "AI estimate — double-check before saving.",
    };
  } catch (err) {
    console.error("Failed to parse food guess JSON:", err, text);
    return {
      name: "New meal (edit details)",
      calories: null,
      protein_g: null,
      carbs_g: null,
      fat_g: null,
      note: fallbackNote,
    };
  }
}

async function analyzeWithOllama(input: FoodPhotoInput): Promise<FoodGuess> {
  const baseUrl = process.env.OLLAMA_BASE_URL ?? "http://localhost:11434";
  const model = process.env.OLLAMA_VISION_MODEL ?? "llava";

  try {
    const res = await fetch(`${baseUrl}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model,
        stream: false,
        messages: [
          { role: "user", content: PROMPT, images: [input.imageBase64] },
        ],
      }),
    });
    if (!res.ok) throw new Error(`Ollama returned ${res.status}`);
    const data = await res.json();
    return parseGuess(
      data.message?.content ?? "",
      "Couldn't parse the local model's response — edit the fields manually."
    );
  } catch (err) {
    console.error("Ollama vision call failed:", err);
    return {
      ...freeFallback(),
      note: "Couldn't reach Ollama (is it running with a vision model like `ollama pull llava`?). Edit the fields manually for now.",
    };
  }
}

async function analyzeWithAnthropic(input: FoodPhotoInput): Promise<FoodGuess> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return freeFallback();

  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-5",
        max_tokens: 300,
        messages: [
          {
            role: "user",
            content: [
              {
                type: "image",
                source: { type: "base64", media_type: input.mimeType, data: input.imageBase64 },
              },
              { type: "text", text: PROMPT },
            ],
          },
        ],
      }),
    });
    if (!res.ok) throw new Error(`Anthropic returned ${res.status}`);
    const data = await res.json();
    const text = data.content?.find((c: any) => c.type === "text")?.text ?? "";
    return parseGuess(text, "Couldn't parse Claude's response — edit the fields manually.");
  } catch (err) {
    console.error("Anthropic vision call failed:", err);
    return freeFallback();
  }
}

async function analyzeWithOpenAI(input: FoodPhotoInput): Promise<FoodGuess> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return freeFallback();

  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: PROMPT },
              {
                type: "image_url",
                image_url: { url: `data:${input.mimeType};base64,${input.imageBase64}` },
              },
            ],
          },
        ],
      }),
    });
    if (!res.ok) throw new Error(`OpenAI returned ${res.status}`);
    const data = await res.json();
    const text = data.choices?.[0]?.message?.content ?? "";
    return parseGuess(text, "Couldn't parse OpenAI's response — edit the fields manually.");
  } catch (err) {
    console.error("OpenAI vision call failed:", err);
    return freeFallback();
  }
}
