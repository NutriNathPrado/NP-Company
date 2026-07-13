import { openaiChat, hasOpenAI } from "@/lib/openai";
import { getAudience, getEdge } from "@/lib/store";

export const runtime = "nodejs";
export const maxDuration = 60;

// 2ª opinião: gpt-4o-mini CRITICA um roteiro (não reescreve). JSON {nota, veredito, fortes, fracos, sugestoes}.
export async function POST(req: Request) {
  if (!hasOpenAI()) return Response.json({ error: "Sem OPENAI_API_KEY — configure pra usar a 2ª opinião.", degraded: true }, { status: 200 });
  const body = (await req.json().catch(() => ({}))) as { roteiro?: string };
  const roteiro = (body.roteiro || "").trim();
  if (!roteiro) return Response.json({ error: "Nada pra avaliar." }, { status: 400 });

  const [audience, edge] = await Promise.all([getAudience(), getEdge()]);
  const SYS = `Você é um CRÍTICO de conteúdo de Instagram para nutrição esportiva feminina. Recebe um roteiro de carrossel e dá uma 2ª OPINIÃO afiada — você SÓ critica, NUNCA reescreve. Avalie contra o público e a voz da marca. Seja específico e honesto. Responda em JSON: {"nota": (0-100), "veredito": "frase curta", "fortes": ["..."], "fracos": ["..."], "sugestoes": ["ações concretas, não reescritas"]}. Português, direto, sem palavrão.

PÚBLICO: ${audience}
VOZ/ARESTA: ${edge}`;
  try {
    const raw = await openaiChat({ model: "gpt-4o-mini", json: true, maxTokens: 900, messages: [
      { role: "system", content: SYS },
      { role: "user", content: `Roteiro:\n\n${roteiro}` },
    ] });
    return Response.json(JSON.parse(raw));
  } catch (e: unknown) {
    return Response.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 });
  }
}
