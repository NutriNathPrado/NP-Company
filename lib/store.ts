// Armazenamento na nuvem (Supabase). Persiste de verdade e sincroniza PC ↔ celular.
// Tabelas: posts (id, data jsonb, stage, scheduled_at, updated_at) e kv (key, value jsonb).
import { createClient } from "@supabase/supabase-js";
import type { Post } from "./types";
import { AUDIENCE as DEFAULT_AUDIENCE, EDGE as DEFAULT_EDGE } from "./n2squad";
import type { Registro } from "./vitals";

const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL!;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY!;
const sb = createClient(url, key, { auth: { persistSession: false } });

export async function listPosts(): Promise<Post[]> {
  const { data, error } = await sb.from("posts").select("data").order("updated_at", { ascending: false });
  if (error) { console.error("listPosts", error.message); return []; }
  return (data || []).map((r) => r.data as Post);
}

export async function getPost(id: string): Promise<Post | undefined> {
  const { data } = await sb.from("posts").select("data").eq("id", id).maybeSingle();
  return (data?.data as Post) || undefined;
}

export async function upsertPost(post: Post): Promise<Post> {
  const { error } = await sb.from("posts").upsert({
    id: post.id,
    data: post,
    stage: post.stage || "ideia",
    scheduled_at: post.scheduledAt || null,
    updated_at: new Date().toISOString(),
  });
  if (error) console.error("upsertPost", error.message);
  return post;
}

export async function deletePost(id: string): Promise<void> {
  const { error } = await sb.from("posts").delete().eq("id", id);
  if (error) console.error("deletePost", error.message);
}

// indicador simples de desempenho (amadurece com volume): taxa de salvamento
export function savesRate(p: Post): number | null {
  const m = p.metrics;
  if (!m || !m.alcance || !m.salvamentos) return null;
  return m.salvamentos / m.alcance;
}

// ---- Aprendizado (síntese dos padrões validados nos dados) ----
export interface Learnings {
  updatedAt: string;
  n: number;        // nº de posts com métricas analisados
  summary: string;  // regras/padrões acionáveis
  ackAt?: string;   // quando a Nathalia revisou/integrou este aprendizado (recolhe o painel)
}

export async function getLearnings(): Promise<Learnings | null> {
  const { data } = await sb.from("kv").select("value").eq("key", "learnings").maybeSingle();
  return (data?.value as Learnings) || null;
}

export async function setLearnings(l: Learnings): Promise<void> {
  const { error } = await sb.from("kv").upsert({ key: "learnings", value: l });
  if (error) console.error("setLearnings", error.message);
}
// Nathalia revisou e integrou o aprendizado atual → marca QUAL aprendizado (pelo updatedAt) foi integrado.
// (guardar o updatedAt em vez de "agora" evita bug de relógio: integrado = ackAt === updatedAt)
export async function ackLearnings(): Promise<Learnings | null> {
  const cur = await getLearnings();
  if (!cur) return null;
  const updated = { ...cur, ackAt: cur.updatedAt };
  await setLearnings(updated);
  return updated;
}

// ---- VOZ: exemplos-ouro (carrosséis/cards que a Nathalia confirma serem a voz dela) ----
export interface GoldExample { text: string; createdAt: string; note?: string; registro?: string }

export async function getGold(): Promise<GoldExample[]> {
  const { data } = await sb.from("kv").select("value").eq("key", "gold_voice").maybeSingle();
  return (data?.value as GoldExample[]) || [];
}
export async function addGold(text: string, note?: string, registro?: string): Promise<void> {
  const cur = await getGold();
  cur.unshift({ text: text.slice(0, 2800).trim(), createdAt: new Date().toISOString(), note, registro: registro || undefined });
  const { error } = await sb.from("kv").upsert({ key: "gold_voice", value: cur.slice(0, 40) });
  if (error) console.error("addGold", error.message);
}
export async function setGold(arr: GoldExample[]): Promise<void> {
  const { error } = await sb.from("kv").upsert({ key: "gold_voice", value: arr });
  if (error) console.error("setGold", error.message);
}

