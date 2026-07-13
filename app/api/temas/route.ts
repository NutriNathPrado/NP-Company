import Anthropic from "@anthropic-ai/sdk";
import { getBrainModel, getGoldHooks, sourcesBackground } from "@/lib/store";
import { textOf } from "@/lib/llm";
import { GENERATION_RULES } from "@/lib/generation-rules";

export const runtime = "nodejs";
export const maxDuration = 60;
const MODEL = process.env.ANTHROPIC_WRITE_MODEL || "claude-opus-4-8";

const SYS = `Você é a Nathalia Prado (@nutrinathprado · N² Squad @n2squad), NUTRICIONISTA esportiva, gerando 20 TEMAS para carrosséis de Instagram.

FOCO: você fala principalmente de NUTRIÇÃO, DIETA, RELAÇÃO COM A COMIDA, FOME EMOCIONAL e COMPORTAMENTO alimentar. Treino/musculação você só MENCIONA como apoio (vem da N² Squad, do seu noivo Neto) — NÃO é o foco. NÃO gere temas sobre biomecânica, execução de exercício, "treino x dieta" nem hipertrofia como assunto central. O centro é COMIDA, COMPORTAMENTO e emagrecimento sustentável sem sofrimento.

Para cada tema gere:
- "tema": o briefing do carrossel (1-3 linhas descritivas — vai pra caixa de conteúdo pra gerar o post)
- "hook1", "hook2", "hook3": TRÊS capas fortes (4 a 9 palavras cada), com ângulos DIFERENTES entre si, cada uma socando sozinha. UMA expressão em **asteriscos** por hook.
- "pilar": qual pilar representa (curto: "comportamento" / "relação com a comida" / "fome emocional" / "emagrecimento" / "mentalidade" / "nutrição" / "mitos de dieta" / "saúde da mulher" / "comunidade")

## OS HOOKS — a voz da Nathalia (ACOLHEDORA e firme, NUNCA agressiva)
Estude as CAPAS APROVADAS que vêm na mensagem. Estilos que combinam com ela:
1. Pergunta que expõe o padrão: "Por que sua dieta **morre** na sexta à noite?" / "Você sente **medo** de comer?"
2. Quebra de crença de dieta, com carinho: "Comer menos **não** é comer melhor" / "Você não precisa viver de frango e **salada**"
3. Verdade que acolhe: "Errar uma refeição **não** apaga a semana" / "Fome à noite tem **explicação**"
4. Observação real do consultório: "Muita gente não evolui por comer **de menos**"
5. Convite/reflexão: "E se faltar **estratégia**, não força de vontade?"

PROIBIDO (a Nathalia ODEIA isto — soa IA, agressivo demais, ou não é a verdade dela):
- Drama pessoal do peso: "eu já fui a gorda da foto", "a gorda que emagreceu" e afins — NUNCA. Ela trabalha com comportamento, não com choque nem exposição.
- "a dieta perfeita não existe", "sua dieta perfeita é inútil" — ela não fala assim.
- "o corpo trava", "seu emagrecimento travou", "a pessoa fracassa/trava no emagrecimento" — clichê, não usar.
- "não é fraqueza sua", "o problema não é você" — muito IA, não usar.
- "não é A, é B" espelhado; call-out agressivo ("gente mole", "preguiçoso", "genérica"); palavrão; "treino é mais importante que dieta"; motivação genérica ("você consegue"); mais de 9 palavras.

## FONTES DE TEMAS:
Mine os livros, as fontes da biblioteca (nutrição, comportamento, saúde da mulher), os pilares, o inimigo e a grande tese. Cada tema = um ângulo real com argumento, objeção e resolução. Distribua os 20:
- 6-7 sobre comportamento alimentar, fome emocional e relação com a comida
- 4-5 sobre emagrecimento sustentável e manutenção (sem restrição)
- 3-4 sobre mitos de dieta (carboidrato, "comer pouquinho", detox, jejum)
- 2-3 sobre saúde da mulher / hormônios / ciclo menstrual
- 2-3 de opinião firme (mas acolhedora) sobre uma crença do nicho

Saída: APENAS JSON {"temas": [{"tema": string, "hook1": string, "hook2": string, "hook3": string, "pilar": string}]}. Sem markdown.
REGRAS JSON: escape aspas com \\" ; use \\n pra quebra; sem aspas curvas; sem vírgula sobrando.`;

export async function POST() {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return Response.json({ error: "Sem ANTHROPIC_API_KEY." }, { status: 500 });

  const [brain, hookGold, sourcesBg] = await Promise.all([
    getBrainModel(),
    getGoldHooks(),
    sourcesBackground(5000),
  ]);

  // RAG nos livros — 3 queries cobrindo os temas principais da marca
  let booksBlock = "";
  try {
    const { hasEmbeddings, embed } = await import("@/lib/embed");
    if (hasEmbeddings()) {
      const queries = [
        "treinamento feminino glúteo hipertrofia progressão carga",
        "erros comuns execução exercício mulher estagnação resultado",
        "nutrição composição corporal emagrecimento crenças mitos fitness",
      ];
      const vecs = await embed(queries, "query");
      const { searchBooks } = await import("@/lib/store");
      const arrs = await Promise.all(vecs.map((v) => searchBooks(v, 5)));
      const seen = new Set<string>();
      const hits: string[] = [];
      for (const arr of arrs) for (const h of arr) {
        const k = h.content.slice(0, 60);
        if (!seen.has(k)) { seen.add(k); hits.push(h.content.slice(0, 350)); }
      }
      if (hits.length) booksBlock = `\n\nCONHECIMENTO DOS LIVROS (mine insights, conceitos e erros que podem virar carrossel):\n${hits.map((h) => `• ${h}`).join("\n")}`;
    }
  } catch (e) { console.error("RAG temas", e instanceof Error ? e.message : String(e)); }

  const brandBlock = `GRANDE TESE: ${brain.grandeTese.slice(0, 300)}
INIMIGO CULTURAL: ${brain.inimigo.slice(0, 200)}
PILARES: ${brain.pilares.join(" · ")}
TEMAS QUE A NATHALIA DOMINA: ${brain.temas.join(", ")}`;

  const hookGoldBlock = hookGold.length
    ? `\n\nCAPAS APROVADAS PELA NATHALIA (esse é exatamente o padrão de capa que ele quer):\n${hookGold.map((h) => `✓ ${h.capa}`).join("\n")}`
    : "";

  const sourcesBlock = sourcesBg ? `\n\nFONTES DA BIBLIOTECA:\n${sourcesBg}` : "";

  const userMsg = `${GENERATION_RULES}\n\n${brandBlock}${hookGoldBlock}${sourcesBlock}${booksBlock}\n\nGere 20 temas variados com 2 capas cada. Mine os livros e fontes pra encontrar ângulos que o mercado não explora. Distribua entre os tipos listados. Todos os hooks no padrão agressivo e direto das capas aprovadas.`;

  const anthropic = new Anthropic({ apiKey: key });
  try {
    const res = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 4500,
      system: SYS,
      messages: [{ role: "user", content: userMsg }],
    });

    let text = textOf(res);
    text = text.replace(/```json/gi, "").replace(/```/g, "");
    text = text.slice(text.indexOf("{"), text.lastIndexOf("}") + 1);
    const json = JSON.parse(text) as { temas?: { tema: string; hook1: string; hook2: string; hook3?: string; pilar: string }[] };
    return Response.json({ temas: json.temas || [], usage: res.usage });
  } catch (e: unknown) {
    return Response.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 });
  }
}
