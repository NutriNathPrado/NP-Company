import Anthropic from "@anthropic-ai/sdk";
import { getIgSnapshot, getWinnerLearnings, setWinnerLearnings, getAudience, getEdge, getBrainModel } from "@/lib/store";
import { igScore } from "@/lib/instagram";

export const runtime = "nodejs";
export const maxDuration = 90;

const MODEL = process.env.ANTHROPIC_LEARN_MODEL || "claude-sonnet-4-6";

export async function GET() {
  return Response.json({ learnings: await getWinnerLearnings() });
}

export async function POST() {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return Response.json({ error: "Sem ANTHROPIC_API_KEY." }, { status: 500 });
  const snap = await getIgSnapshot();
  if (!snap || snap.posts.length < 3) return Response.json({ error: "Atualize os números do Instagram (precisa de alguns posts)." }, { status: 400 });

  const ranked = [...snap.posts].sort((a, b) => igScore(b) - igScore(a));
  const slim = (p: (typeof ranked)[number]) => ({
    tipo: p.mediaType,
    gancho: (p.caption || "").split("\n")[0]?.slice(0, 140),
    reach: p.reach, saved: p.saved, shares: p.shares, interacoes: p.totalInteractions, views: p.views,
  });
  const campeoes = ranked.slice(0, 6).map(slim);
  const piores = ranked.slice(-6).map(slim);

  const [audience, edge, model] = await Promise.all([getAudience(), getEdge(), getBrainModel()]);
  const SYS = `Você extrai o PADRÃO do que BOMBA no Instagram da Nathalia Prado (nutricionista esportiva, atleta Wellness), comparando os posts CAMPEÕES com os PIORES (métricas reais da API da Meta). Devolva regras CURTAS e ACIONÁVEIS (bullets) que vão direto pro prompt de geração de conteúdo: que tipo de gancho, tema, formato e ângulo puxam reach/salvamento/compartilhamento. Amostra pequena = hipótese, diga isso. Coerente com a voz e o público dela. Português, direto, sem palavrão.

PÚBLICO: ${audience}
ARESTA: ${edge}
PILARES: ${model.pilares.join(" | ")}`;

  const anthropic = new Anthropic({ apiKey: key });
  try {
    const res = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 1200,
      system: SYS,
      messages: [{ role: "user", content: `CAMPEÕES (melhor performance real):\n${JSON.stringify(campeoes, null, 2)}\n\nPIORES:\n${JSON.stringify(piores, null, 2)}` }],
    });
    const summary = res.content.filter((b): b is Anthropic.TextBlock => b.type === "text").map((b) => b.text).join("").trim();
    const learnings = { updatedAt: new Date().toISOString(), n: snap.posts.length, summary };
    await setWinnerLearnings(learnings);
    return Response.json({ learnings, usage: res.usage });
  } catch (e: unknown) {
    return Response.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 });
  }
}
