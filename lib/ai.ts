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

/**
 * Comme generateCompletion, mais autorise le modèle à chercher sur le web (pour
 * un contenu qui doit refléter l'actualité réelle, pas seulement les connaissances
 * figées du modèle). Un tour de recherche volumineux peut s'arrêter en
 * "pause_turn" : on relance alors la conversation jusqu'à la réponse finale.
 */
export async function generateWithWebSearch(system: string, prompt: string): Promise<string> {
  const model = process.env.ANTHROPIC_MODEL ?? "claude-sonnet-5";
  const messages: Anthropic.MessageParam[] = [{ role: "user", content: prompt }];

  let response = await getClient().messages.create({
    model,
    max_tokens: 2048,
    system,
    tools: [{ type: "web_search_20260209", name: "web_search", max_uses: 5 }],
    messages,
  });

  while (response.stop_reason === "pause_turn") {
    messages.push({ role: "assistant", content: response.content });
    response = await getClient().messages.create({
      model,
      max_tokens: 2048,
      system,
      tools: [{ type: "web_search_20260209", name: "web_search", max_uses: 5 }],
      messages,
    });
  }

  const block = response.content.find((b) => b.type === "text");
  return block?.type === "text" ? block.text : "";
}
