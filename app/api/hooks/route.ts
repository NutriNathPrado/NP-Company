import Anthropic from "@anthropic-ai/sdk";
import { emotionBlock, hookBlock } from "@/lib/frameworks";
import { registroBlock } from "@/lib/vitals";
import { textOf, pickRandom } from "@/lib/llm";
import { cleanGeneratedText, GENERATION_RULES } from "@/lib/generation-rules";
import { detectTells } from "@/lib/tells";

export const runtime = "nodejs";
export const maxDuration = 45;
const WRITE_MODEL = process.env.ANTHROPIC_WRITE_MODEL || "claude-opus-4-8";

const SYS = `Você é a Nathalia Prado (@nutrinathprado · N² Squad @n2squad), NUTRICIONISTA esportiva. Gere 5 GANCHOS pra um ROTEIRO de carrossel. Cada gancho tem DUAS partes:
- "capa": a CHAMADA da capa (card 1). 4 a 9 palavras. SOCA SOZINHA — a leitora lê sem contexto. UMA palavra ou expressão em **rosa** (asteriscos duplos).
- "abertura": a primeira fala do ROTEIRO (2 a 4 linhas) que EXPANDE a capa, na voz da Nathalia.

FOCO: NUTRIÇÃO, DIETA, RELAÇÃO COM A COMIDA, FOME EMOCIONAL, COMPORTAMENTO e emagrecimento sustentável. Treino é só apoio (N² Squad), nunca o centro.

## A CAPA FORTE — a voz da Nathalia (ACOLHEDORA e firme, NUNCA agressiva). Use um destes estilos:
1. Pergunta que expõe o padrão: "Por que sua dieta **morre** na sexta à noite?" / "Você sente **medo** de comer?"
2. Quebra de crença de dieta, com carinho: "Comer menos **não** é comer melhor" / "Você não precisa viver de frango e **salada**"
3. Verdade que acolhe: "Errar uma refeição **não** apaga a semana" / "Fome à noite tem **explicação**"
4. Observação real do consultório: "Muita gente não evolui por comer **de menos**"
5. Convite/reflexão: "E se faltar **estratégia**, não força de vontade?"
(Pode começar com "Por que" ou uma pergunta — combina com ela.)

## CAPA FRACA / PROIBIDO (a Nathalia ODEIA — soa IA, agressivo, ou não é a verdade dela):
- Drama pessoal do peso: "eu já fui a gorda da foto" e afins — NUNCA (ela trabalha comportamento, não choque nem exposição).
- "a dieta perfeita não existe / é inútil"; "o corpo trava"; "seu emagrecimento travou"; "a pessoa fracassa/trava no emagrecimento".
- "não é fraqueza sua"; "o problema não é você" — muito IA.
- "não é A, é B" espelhado; call-out agressivo ("gente mole", "preguiçoso", "genérica"); palavrão; "treino é mais importante que dieta"; motivação genérica ("você consegue"); mais de 9 palavras.

## VOZ
- Acolhedora e firme, de igual pra igual ("minha filha", "cara"). Explica com carinho, sem julgar, sem drama.
- A capa é clara e convida; a abertura acolhe a dor e traz a lógica (comportamento + ciência traduzida).
- Aplica o TIPO DE GANCHO e as EMOÇÕES escolhidas (vêm na mensagem). Varie os 5 ângulos.

Saída: APENAS JSON {"hooks":[{"capa":"...","abertura":"..."}, ...]}. Sem markdown.
REGRAS DE JSON: escape aspas com \" ; use \n pra quebra; sem aspas curvas; sem vírgula sobrando.`;