// ---- GANCHOS-OURO: capas aprovadas pela Nathalia (a IA usa como régua de capa forte) ----
export interface HookGold { capa: string; createdAt: string }
export async function getGoldHooks(): Promise<HookGold[]> {
  const { data } = await sb.from("kv").select("value").eq("key", "gold_hooks").maybeSingle();
  return (data?.value as HookGold[]) || [];
}
export async function addGoldHook(capa: string): Promise<void> {
  const cur = await getGoldHooks();
  const clean = (capa || "").replace(/\*\*/g, "").trim().slice(0, 200);
  if (!clean || cur.some((h) => h.capa === clean)) return; // sem duplicata
  cur.unshift({ capa: clean, createdAt: new Date().toISOString() });
  const { error } = await sb.from("kv").upsert({ key: "gold_hooks", value: cur.slice(0, 80) });
  if (error) console.error("addGoldHook", error.message);
}
export async function deleteGoldHook(createdAt: string): Promise<void> {
  const cur = await getGoldHooks();
  const { error } = await sb.from("kv").upsert({ key: "gold_hooks", value: cur.filter((h) => h.createdAt !== createdAt) });
  if (error) console.error("deleteGoldHook", error.message);
}

// ---- ANTI-OURO: o que a Nathalia REJEITOU (a IA aprende o que NÃO fazer — inverso do ouro) ----
export type RejectKind = "pauta" | "hook" | "voice";
export interface Reject { kind: RejectKind; text: string; registro?: string; createdAt: string }
export async function getRejects(kind?: RejectKind): Promise<Reject[]> {
  const { data } = await sb.from("kv").select("value").eq("key", "rejects").maybeSingle();
  const all = (data?.value as Reject[]) || [];
  return kind ? all.filter((r) => r.kind === kind) : all;
}
export async function addReject(kind: RejectKind, text: string, registro?: string): Promise<void> {
  const { data } = await sb.from("kv").select("value").eq("key", "rejects").maybeSingle();
  const cur = (data?.value as Reject[]) || [];
  cur.unshift({ kind, text: (text || "").slice(0, 600).trim(), registro: registro || undefined, createdAt: new Date().toISOString() });
  const { error } = await sb.from("kv").upsert({ key: "rejects", value: cur.slice(0, 60) });
  if (error) console.error("addReject", error.message);
}
export async function deleteReject(createdAt: string): Promise<void> {
  const { data } = await sb.from("kv").select("value").eq("key", "rejects").maybeSingle();
  const cur = (data?.value as Reject[]) || [];
  const { error } = await sb.from("kv").upsert({ key: "rejects", value: cur.filter((r) => r.createdAt !== createdAt) });
  if (error) console.error("deleteReject", error.message);
}

// ---- STORY POSTS: rascunhos, publicados e base de aprendizado ----
export interface StoryFrame {
  tipo?: string; mostrar?: string; texto?: string; fundo_tipo?: string;
  posicao_texto?: string; sugestao_visual?: string;
  figurinha?: { tipo: string; pergunta?: string; opcoes?: string[] } | null;
  cta?: string | null;
}
export interface StoryPost {
  id: string;
  titulo: string;
  frames: StoryFrame[];
  dica?: string;
  periodo?: string;          // "manha" | "tarde" | "noite" | undefined (avulso)
  createdAt: string;
  updatedAt: string;
  stage: "rascunho" | "publicado" | "arquivado";
  isBase?: boolean;          // salvo como referência de ouro para geração futura
  feedback?: string;         // o que achei deste story depois de postar
  engajamento?: string;      // como performou (livre: "5 DMs", "muita caixinha", etc.)
}

