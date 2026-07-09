import type { Card, Carousel } from "./types";

export const GENERATION_RULES = `

REGRAS FIXAS DE ESCRITA DA NATH (valem para gancho, roteiro, cards e legenda):

VOZ
- Tom: caloroso, acolhedor, direto e de igual pra igual. Nutricionista que TAMBEM viveu a jornada (saiu do sobrepeso, passou por um emagrecimento e hoje e atleta de fisiculturismo).
- Fala um a um: "voce", "minha filha", "cara". Usa "entendeu?", "ne?", "sabe?" com naturalidade, sem exagerar. Soa como uma amiga mais experiente que cuida, nunca como quem prega ou performa.
- Conta HISTORIA e caso real (de paciente ou da propria vivencia) pra ensinar. E a marca dela.
- Pergunta e responde: joga a pergunta que a leitora se faz e responde com calma.
- Ciencia TRADUZIDA: pode citar grelina, glicogenio, mTOR, catabolismo, composicao corporal, mas SEMPRE aterrissa na consequencia pratica do dia a dia. Ciencia da autoridade, exemplo real faz entender. Nunca jargao pra impressionar.
- Sem julgamento: valida a dor da leitora ANTES de corrigir ("eu nem julgo quem passa por isso"). Cobra com carinho, nunca gera culpa.
- Humor leve quando cabe ("Segunda-feira, dia oficial de comer salada e frango. To errada? Nao to nao").
- Frase natural (pode ser mais fluida que telegrafica); usa "..." pra dar respiro.
- SEM palavrao. SEM coachismo acucarado ("voce consegue", "acredite", "vai dar certo").
- Fecho: acolhimento + convite ("me chama no direct", "clique no link da bio", "nao desista, minha filha, voce vai conseguir").

TELLS DE IA (o detector roda antes de entregar) - corta:
- "nao e A, e B" espelhado. Paralelismo perfeitinho. Toda frase virando punchline.
- NUNCA use travessao (longo ou meio). Troque por virgula, dois pontos, quebra de linha ou frase nova.
- Trocadilho publicitario ou esperto. Exclamacao em excesso.
- Abertura cliche: "todo mundo sabe", "nao e segredo que", "num mundo cada vez mais".
- Motivacao acucarada vazia. Muleta generica: "no fim das contas", "no final do dia", "a verdade e que".
- Correlacao preguicosa: "o corpo e como uma maquina/ponte/carro".
- Confianca de robo: quando for reflexao, soa humana e proxima, nunca redonda demais.

ACOLHIMENTO COM RESPONSABILIDADE (a linha da Nath)
- ERRADO: culpar ou ser dura ("voce nao tem forca de vontade", "o problema e voce") OU vender facilidade ("e so querer", "corta tudo que resolve").
- CERTO: acolher a dificuldade E devolver a saida pratica. Ex: "O problema pode nao ser voce. Talvez o plano que voce tenta seguir seja dificil demais pra sua rotina. Da pra estruturar algo que caiba na sua vida". Valida a dor, mostra o caminho real, cobra constancia com cuidado.

ESTRUTURA COMO FLUXO, SEM ROTULOS
- Gancho -> valida a dor/contexto -> objecao real da leitora -> resposta (comportamento + ciencia traduzida) -> vira a chave -> saida pratica e sustentavel -> acolhimento + CTA.
- Escreve como pensamento que flui. Sem titulos, sem "card 1", sem numerar, sem rotulos de beat.

PARAGRAFO
- Maximo 3 linhas. Se passar, quebra em outro paragrafo.

GANCHOS
A CAPA (card 1) prende sozinha. Estilos que funcionam pra Nath:
1. Pergunta que expoe o padrao: "Por que a sua dieta MORRE na sexta-feira a noite?" / "Por que agora voce tem medo de comer, depois de conseguir emagrecer?"
2. Provocacao com empatia: "Voce faz dieta pra viver melhor ou pra ter medo de viver?"
3. Quebra de crenca: "O maior erro de quem quer emagrecer e achar que precisa emagrecer mais"
4. Lista/promessa concreta: "5 sinais que voce finalmente esta pronta pra ter RESULTADO" / "5 erros de quem quer definir e ganhar massa ao mesmo tempo"
5. Alerta cuidadoso: "Como nutricionista, preciso te alertar 5 coisas"
CAPA FRACA: motivacao generica, dura/julgadora, mais de ~10 palavras, "nao e A, e B" espelhado.

LEGENDA
- No maximo 5 hashtags, as mais fortes pra publico feminino de emagrecimento sustentavel, nutricao, comportamento alimentar, musculacao feminina e consultoria.

FEED: CARROSSEL / REELS / ESTATICO
Feed e CASA, nao praca publica: primeira impressao, posicionamento e prova permanente. Dois testes antes de publicar: (1) sem ler nome ou bio, da pra entender o que a Nathalia faz so pelo feed? (2) esse feed parece diferente da concorrencia ou e mais do mesmo?

OPINIAO e o motor de engajamento real. "Informacao educa. Opiniao cria pertencimento." Tomar posicao clara sobre uma crenca do nicho conecta quem concorda e filtra quem nao e o publico certo. Ex: "Comer menos nao e sinonimo de secar" / "Errar na dieta nao e estragar tudo".

CINCO FONTES DE CONTEUDO (nunca falta pauta):
1. Ciencia aplicada: o que a nutricao e a fisiologia explicam, traduzido pra pratica.
2. Vivencia real: a propria jornada da Nath (de sobrepeso a atleta), rotina, bastidor, prep.
3. Nutricao pratica: substituicoes, organizacao, o que a paciente aplica hoje mesmo.
4. Caso/feedback real de paciente virando pauta, sem alterar o que ela disse.
5. Opiniao clara sobre uma crenca do nicho (restricao, balanca, tudo-ou-nada, medo de comer).

DESDOBRAMENTO: antidoto pra trava criativa:
- Mesmo tema, angulo diferente: "Errar na dieta nao e estragar tudo" -> "Por que voce recomeca toda segunda" -> mesma linha, gancho novo.
- Mesma peca, formato diferente: um conteudo vira reel falado, carrossel, corte com musica, imagem estatica.
Regra pratica: todo conteudo que performar bem vira pelo menos 2 formatos extra antes de descartar o tema.

ALCANCE QUALIFICADO > ALCANCE AMPLO: a metrica que importa e quem responde, comenta e vira aluna, nao quantos viram.`;

