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

export async function generateCompletion(system: string, prompt: string, maxTokens = 1024): Promise<string> {
  const response = await getClient().messages.create({
    model: process.env.ANTHROPIC_MODEL ?? "claude-sonnet-5",
    max_tokens: maxTokens,
    system,
    // These calls want a direct, concise business text (a bulleted summary, an
    // email, a structured analysis) — not the model's visible reasoning. Left
    // unset, this model thinks adaptively by default and can burn the entire
    // max_tokens budget on a "thinking" block before ever writing the answer.
    thinking: { type: "disabled" },
    messages: [{ role: "user", content: prompt }],
  });

  // A missing or empty text block (e.g. max_tokens hit before any answer, or
  // a non-text stop_reason) must fail loudly rather than silently return ""
  // — an empty success is indistinguishable from a real answer for the caller.
  const block = response.content.find((b) => b.type === "text");
  if (!block || block.type !== "text" || block.text.trim() === "") {
    throw new Error(
      `Réponse sans texte exploitable (stop_reason=${response.stop_reason}, blocks=${response.content.map((b) => b.type).join(",")}).`,
    );
  }
  // A response cut off mid-way by the token budget is just as unusable as an
  // empty one for these structured multi-section answers — better to fail
  // and let the caller retry (or raise maxTokens) than silently hand the
  // user a half-finished analysis.
  if (response.stop_reason === "max_tokens") {
    throw new Error(`Réponse tronquée par la limite de tokens (maxTokens=${maxTokens}).`);
  }
  return block.text;
}

// Le plan Vercel Hobby tue la fonction après 60s sans retour clair côté client.
// On se garde une marge et on s'arrête nous-mêmes avant, pour toujours renvoyer
// soit un texte, soit une erreur explicite plutôt qu'un blocage silencieux.
const WEB_SEARCH_BUDGET_MS = 45_000;

/**
 * Comme generateCompletion, mais autorise le modèle à chercher sur le web (pour
 * un contenu qui doit refléter l'actualité réelle, pas seulement les connaissances
 * figées du modèle). Un tour de recherche volumineux peut s'arrêter en
 * "pause_turn" : on relance alors la conversation jusqu'à la réponse finale, dans
 * la limite du budget de temps ci-dessus.
 */
export async function generateWithWebSearch(system: string, prompt: string): Promise<string> {
  const model = process.env.ANTHROPIC_MODEL ?? "claude-sonnet-5";
  const messages: Anthropic.MessageParam[] = [{ role: "user", content: prompt }];
  const deadline = Date.now() + WEB_SEARCH_BUDGET_MS;

  const call = () =>
    getClient().messages.create(
      {
        model,
        max_tokens: 2048,
        system,
        thinking: { type: "disabled" },
        tools: [{ type: "web_search_20260209", name: "web_search", max_uses: 3 }],
        messages,
      },
      { timeout: Math.max(1_000, deadline - Date.now()) },
    );

  let response = await call();
  while (response.stop_reason === "pause_turn" && Date.now() < deadline) {
    messages.push({ role: "assistant", content: response.content });
    response = await call();
  }

  const block = response.content.find((b) => b.type === "text");
  if (!block || block.type !== "text" || block.text.trim() === "") {
    throw new Error("La recherche web n'a pas abouti à un texte dans le temps imparti.");
  }
  return block.text;
}