export async function listStoryPosts(): Promise<StoryPost[]> {
  const { data } = await sb.from("kv").select("value").eq("key", "story_posts").maybeSingle();
  return (data?.value as StoryPost[]) || [];
}
export async function upsertStoryPost(post: StoryPost): Promise<StoryPost> {
  const cur = await listStoryPosts();
  const idx = cur.findIndex(p => p.id === post.id);
  if (idx >= 0) cur[idx] = { ...cur[idx], ...post, updatedAt: new Date().toISOString() };
  else cur.unshift({ ...post, updatedAt: new Date().toISOString() });
  const { error } = await sb.from("kv").upsert({ key: "story_posts", value: cur.slice(0, 200) });
  if (error) console.error("upsertStoryPost", error.message);
  return post;
}
export async function deleteStoryPost(id: string): Promise<void> {
  const cur = await listStoryPosts();
  const { error } = await sb.from("kv").upsert({ key: "story_posts", value: cur.filter(p => p.id !== id) });
  if (error) console.error("deleteStoryPost", error.message);
}

// Posts marcados como "base" e com feedback positivo alimentam o aprendizado do gerador
export interface StoryLearnings { updatedAt: string; n: number; summary: string }
export async function getStoryLearnings(): Promise<StoryLearnings | null> {
  const { data } = await sb.from("kv").select("value").eq("key", "story_learnings").maybeSingle();
  return (data?.value as StoryLearnings) || null;
}
export async function setStoryLearnings(l: StoryLearnings): Promise<void> {
  await sb.from("kv").upsert({ key: "story_learnings", value: l });
}

// ---- ESTILO DOS STORIES (referência de estilo/formato que o gerador de stories segue) ----
// Texto livre calibrado pelos prints + arquivo base da Nathalia. Editável na aba Stories.
export async function getStoriesStyle(): Promise<string> {
  const { data } = await sb.from("kv").select("value").eq("key", "stories_style").maybeSingle();
  const v = data?.value as { text?: string } | null;
  return v?.text?.trim() || "";
}
export async function setStoriesStyle(text: string): Promise<void> {
  const { error } = await sb.from("kv").upsert({ key: "stories_style", value: { text: (text || "").slice(0, 8000) } });
  if (error) console.error("setStoriesStyle", error.message);
}

// ---- REELS ----
export type ReelFormato = "falado" | "conversa" | "pov_trend";
export interface ReelIdea {
  id: string;
  titulo: string;
  descricao: string;
  formato: ReelFormato;
  angulo: string;
  dicaGravacao: string;
  tags?: string[];
  createdAt: string;
  updatedAt: string;
  stage: "novo" | "rascunho" | "gravado" | "publicado" | "descartado";
  isBase?: boolean;
  feedback?: string;
  engajamento?: string;
}
export async function listReelIdeas(): Promise<ReelIdea[]> {
  const { data } = await sb.from("kv").select("value").eq("key", "reel_ideas").maybeSingle();
  return (data?.value as ReelIdea[]) || [];
}
export async function upsertReelIdea(idea: ReelIdea): Promise<ReelIdea> {
  return (await batchUpsertReelIdeas([idea]))[0];
}
export async function batchUpsertReelIdeas(ideas: ReelIdea[]): Promise<ReelIdea[]> {
  const now = new Date().toISOString();
  const cur = await listReelIdeas();
  for (const idea of ideas) {
    const idx = cur.findIndex(p => p.id === idea.id);
    if (idx >= 0) cur[idx] = { ...cur[idx], ...idea, updatedAt: now };
    else cur.unshift({ ...idea, updatedAt: now });
  }
  const { error } = await sb.from("kv").upsert({ key: "reel_ideas", value: cur.slice(0, 300) });
  if (error) console.error("batchUpsertReelIdeas", error.message);
  return ideas;
}
export async function deleteReelIdea(id: string): Promise<void> {
  const cur = await listReelIdeas();
  const { error } = await sb.from("kv").upsert({ key: "reel_ideas", value: cur.filter(p => p.id !== id) });
  if (error) console.error("deleteReelIdea", error.message);
}
// ---- TEMAS SALVOS: temas gerados no Criar que a Nathalia guardou pra usar depois ----
export interface SavedTema {
  id: string;
  tema: string;
  hook1?: string;
  hook2?: string;
  pilar?: string;
  createdAt: string;
}
export async function listSavedTemas(): Promise<SavedTema[]> {
  const { data } = await sb.from("kv").select("value").eq("key", "saved_temas").maybeSingle();
  return (data?.value as SavedTema[]) || [];
}
export async function addSavedTema(t: SavedTema): Promise<SavedTema> {
  const cur = await listSavedTemas();
  if (!cur.find(x => x.tema.trim().toLowerCase() === t.tema.trim().toLowerCase())) {
    cur.unshift(t);
  }
  const { error } = await sb.from("kv").upsert({ key: "saved_temas", value: cur.slice(0, 400) });
  if (error) console.error("addSavedTema", error.message);
  return t;
}
export async function deleteSavedTema(id: string): Promise<void> {
  const cur = await listSavedTemas();
  const { error } = await sb.from("kv").upsert({ key: "saved_temas", value: cur.filter(t => t.id !== id) });
  if (error) console.error("deleteSavedTema", error.message);
}

