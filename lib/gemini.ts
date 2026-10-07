const GEMINI_MODELS = (
  process.env.GEMINI_MODEL ?? "gemini-3.5-flash-lite,gemini-3.1-flash-lite"
)
  .split(",")
  .map((model) => model.trim())
  .filter(Boolean);

export const GEMINI_MODEL = GEMINI_MODELS[0];

const REQUEST_TIMEOUT_MS = 20000;

type CallGeminiInput = {
  prompt: string;
  imageBase64: string;
  mimeType: string;
};

async function callModel(
  model: string,
  apiKey: string,
  { prompt, imageBase64, mimeType }: CallGeminiInput
): Promise<string> {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey,
      },
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: prompt },
              { inlineData: { mimeType, data: imageBase64 } },
            ],
          },
        ],
        generationConfig: {
          temperature: 1.0,
          responseMimeType: "application/json",
          responseSchema: {
            type: "OBJECT",
            properties: {
              description: { type: "STRING" },
              drafts: { type: "ARRAY", items: { type: "STRING" } },
              captions: { type: "ARRAY", items: { type: "STRING" } },
            },
            required: ["description", "drafts", "captions"],
            propertyOrdering: ["description", "drafts", "captions"],
          },
        },
      }),
    }
  );

  if (!response.ok) {
    throw new Error(
      `Gemini error ${response.status} (${model}): ${await response.text()}`
    );
  }

  const json = await response.json();
  const text: string | undefined =
    json.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!text) {
    throw new Error(
      `Gemini returned no text (${model}): ${JSON.stringify(json).slice(0, 500)}`
    );
  }

  return text;
}

export async function callGemini(
  input: CallGeminiInput
): Promise<{ text: string; model: string }> {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not set");
  }

  let lastError: unknown = new Error("No Gemini model configured");

  for (const model of GEMINI_MODELS) {
    try {
      return { text: await callModel(model, apiKey, input), model };
    } catch (error) {
      console.error(error);
      lastError = error;
    }
  }

  throw lastError;
}

export function parseCaptionResponse(raw: string): {
  description: string;
  captions: string[];
} {
  const parsed = JSON.parse(raw);

  const description =
    typeof parsed.description === "string" ? parsed.description.trim() : "";

  const captions: string[] = Array.isArray(parsed.captions)
    ? parsed.captions
        .filter((item: unknown): item is string => typeof item === "string")
        .map((caption: string) => caption.trim())
        .filter((caption: string) => caption.length > 0 && caption.length <= 300)
        .slice(0, 3)
    : [];

  if (captions.length === 0) {
    throw new Error("Gemini response had no usable captions");
  }

  return { description, captions };
}
