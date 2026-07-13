import Anthropic from "@anthropic-ai/sdk";
import { getIgSnapshot, getIgAnalysis, setIgAnalysis, getAudience, getEdge, getBrainModel } from "@/lib/store";
import { igScore } from "@/lib/instagram";

export const runtime = "nodejs";
export const maxDuration = 90;

const MODEL = process.env.ANTHROPIC_LEARN_MODEL || "claude-sonnet-4-6";

export async function GET() {
  return Response.json({ analysis: await getIgAnalysis() });
}

export async function POST() {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return Response.json({ error: "Sem ANTHROPIC_API_KEY." }, { status: 500 });
  const snap = await getIgSnapshot();
  if (!snap || !snap.posts.length) return Response.json({ error: "Atualize os números do Instagram primeiro." }, { status: 400 });

  const [audience, edge, model] = await Promise.all([getAudience(), getEdge(), getBrainModel()]);
  const dataset = [...snap.posts]
    .sort((a, b) => igScore(b) - igScore(a))
    .map((p) => ({
      tipo: p.mediaType,
      gancho: (p.caption || "").split("\n")[0]?.slice(0, 120),
      reach: p.reach, saved: p.saved, shares: p.shares,
      interacoes: p.totalInteractions, views: p.views, likes: p.likes, comentarios: p.comments,
    }));

  const SYS = `Você é a analista de performance de Instagram da Nathalia Prado (nutricionista esportiva, atleta Wellness). Recebe os posts reais dela com métricas da API oficial da Meta e cruza com o CÉREBRO da marca (público, aresta, tese). Faz um DIAGNÓSTICO honesto e acionável: o que está funcionando (reach, salvamento, compartilhamento, interação), o que não está, e o que fazer diferente — sempre coerente com a voz e o público dela. Amostra pequena = hipótese, diga isso. Bullets curtos, direto, português, sem enrolação e sem palavrão.

PÚBLICO: ${audience}

ARESTA/VOZ DA MARCA: ${edge}

GRANDE TESE: ${model.grandeTese}
PILARES: ${model.pilares.join(" | ")}`;

  const anthropic = new Anthropic({ apiKey: key });
  try {
    const res = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 1600,
      system: SYS,
      messages: [{ role: "user", content: `Perfil: @${snap.profile.username}, ${snap.profile.followers} seguidores.\nPosts (ordenados por performance real):\n\n${JSON.stringify(dataset, null, 2)}` }],
    });
    const text = res.content.filter((b): b is Anthropic.TextBlock => b.type === "text").map((b) => b.text).join("").trim();
    const analysis = { updatedAt: new Date().toISOString(), text };
    await setIgAnalysis(analysis);
    return Response.json({ analysis, usage: res.usage });
  } catch (e: unknown) {
    return Response.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 });
  }
}