export interface ReelLearnings { updatedAt: string; n: number; summary: string }
export async function getReelLearnings(): Promise<ReelLearnings | null> {
  const { data } = await sb.from("kv").select("value").eq("key", "reel_learnings").maybeSingle();
  return (data?.value as ReelLearnings) || null;
}
export async function setReelLearnings(l: ReelLearnings): Promise<void> {
  await sb.from("kv").upsert({ key: "reel_learnings", value: l });
}

// ---- OURO DE DIAGRAMAÇÃO: carrosséis cujo RITMO de layout a Nathalia aprovou (ensina o fatiador) ----
export interface GoldSlice { pattern: string; tema?: string; createdAt: string }
export async function getGoldSlices(): Promise<GoldSlice[]> {
  const { data } = await sb.from("kv").select("value").eq("key", "gold_slices").maybeSingle();
  return (data?.value as GoldSlice[]) || [];
}
export async function addGoldSlice(pattern: string, tema?: string): Promise<void> {
  const { data } = await sb.from("kv").select("value").eq("key", "gold_slices").maybeSingle();
  const cur = (data?.value as GoldSlice[]) || [];
  cur.unshift({ pattern: (pattern || "").slice(0, 600).trim(), tema: tema || undefined, createdAt: new Date().toISOString() });
  const { error } = await sb.from("kv").upsert({ key: "gold_slices", value: cur.slice(0, 20) });
  if (error) console.error("addGoldSlice", error.message);
}

// ---- ESTRUTURA: arcos/esqueletos validados por métrica (separado de voz e de ciência) ----
export interface GoldStructure { outline: string; hook?: string; emotions?: string[]; tema?: string; score?: number; note?: string; registro?: string; createdAt: string }

export async function getGoldStructures(): Promise<GoldStructure[]> {
  const { data } = await sb.from("kv").select("value").eq("key", "gold_structures").maybeSingle();
  return (data?.value as GoldStructure[]) || [];
}
export async function addGoldStructure(s: Omit<GoldStructure, "createdAt">): Promise<void> {
  const cur = await getGoldStructures();
  cur.unshift({ ...s, outline: (s.outline || "").slice(0, 2000), createdAt: new Date().toISOString() });
  const { error } = await sb.from("kv").upsert({ key: "gold_structures", value: cur.slice(0, 30) });
  if (error) console.error("addGoldStructure", error.message);
}
export async function setGoldStructures(arr: GoldStructure[]): Promise<void> {
  const { error } = await sb.from("kv").upsert({ key: "gold_structures", value: arr });
  if (error) console.error("setGoldStructures", error.message);
}

// ---- RÉGUA DA MARCA editável (público + aresta). Fallback = constantes do código. ----
async function getBrainText(k: string): Promise<string | null> {
  const { data } = await sb.from("kv").select("value").eq("key", k).maybeSingle();
  const v = data?.value as { text?: string } | null;
  return v?.text?.trim() || null;
}
export async function getAudience(): Promise<string> { return (await getBrainText("brain_audience")) || DEFAULT_AUDIENCE; }
export async function getEdge(): Promise<string> { return (await getBrainText("brain_edge")) || DEFAULT_EDGE; }
export async function setAudience(text: string): Promise<void> { await sb.from("kv").upsert({ key: "brain_audience", value: { text } }); }
export async function setEdge(text: string): Promise<void> { await sb.from("kv").upsert({ key: "brain_edge", value: { text } }); }
export const DEFAULTS = { audience: DEFAULT_AUDIENCE, edge: DEFAULT_EDGE };

