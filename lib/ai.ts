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
