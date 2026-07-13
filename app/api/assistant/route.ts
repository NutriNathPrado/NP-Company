import Anthropic from "@anthropic-ai/sdk";
import { getAudience, getEdge, getBrainModel, getGold } from "@/lib/store";

export const runtime = "nodejs";
export const maxDuration = 60;

const MODEL = process.env.ANTHROPIC_MODEL || "claude-sonnet-4-6";

// assistente de resposta de Direct: modos "dm" (venda consultiva) e "parceria"
export async function POST(req: Request) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return Response.json({ error: "Sem ANTHROPIC_API_KEY." }, { status: 500 });
  const body = (await req.json().catch(() => ({}))) as { modo?: string; mensagem?: string; contexto?: string };
  const modo = body.modo === "parceria" ? "parceria" : "dm";
  const mensagem = (body.mensagem || "").trim();
  if (!mensagem) return Response.json({ error: "Cole a mensagem que você recebeu." }, { status: 400 });

  const [audience, edge, model, gold] = await Promise.all([getAudience(), getEdge(), getBrainModel(), getGold()]);
  const voz = gold.slice(0, 3).map((g) => g.text.slice(0, 500)).join("\n---\n");

  const objetivo = modo === "dm"
    ? `É uma DM de possível aluna/cliente. Faça VENDA CONSULTIVA: acolhe, entende a dor, quebra a objeção com verdade (nunca pushy, nunca desesperada), e conduz naturalmente pra consultoria (chamar pra conversar, link na bio, entrar pro time). Nunca prometa milagre.`
    : `É uma conversa de PARCERIA/negócio (marca, permuta, collab). Conduza o negócio na voz dela: cordial e firme, valoriza o trabalho dela, faz as perguntas certas (o que é, prazo, contrapartida) e encaminha com profissionalismo.`;

  const SYS = `Você responde mensagens de Direct NA VOZ da Nathalia Prado (nutricionista esportiva, atleta Wellness) — "durona e acolhedora", de igual pra igual ("minha filha", "cara"), sem coachismo, sem palavrão gratuito. ${objetivo}
Devolva 3 opções com TONS diferentes (ex: acolhedora, direta, descontraída). Responda APENAS JSON: {"opcoes":[{"tom":"...","texto":"..."}]}. Português.

PÚBLICO: ${audience}
VOZ/ARESTA: ${edge}
TESE: ${model.grandeTese}
${voz ? `EXEMPLOS REAIS DA VOZ DELA (imite a cadência):\n${voz}` : ""}`;

  const anthropic = new Anthropic({ apiKey });
  try {
    const res = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 1200,
      system: SYS,
      messages: [{ role: "user", content: `MENSAGEM RECEBIDA:\n${mensagem}${body.contexto ? `\n\nCONTEXTO:\n${body.contexto}` : ""}` }],
    });
    const text = res.content.filter((b): b is Anthropic.TextBlock => b.type === "text").map((b) => b.text).join("").trim();
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    return Response.json(JSON.parse(jsonMatch ? jsonMatch[0] : text));
  } catch (e: unknown) {
    return Response.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 });
  }
}