// ---- MODELO DE MARCA estruturado (Grande Tese, Inimigo, Pilares, Temas) ----
// Ancora pautas e (futuramente, com aval da Nathalia) a geração. NÃO substitui o pipeline de escrita.
export interface BrainModel {
  grandeTese: string;   // a crença central que permeia tudo
  inimigo: string;      // o inimigo cultural que o conteúdo combate
  pilares: string[];    // teses secundárias = pilares de conteúdo
  temas: string[];      // territórios temáticos que a Nathalia domina
  historia: string;     // a HISTÓRIA real da Nathalia — material pra ancorar conteúdo de marca pessoal (não inventar)
}
// HISTÓRIA pessoal real da Nathalia Prado (1ª pessoa). Material pra IA ancorar conteúdo de marca
// pessoal — NUNCA inventar; usar só quando o post pedir história/vivência. Editável na aba Marca.
const DEFAULT_HISTORIA = `1. DE ONDE EU VIM
Minha infância foi confusa. Meus pais se separaram quando eu tinha 3 anos, minha mãe foi ficar com meu padrasto, e eu cresci num triângulo amoroso, com muita briga e muita confusão. Vivia cobrada de todos os lados. Quem neutralizava tudo isso era minha avó, minha maior conexão (ela faleceu em 2022, e foi muito difícil pra mim). Cresci com perguntas que ninguém sabia responder, e encontrei no álcool uma fuga: comecei a beber cedo, aos 14. Meu pai é alcoólatra, tenho essa história na família, e eu tinha tudo pra seguir o mesmo caminho. A comida também era de qualquer jeito. Por muito tempo eu fui o oposto do que um dia eu ia pregar.

2. A NUTRIÇÃO QUE AINDA NÃO FAZIA SENTIDO
Me formei em nutrição em 2015, com só 21 anos. Imatura, ainda uma menina, vivendo de festa e bebida. Não existia essa facilidade de consultoria online, então minha primeira oportunidade foi gerir uma cozinha industrial. Foram 4 anos ali, uma escola dura: aprendi a levar porrada no trabalho, a ter responsabilidade, a impor respeito sendo uma menina de 21 anos no meio de mulheres mais velhas. Fui promovida três vezes. Mas eu não gostava, chegava todo dia cheirando gordura, sem paz, cheia de bolinha no corpo de tanto estresse.

3. OS RECOMEÇOS (NUNCA TIVE MEDO DE RECOMEÇAR)
Cansei e fui tentar outra coisa: prestei FATEC de eventos, porque vivia em festa. Larguei tudo, mas não deu certo. Chorei muito, e aprendi ali que eu nunca tive medo de recomeçar. Voltei pra nutrição, fui pra indústria de alimentos na qualidade, gostei, mas por impulso troquei de novo por uma cozinha. Foram 3 meses horríveis, e foi ali que eu falei: nunca mais. Isso foi no fim de 2020, emendou na pandemia: desempregada, bebendo mais, muito triste, de volta à terapia, me perguntando o que eu ia fazer da vida.

4. A MUSCULAÇÃO QUE MUDOU TUDO
Consegui um emprego de vendas numa empresa de TI, home office, e a terapia foi me equilibrando. Comecei a treinar musculação por volta de 2019/2020, depois de terminar um relacionamento de quase 6 anos. Eu não sabia treinar. Foi quando conheci o Neto, treinador na academia e hoje meu noivo. Pedi pra ele montar meu treino, e ali começou minha história de verdade com a musculação: todo dia eu me sentia desafiada. Sem perceber, foi a musculação que me reaproximou da nutrição.

5. O EMAGRECIMENTO QUE ME DEVOLVEU A IDENTIDADE
Depois de quase dois anos treinando, senti necessidade de fazer dieta. Contratei um nutricionista (o Gabriel, que virou meu coach), fiz um cutting e emagreci: saí de 26-27% de gordura pra 13% em 8 meses, só na dedicação: musculação, dieta, aeróbico, sono e gestão de estresse. Junto com a terapia (foram uns 10 anos entre idas e vindas), fui desfazendo os nós das minhas emoções. Nesse processo saí da casa dos meus pais e fui morar sozinha numa kitnet em São Paulo. Foi ali que percebi: eu estava voltando pra nutrição através da minha própria vida, só que muito mais madura.

6. A ATLETA E A NUTRICIONISTA QUE SOU HOJE
Como eu já tinha massa muscular dos treinos, eu, o Neto e o Gabriel decidimos que eu ia competir. Entrei no fisiculturismo, categoria Wellness. Voltei a atuar como nutricionista em 2023, com consultório online, e voltei pra Jundiaí, onde trabalho num centro de treinamento até hoje. Hoje faço nutrição há 3 anos como meu ganha-pão, estou terminando a pós em emagrecimento e metabolismo, competindo todo ano com vários títulos amadores e indo pro ProCard. Tenho cerca de 50 pacientes ativas e fiéis, e uma comunidade que construo com carinho (fiz até um evento com elas, o "Efeito Espelho: você se torna o que está ao seu redor"). Levei 10 anos e muita terapia pra chegar nessa clareza. Por isso digo que minha história com a nutrição é bonita: eu precisei viver inteiramente o que prego pra ter autoridade de verdade. E é isso que levo pra cada paciente: dá pra mudar de estilo de vida e construir uma nova identidade, com método, comportamento e acolhimento.`;
export const DEFAULT_MODEL: BrainModel = {
  grandeTese: "Existe uma grande diferença entre PERDER PESO e construir um corpo que você realmente goste — e a maioria das mulheres nunca descobre isso porque passou a vida presa na restrição, na neura da balança e na mentalidade do 'tudo ou nada'. O que trava não é falta de força de vontade: é falta de estrutura, de rotina e de uma relação saudável com a comida. Quando a mulher entende que ESTRUTURA VENCE A PERFEIÇÃO, que carboidrato é combustível, que a musculação muda a composição corporal e que o comportamento e a emoção fazem parte do processo, ela emagrece e mantém SEM sofrer — com autonomia e paz com a comida. Resultado sustentável não vem de dieta da moda nem de comer cada vez menos; vem de constância adaptada à vida real, treino com progressão e acolhimento.",
  inimigo: "A mentalidade de escassez e tudo que a alimenta: dieta restritiva e detox milagroso, jejuns e 'comer cada vez menos', cortar carboidrato, ficar horas sem comer, a neura da balança como único termômetro, a mentalidade 'tudo ou nada' que faz desistir por um deslize, o 'começo na segunda-feira', a culpa depois de comer, o medo de comer depois de emagrecer, a promessa do próximo suplemento milagroso, e a dieta genérica no papel que ignora a rotina, o comportamento e o acolhimento da mulher. O inimigo não é a comida nem a viagem nem o evento: é a falta de estrutura e a mentalidade de privação.",
  historia: DEFAULT_HISTORIA,
  pilares: [
    "COMPORTAMENTO é a base de tudo: ambiente, previsibilidade e organização sustentam qualquer dieta.",
    "Emagrecimento sustentável: constância flexível vence a dieta perfeita (estrutura vence a perfeição).",
    "Relação saudável com a comida: sem culpa, sem 'tudo ou nada'.",
    "Fome emocional: comer por ansiedade faz parte, e se resolve com estratégia e reflexão, não com punição.",
    "Musculação é inegociável (treino do N² Squad, do meu noivo Neto): muda a composição — o espelho conta mais que a balança.",
    "Carboidrato é combustível do treino, não vilão.",
    "Manutenção: emagrecer é metade; manter sem medo de comer é a outra.",
    "Mentalidade e mindset: eu vivo os extremos, então falo muito de cabeça, identidade e ambiente ('você se torna o que está ao seu redor').",
    "Saúde da mulher no geral: hormônios, ciclo menstrual, LPF, bem-estar.",
    "Minha vivência real: de sobrepeso a atleta Wellness, com 10 anos de terapia e vários recomeços.",
    "Acolhimento + verdade que puxa a orelha (durona e acolhedora), e comunidade de mulheres (N² Squad) — uma apoia a outra.",
    "Opinião clara como combustível de comunidade — posição firme cria pertencimento.",
    "Frequência e desdobramento — uma ideia vira vários formatos; aparecer todo dia supera viralizar uma vez.",
    "Alcance qualificado acima de alcance amplo — atingir as pessoas certas vale mais que muitas.",
  ],
  temas: [
    "Comportamento alimentar, ambiente e organização",
    "Emagrecimento sustentável e manutenção de peso",
    "Relação com a comida, fome emocional e culpa",
    "Mentalidade, mindset e construção de identidade",
    "Musculação, composição corporal e estética feminina",
    "Saúde da mulher (hormônios, ciclo menstrual, LPF)",
    "Medo de comer e de carboidrato depois de emagrecer",
    "Nutrição que cabe na rotina (previsibilidade, substituições)",
    "Bastidores de atleta Wellness e história pessoal",
  ],
};
export async function getBrainModel(): Promise<BrainModel> {
  const { data } = await sb.from("kv").select("value").eq("key", "brain_model").maybeSingle();
  const v = data?.value as Partial<BrainModel> | null;
  if (!v) return DEFAULT_MODEL;
  return {
    grandeTese: v.grandeTese?.trim() || DEFAULT_MODEL.grandeTese,
    inimigo: v.inimigo?.trim() || DEFAULT_MODEL.inimigo,
    pilares: Array.isArray(v.pilares) && v.pilares.length ? v.pilares : DEFAULT_MODEL.pilares,
    temas: Array.isArray(v.temas) && v.temas.length ? v.temas : DEFAULT_MODEL.temas,
    historia: v.historia?.trim() || DEFAULT_MODEL.historia,
  };
}
// ---- PLANO DA SEMANA (diretriz proativa: qual registro em cada dia) ----
export type WeekPlan = (Registro | "")[]; // 7 posições, índice = Date.getDay() (0=domingo)
export const DEFAULT_WEEK: WeekPlan = ["convocacao", "porrada", "", "ferida", "", "ensino", ""];
export async function getWeekPlan(): Promise<WeekPlan> {
  const { data } = await sb.from("kv").select("value").eq("key", "week_plan").maybeSingle();
  const v = data?.value as WeekPlan | null;
  return Array.isArray(v) && v.length === 7 ? v : DEFAULT_WEEK;
}
export async function setWeekPlan(plan: WeekPlan): Promise<void> {
  const clean = Array.from({ length: 7 }, (_, i) => (plan[i] || "")) as WeekPlan;
  const { error } = await sb.from("kv").upsert({ key: "week_plan", value: clean });
  if (error) console.error("setWeekPlan", error.message);
}