export async function POST(req: Request) {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return Response.json({ error: "Sem ANTHROPIC_API_KEY." }, { status: 500 });
  const body = (await req.json()) as { content?: string; hook?: string; emotions?: string[]; correlation?: string; registro?: string };
  const content = (body.content || "").trim();
  if (!content) return Response.json({ error: "Manda o conteúdo." }, { status: 400 });

  const emoBlock = emotionBlock(body.emotions || []);
  const hkBlock = hookBlock(body.hook);
  const regBlock = registroBlock(body.registro);
  const correlation = (body.correlation || "").trim().slice(0, 600);
  const corrBlock = correlation ? `\n\nPONTE DE CORRELAÇÃO (a abertura parte deste tema e conecta ao assunto, pelo princípio comum):\n${correlation}` : "";

  const { getGold, getRejects, getGoldHooks } = await import("@/lib/store");
  const [gold, rejects, hookGold] = await Promise.all([getGold(), getRejects("hook"), getGoldHooks()]);
  const goldBlock = gold.length
    ? `\n\nVOZ DA NATHALIA (imite a cadência, não copie):\n${pickRandom(gold, 2).map((g) => g.text).join("\n---\n")}`
    : "";
  // CAPAS APROVADAS — exemplos reais que a Nathalia confirmou como bons ganchos
  const hookGoldBlock = hookGold.length
    ? `\n\nCAPAS QUE A NATHALIA JÁ APROVOU (estude o padrão — brevidade, impacto, zero rodeio):\n${hookGold.map((h) => `✓ ${h.capa}`).join("\n")}`
    : "";
  // ANTI-OURO — ganchos que a Nathalia REJEITOU: não repita esse tipo
  const rejectBlock = rejects.length
    ? `\n\nGANCHOS QUE A NATHALIA JÁ REJEITOU (NÃO gere nada parecido — ele NÃO curtiu esse tipo de capa/abertura/tom):\n${rejects.slice(0, 10).map((r) => `✗ ${r.text}`).join("\n")}`
    : "";

  const userMsg = `${GENERATION_RULES}${regBlock}${hkBlock}${emoBlock}${corrBlock}${goldBlock}${hookGoldBlock}${rejectBlock}\n\nCONTEÚDO:\n${content}`;

  // extrai + repara + parseia (capa/abertura têm texto da Nathalia com aspas — JSON quebra fácil)
  function tryParse(text: string): { capa: string; abertura: string }[] | null {
    let s = text.replace(/```json/gi, "").replace(/```/g, "");
    s = s.slice(s.indexOf("{"), s.lastIndexOf("}") + 1);
    const attempts = [s, s.replace(/[“”„]/g, '\\"').replace(/[‘’]/g, "'"), s.replace(/,\s*([}\]])/g, "$1")];
    for (const a of attempts) {
      try { const j = JSON.parse(a) as { hooks?: { capa: string; abertura: string }[] }; if (Array.isArray(j.hooks)) return j.hooks; } catch {}
    }
    return null;
  }

  const anthropic = new Anthropic({ apiKey: key });
  try {
    let hooks: { capa: string; abertura: string }[] | null = null;
    let lastValidHooks: { capa: string; abertura: string }[] | null = null; // melhor resultado válido mesmo com tells
    let usage: Anthropic.Usage | undefined;
    let lastErr = "";
    let allFailedFromTells = false;
    for (let attempt = 0; attempt < 3 && !hooks; attempt++) {
      const retryNote = attempt === 0
        ? ""
        : lastErr.startsWith("Tells")
          ? `\n\nATENÇÃO: a tentativa anterior foi rejeitada pelo detector de IA: ${lastErr}. Gere opções completamente diferentes, mais humanas e quebradas, sem os vícios apontados.`
          : "\n\nATENÇÃO: o JSON anterior veio quebrado. Gere JSON ESTRITAMENTE VÁLIDO — escape as aspas com \\\", use \\n pra quebra de linha, sem vírgula sobrando, sem aspas curvas.";
      const res = await anthropic.messages.create({
        model: WRITE_MODEL,
        max_tokens: 1400,
        system: SYS,
        messages: [{ role: "user", content: userMsg + retryNote }],
      });
      usage = res.usage;
      const parsed = tryParse(textOf(res));
      if (!parsed) {
        lastErr = "JSON inválido (tentativa " + (attempt + 1) + ")";
        allFailedFromTells = false;
        continue;
      }
      const cleaned = parsed.map((h) => ({ capa: cleanGeneratedText(h.capa) || h.capa, abertura: cleanGeneratedText(h.abertura) || h.abertura }));
      lastValidHooks = cleaned; // salva o melhor resultado parseado
      const tellHits = cleaned.flatMap((h, i) => detectTells(`${h.capa}\n${h.abertura}`).map((tell) => `gancho ${i + 1}: ${tell}`));
      if (tellHits.length) {
        lastErr = "Tells de IA: " + tellHits.slice(0, 6).join(" | ");
        allFailedFromTells = true;
        hooks = null;
      } else {
        hooks = cleaned;
        allFailedFromTells = false;
      }
    }
    // Se todas as tentativas falharam por tells (mas temos JSON válido), entrega com aviso
    // em vez de bloquear totalmente — o usuário decide se usa
    if (!hooks && lastValidHooks && allFailedFromTells) {
      return Response.json({ hooks: lastValidHooks, usage, tells_warning: lastErr });
    }
    if (!hooks) throw new Error("Não consegui gerar os ganchos. Tenta de novo. " + lastErr);
    return Response.json({ hooks, usage });
  } catch (e: unknown) {
    return Response.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 });
  }
}