const FORBIDDEN_LINE = /(^|\n)[^\n]*(?:n(?:a|ã)o\s+(?:e|é)\s+falta\s+(?:de|do|da|dos|das|disso|daquilo)\b[^\n]*)/giu;
const FORBIDDEN_INLINE = /\bn(?:a|ã)o\s+(?:e|é)\s+falta\s+(?:de|do|da|dos|das)\s+[^,.!?\n]+[,.!?]?/giu;
const HASHTAG = /#[\p{L}\p{N}_]+/gu;

function limitParagraphLines(text: string): string {
  return text
    .split(/\n{2,}/)
    .map((paragraph) => {
      const lines = paragraph.split("\n").map((line) => line.trim()).filter(Boolean);
      if (lines.length <= 3) return lines.join("\n");
      const chunks: string[] = [];
      for (let i = 0; i < lines.length; i += 3) chunks.push(lines.slice(i, i + 3).join("\n"));
      return chunks.join("\n\n");
    })
    .join("\n\n");
}

export function cleanGeneratedText(value?: string): string | undefined {
  if (typeof value !== "string") return value;
  let text = value
    .replace(/\r\n/g, "\n")
    .replace(/[\u2013\u2014]/g, ",")
    .replace(FORBIDDEN_LINE, "$1O método precisa parar de ser aleatório")
    .replace(FORBIDDEN_INLINE, "o método precisa parar de ser aleatório");

  text = text
    .split("\n")
    .map((line) => line.trimEnd().replace(/(?<!\d)\.+$/g, ""))
    .join("\n");

  text = text
    .replace(/(?<!\d)\.\s+(?=[A-ZÁÉÍÓÚÂÊÔÃÕÇ])/g, "\n")
    .replace(/(?<!\d)\.(?=\s*(?:\n|$))/g, "")
    .replace(/[ \t]{2,}/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  return limitParagraphLines(text);
}

export function cleanCaption(value?: string): string | undefined {
  const cleaned = cleanGeneratedText(value);
  if (!cleaned) return cleaned;
  const seen = new Set<string>();
  const tags = (cleaned.match(HASHTAG) || []).filter((tag) => {
    const key = tag.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  }).slice(0, 5);
  const withoutTags = cleanGeneratedText(cleaned.replace(HASHTAG, "").replace(/[ \t]{2,}/g, " ").replace(/\n{3,}/g, "\n\n"));
  return [withoutTags, tags.join(" ")].filter(Boolean).join("\n\n");
}

export function cleanCard(card: Card): Card {
  return {
    ...card,
    kicker: cleanGeneratedText(card.kicker),
    headline: cleanGeneratedText(card.headline),
    body: cleanGeneratedText(card.body),
    signoff: cleanGeneratedText(card.signoff),
    bullets: card.bullets?.map((b) => cleanGeneratedText(b) || "").filter(Boolean),
    stats: card.stats?.map((s) => ({ ...s, label: cleanGeneratedText(s.label) || s.label })),
  };
}

export function cleanCarousel(carousel: Carousel): Carousel {
  return { ...carousel, tema: cleanGeneratedText(carousel.tema) || carousel.tema, cards: carousel.cards.map(cleanCard) };
}