export async function setBrainModel(m: BrainModel): Promise<void> {
  const clean: BrainModel = {
    grandeTese: (m.grandeTese || "").trim(),
    inimigo: (m.inimigo || "").trim(),
    pilares: (m.pilares || []).map((p) => p.trim()).filter(Boolean).slice(0, 30),
    temas: (m.temas || []).map((t) => t.trim()).filter(Boolean).slice(0, 30),
    historia: (m.historia || "").trim().slice(0, 8000),
  };
  const { error } = await sb.from("kv").upsert({ key: "brain_model", value: clean });
  if (error) console.error("setBrainModel", error.message);
}

// ---- GUARDA DE FRESCOR: o que já foi usado (pontes/figuras), pra não repetir ----
export interface FreshItem { label: string; date: string }
export async function getFreshness(): Promise<FreshItem[]> {
  const { data } = await sb.from("kv").select("value").eq("key", "freshness").maybeSingle();
  return (data?.value as FreshItem[]) || [];
}
export async function addFreshness(label: string): Promise<void> {
  const l = (label || "").trim().slice(0, 90);
  if (!l) return;
  const cur = await getFreshness();
  cur.unshift({ label: l, date: new Date().toISOString() });
  await sb.from("kv").upsert({ key: "freshness", value: cur.slice(0, 50) });
}
export async function recentFreshLabels(days = 30): Promise<string[]> {
  const cutoff = Date.now() - days * 86400000;
  return (await getFreshness()).filter((f) => new Date(f.date).getTime() > cutoff).map((f) => f.label);
}

