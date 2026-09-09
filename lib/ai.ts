import "server-only";
import Anthropic from "@anthropic-ai/sdk";

/**
 * No ANTHROPIC_API_KEY is provisioned in every environment this app runs
 * in (dev, CI, self-hosted). Callers check this first and show a clear
 * "not configured" message instead of letting a request fail.
 */
export function isAiConfigured(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}

let client: Anthropic | undefined;

function getClient(): Anthropic {
  if (!client) {
    client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  }
  return client;
}

export async function generateCompletion(system: string, prompt: string): Promise<string> {
  const response = await getClient().messages.create({
    model: process.env.ANTHROPIC_MODEL ?? "claude-sonnet-5",
    max_tokens: 1024,
    system,
    messages: [{ role: "user", content: prompt }],
  });

  // Extended thinking can put one or more "thinking" blocks before the
  // answer, so content[0] isn't reliably the text block.
  const block = response.content.find((b) => b.type === "text");
  return block?.type === "text" ? block.text : "";
}
