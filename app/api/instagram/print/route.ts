import Anthropic from "@anthropic-ai/sdk";
import { setIgAnalysis, getAudience, getEdge, getBrainModel } from "@/lib/store";

export const runtime = "nodejs";
export const maxDuration = 90;

const MODEL = process.env.ANTHROPIC_LEARN_MODEL || "claude-sonnet-4-6";

type ImgBlock = { type: "image"; source: { type: "base64"; media_type: "image/png" | "image/jpeg" | "image/webp" | "image/gif"; data: string } };

// Plano B: lê prints dos Insights via visão da Claude e gera a análise (sem depender da API da Meta)
export async function POST(req: Request) {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return Response.json({ error: "Sem ANTHROPIC_API_KEY." }, { status: 500 });
  const body = (await req.json().catch(() => ({}))) as { images?: string[] };
  const images = (body.images || []).filter(Boolean).slice(0, 8);
  if (!images.length) return Response.json({ error: "Envie ao menos um print dos Insights." }, { status: 400 });

  const blocks: ImgBlock[] = [];
  for (const dataUrl of images) {
    const m = /^data:(image\/(png|jpeg|webp|gif));base64,(.+)$/.exec(dataUrl);
    if (!m) continue;
    blocks.push({ type: "image", source: { type: "base64", media_type: m[1] as ImgBlock["source"]["media_type"], data: m[3] } });
  }
  if (!blocks.length) return Response.json({ error: "Formato de imagem inválido." }, { status: 400 });

  const [audience, edge, model] = await Promise.all([getAudience(), getEdge(), getBrainModel()]);
  const SYS = `Você lê PRINTS dos Insights do Instagram da Nathalia Prado (nutricionista esportiva, atleta Wellness) e faz um DIAGNÓSTICO honesto e acionável cruzando com o CÉREBRO da marca: o que performa (reach, salvamento, compartilhamento, alcance de não-seguidores), o que não, e o que fazer diferente. Leia os números que aparecerem nas imagens. Amostra pequena = hipótese, diga. Bullets curtos, português, sem palavrão.

PÚBLICO: ${audience}
ARESTA: ${edge}
PILARES: ${model.pilares.join(" | ")}`;

  const anthropic = new Anthropic({ apiKey: key });
  try {
    const res = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 1600,
      system: SYS,
      messages: [{ role: "user", content: [...blocks, { type: "text", text: "Analise estes prints dos meus Insights e me dê o diagnóstico." }] }],
    });
    const text = res.content.filter((b): b is Anthropic.TextBlock => b.type === "text").map((b) => b.text).join("").trim();
    const analysis = { updatedAt: new Date().toISOString(), text };
    await setIgAnalysis(analysis);
    return Response.json({ analysis, usage: res.usage });
  } catch (e: unknown) {
    return Response.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 });
  }
}