// ---- FONTES (base de conhecimento — PDFs/artigos pra embasar o conteúdo) ----
export interface Source {
  id: string;
  title: string;
  kind?: string;        // pdf | texto | url
  url?: string;
  content: string;      // texto extraído
  tags?: string;
  createdAt?: string;
}

// lista sem o texto completo (payload leve pra UI). Pros livros, conta os trechos indexados.
export async function listSources(): Promise<(Omit<Source, "content"> & { chars: number; chunks?: number })[]> {
  const { data, error } = await sb.from("sources").select("id,title,kind,url,tags,created_at,content").order("created_at", { ascending: false });
  if (error || !data) { if (error) console.error("listSources", error.message); return []; }
  // conta os trechos dos livros EM PARALELO (antes era um await por livro, em série — N+1 sequencial)
  const counts = await Promise.all(
    data.map(async (r) =>
      r.kind === "livro"
        ? (await sb.from("book_chunks").select("id", { count: "exact", head: true }).eq("source_id", r.id)).count || 0
        : undefined
    )
  );
  return data.map((r, i) => ({ id: r.id, title: r.title, kind: r.kind, url: r.url, tags: r.tags, createdAt: r.created_at, chars: (r.content || "").length, chunks: counts[i] }));
}

export async function getSourcesByIds(ids: string[]): Promise<Source[]> {
  if (!ids.length) return [];
  const { data } = await sb.from("sources").select("id,title,kind,url,content,tags,created_at").in("id", ids);
  return (data || []).map((r) => ({ ...r, createdAt: r.created_at })) as Source[];
}

