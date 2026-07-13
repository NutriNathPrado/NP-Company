import { openaiChat, hasOpenAI } from "@/lib/openai";

export const runtime = "nodejs";
export const maxDuration = 60;

const FONTS = ["Anton", "Bebas Neue", "Montserrat", "Montserrat ExtraBlack", "Inter", "Open Sans", "Sequel100Black-75", "Airnt"];

// recebe um pedido de visual em linguagem natural e devolve um PACOTE DE ESTILO (nunca toca no texto)
export async function POST(req: Request) {
  if (!hasOpenAI()) return Response.json({ error: "Sem OPENAI_API_KEY — configure pra redesenhar com IA.", degraded: true }, { status: 200 });
  const body = (await req.json().catch(() => ({}))) as { pedido?: string };
  const pedido = (body.pedido || "").trim();
  if (!pedido) return Response.json({ error: "Descreva como você quer o visual." }, { status: 400 });

  const SYS = `Você é diretor de arte de carrosséis de Instagram. Recebe um pedido de visual em linguagem natural e devolve APENAS um pacote de ESTILO (NUNCA muda o texto). Cores em HEX. Fontes SOMENTE desta lista: ${FONTS.join(", ")}.
Responda em JSON EXATO:
{"cores":{"fundo":"#hex","titulo":"#hex","corpo":"#hex","destaque":"#hex"},"fonteTitulo":"<da lista>","fonteCorpo":"<da lista>","sombra":true|false,"alinhamento":"left|center|right","tint":"#hex ou null","indexStyle":"minimal|bold|serif"}
Escolhas coerentes e legíveis (contraste bom entre texto e fundo). Português.`;
  try {
    const raw = await openaiChat({ model: "gpt-4o-mini", json: true, maxTokens: 500, messages: [
      { role: "system", content: SYS },
      { role: "user", content: pedido },
    ] });
    const style = JSON.parse(raw) as { fonteTitulo?: string; fonteCorpo?: string };
    // valida fontes contra a lista (fallback seguro)
    if (!FONTS.includes(style.fonteTitulo || "")) style.fonteTitulo = "Anton";
    if (!FONTS.includes(style.fonteCorpo || "")) style.fonteCorpo = "Inter";
    return Response.json(style);
  } catch (e: unknown) {
    return Response.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 });
  }
}
