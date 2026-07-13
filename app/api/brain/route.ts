// Painel "Cérebro": ler/editar a régua da marca (público + aresta) e resumir os acervos.
import { getAudience, getEdge, setAudience, setEdge, DEFAULTS, getGold, getGoldStructures, getLearnings, listSources, getBrainModel, setBrainModel, type BrainModel } from "@/lib/store";

export const runtime = "nodejs";

export async function GET() {
  const [audience, edge, model, gold, structs, learnings, sources] = await Promise.all([
    getAudience(), getEdge(), getBrainModel(), getGold(), getGoldStructures(), getLearnings(), listSources(),
  ]);
  const livros = sources.filter((s) => s.kind === "livro");
  return Response.json({
    audience, edge, model,
    defaults: DEFAULTS,
    counts: {
      voz: gold.length,
      estrutura: structs.length,
      livros: livros.length,
      trechos: livros.reduce((a, s) => a + (s.chunks || 0), 0),
      aprendizado: learnings?.n || 0,
      pilares: model.pilares.length,
      temas: model.temas.length,
    },
    livros: livros.map((s) => ({ title: s.title, chunks: s.chunks || 0 })),
  });
}

export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => ({}))) as { audience?: string; edge?: string; model?: BrainModel };
    if (typeof body.audience === "string") await setAudience(body.audience);
    if (typeof body.edge === "string") await setEdge(body.edge);
    const model = body.model ? await setBrainModel(body.model) : undefined;
    return Response.json({ ok: true, model });
  } catch (error) {
    console.error("POST /api/brain", error);
    return Response.json({ error: "Não foi possível salvar a marca. Tente novamente." }, { status: 500 });
  }
}