export async function upsertSource(s: Source): Promise<Source> {
  const excerpt = (s.content || "").replace(/\s+/g, " ").trim().slice(0, 1500);
  const { error } = await sb.from("sources").upsert({
    id: s.id, title: s.title, kind: s.kind || "texto", url: s.url || null,
    content: s.content, excerpt, tags: s.tags || null, created_at: s.createdAt || new Date().toISOString(),
  });
  if (error) console.error("upsertSource", error.message);
  return s;
}

export async function deleteSource(id: string): Promise<void> {
  const { error } = await sb.from("sources").delete().eq("id", id);
  if (error) console.error("deleteSource", error.message);
}

// Busca semântica nos livros indexados (RAG) — retorna os trechos mais relevantes ao tema.
export async function searchBooks(queryEmbedding: number[], k = 10): Promise<{ content: string }[]> {
  const { data, error } = await sb.rpc("match_book_chunks", { query_embedding: queryEmbedding, match_count: k });
  if (error) { console.error("searchBooks", error.message); return []; }
  return (data || []) as { content: string }[];
}

// Conhecimento de fundo: recortes de TODAS as fontes da biblioteca (sempre injetado na geração).
export async function sourcesBackground(totalBudget = 8000): Promise<string> {
  // exclui os livros já indexados (kind=livro) — eles entram pela busca por trecho (RAG), não pelo "fundo"
  const { data, error } = await sb.from("sources").select("title,excerpt,content").neq("kind", "livro").order("created_at", { ascending: false });
  if (error || !data?.length) return "";
  const parts: string[] = [];
  let budget = totalBudget;
  for (const r of data) {
    if (budget <= 0) break;
    const txt = (r.excerpt || r.content || "").slice(0, Math.min(1500, budget));
    if (!txt) continue;
    parts.push(`• ${r.title}: ${txt}`);
    budget -= txt.length;
  }
  return parts.join("\n");
}
