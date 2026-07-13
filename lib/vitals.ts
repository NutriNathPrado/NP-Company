// SINAIS VITAIS — o organismo vivo da marca. Tudo num lugar só (sem feature espalhada).
// Cada post carrega UM registro. Daí saem: A Dose (divisão do mês) e o alarme de desequilíbrio.
//
// NOMES INTERNOS x RÓTULOS: as chaves (ferida/porrada/ensino/convocacao) são IDs antigos mantidos
// pra não quebrar posts/planos já salvos. O que a marca mostra são os LABELS novos:
//   ferida → 🎯 Diagnóstico · porrada → 🤍 Real com Carinho · ensino → 🧠 Clareza
//   convocacao → 💌 Convite · dominio → 🌿 Autoridade · darkside → 💪 Firmeza (camada)

export type Registro = "porrada" | "ferida" | "ensino" | "convocacao" | "dominio" | "darkside";

export interface RegInfo {
  id: Registro;
  label: string;
  emoji: string;
  color: string;   // cor do registro nas barras/pontos
  target: number;  // proporção-alvo (a "dieta de manutenção" da marca) — os 5 de distribuição somam 1
  o_que: string;   // o que é, em uma linha
  layer?: boolean; // camada transversal (Darkside): selecionável como tom, mas FORA da conta da Dose
}

// A régua da marca. Os 5 de distribuição somam 100% (30/25/20/15/10). Darkside é camada (não entra na conta).
export const REGISTROS: RegInfo[] = [
  { id: "ferida",     label: "Diagnóstico",     emoji: "🎯", color: "#c77dad", target: 0.30, o_que: "acolhe a dor e mostra a raiz real do problema que ela ainda não viu" },
  { id: "porrada",    label: "Real com Carinho", emoji: "🤍", color: "#F01E79", target: 0.25, o_que: "desfaz o mito do mercado (dieta da moda, restrição, atalho) sem agredir a leitora" },
  { id: "dominio",    label: "Autoridade",      emoji: "🌿", color: "#b98bd9", target: 0.20, o_que: "mostra vivência e experiência de consultório — enxerga o detalhe, com humildade" },
  { id: "ensino",     label: "Clareza",         emoji: "🧠", color: "#3e7cc4", target: 0.15, o_que: "faz enxergar o mecanismo: diagnóstico, causa, consequência, direção prática" },
  { id: "convocacao", label: "Convite",         emoji: "💌", color: "#e0a458", target: 0.10, o_que: "convida a assumir o processo e uma nova identidade, com acolhimento" },
  { id: "darkside",   label: "Firmeza",         emoji: "💪", color: "#8a8a96", target: 0,    o_que: "a nutri que puxa a orelha: fala a verdade que precisa, mas com cuidado, nunca brutal", layer: true },
];

export const REG_MAP: Record<Registro, RegInfo> = Object.fromEntries(REGISTROS.map((r) => [r.id, r])) as Record<Registro, RegInfo>;

// só os registros que entram na divisão do mês (Darkside fica de fora — é camada, não fatia)
const DIST: RegInfo[] = REGISTROS.filter((r) => !r.layer);
const DIST_IDS = new Set(DIST.map((r) => r.id));

// notas curtas quando passa/falta — na voz da Nathalia, sem jargão de academia
const NOTA_ALTO: Record<Registro, string> = {
  porrada: "demais — cansa de tanto desmentir",
  ferida: "demais — só dor, sem direção",
  dominio: "demais — virou vitrine",
  ensino: "demais — virou aula",
  convocacao: "demais — convidando demais",
  darkside: "—",
};
const NOTA_BAIXO: Record<Registro, string> = {
  porrada: "de menos — falta desfazer os mitos",
  ferida: "de menos — ninguém se viu no espelho",
  dominio: "de menos — falta mostrar vivência",
  ensino: "de menos — falta clareza",
  convocacao: "de menos — não convida",
  darkside: "—",
};

// O TOM que cada registro impõe ao roteiro inteiro — ANCORADO na voz real da Nathalia Prado (Nath Prado Nutricionista · N² Squad).
// É POSTURA e SUBSTÂNCIA, não cadência: a cadência manda nos exemplos "⭐ minha voz". Não brigue com o ritmo dela.
// Definições estruturais (essência / verdade central / linguagem / o que fala / o que nunca fala / sensação) vêm da marca.
const TOM: Record<Registro, string> = {
  ferida:
    "Registro DIAGNÓSTICO — o texto não consola, DIAGNOSTICA com carinho. A leitora está cansada de tentar e não entender por que continua sem resultado; ela não precisa de motivação, precisa de alguém que enxergue e explique o que está acontecendo de verdade. O objetivo é IDENTIFICAÇÃO. Antes de tudo, VALIDA A DOR (nunca a desculpa): a dor é real, mas o motivo quase nunca é o que ela acredita — quase sempre é comportamento, ambiente e falta de estratégia na alimentação, não força de vontade. Linguagem acolhedora, calma e firme, de igual pra igual ('minha filha', 'cara'). Fala 'eu vejo isso todo dia no consultório', 'tem um motivo pra isso acontecer', 'você não está sozinha nisso'. NUNCA 'você consegue', 'vai dar certo', 'confie no processo', nem 'a culpa não é sua'/'não é fraqueza sua' (clichê de IA). Empatia de quem já viveu a jornada (ela saiu do sobrepeso). Sensação: 'era exatamente isso que estava acontecendo comigo'.",
  porrada:
    "Registro REAL COM CARINHO — existe um culpado, e quase nunca é a pessoa: é o mercado, a informação ruim, a dieta da moda, a restrição e o jejum vendidos como solução, a promessa de emagrecer rápido. Desfaz esse mito com FIRMEZA e clareza, mas SEM agredir nem humilhar — a mulher foi enganada, não é preguiçosa nem burra. Fala 'ninguém te explicou isso direito', 'o mercado vende restrição e chama de saúde', 'dieta de fome não é dieta'. Verdade central: a pessoa continua travada porque acreditou na explicação errada sobre comida. NUNCA humilha, NUNCA usa 'preguiçosa'/'gente mole'/palavrão, NUNCA 'a culpa não é sua'/'não é fraqueza sua', NUNCA 'a dieta perfeita não existe'. Devolve a responsabilidade DEPOIS de mostrar o caminho, com acolhimento. Sensação: 'faz sentido, eu tinha sido enganada'.",
  dominio:
    "Registro AUTORIDADE — mostra experiência real e profundidade, com HUMILDADE. Não é arrogância nem superioridade: é a nutricionista e atleta que vive o que ensina e enxerga o detalhe que a maioria ignora. Antes de tudo, OBSERVAÇÃO do consultório e da própria vivência. Fala 'quando eu acompanho uma paciente, olho isso primeiro', 'quase ninguém percebe esse detalhe', 'aprendi isso na prática e na minha própria pele'. NUNCA 'eu sou referência', 'eu sou a melhor', 'confia em mim' — a autoridade é PERCEBIDA, nunca declarada, e jamais por cima da leitora. Ancora em caso real (sem expor ninguém) e em ciência traduzida pro dia a dia. Sensação: 'ela entende de verdade, e me entende'.",
  ensino:
    "Registro CLAREZA — não ensina pra parecer inteligente, ensina pra gerar CLAREZA: faz a pessoa enxergar o MECANISMO por trás do comportamento e da nutrição. Antes de tudo, DIAGNÓSTICO. Estrutura: diagnóstico → causa → consequência → direção prática. Linguagem simples, acolhedora e prática. Fala 'o erro está aqui', 'é por isso que acontece', 'na prática funciona assim'. NUNCA 'segundo os estudos', 'metanálises mostram' — a ciência SUSTENTA, não lidera; traduz grelina, glicogênio, mTOR e hormônios pra consequência do dia a dia. O ser humano antes do protocolo, nunca infantilizado. Sensação: 'agora tudo faz sentido'.",
  convocacao:
    "Registro CONVITE — não pressiona nem vende: CONVIDA a assumir o processo e uma nova identidade, com acolhimento. Antes de tudo, um COMPROMISSO gentil. Verdade central: resultado sustentável pede constância e estratégia, e vale a pena. Linguagem calorosa e firme, que chama quem quer construir de verdade sem afastar com dureza. Fala 'bora, minha filha', 'se você quer isso, a gente constrói junto', 'me chama que eu te ajudo', 'link na bio'. NUNCA 'últimas vagas', 'corre', 'não perca', escassez falsa, nem 'escolha um lado'. O pacto: ela merece o resultado; a Nathalia mostra o caminho e ACOMPANHA de perto, a leitora dá os passos. Sensação: 'eu quero fazer parte disso'.",
  darkside:
    "Camada FIRMEZA — quando o conteúdo precisa de mais firmeza (a nutri que 'puxa a orelha'), mas SEMPRE com cuidado, nunca brutal nem frio. (1) Fala a verdade que a pessoa evita encarar, com carinho: 'você consome mais conteúdo do que aplica no seu dia'. (2) Não passa pano pro erro, mas acolhe: cobra comportamento e constância sem humilhar. (3) Autoridade de quem já acompanhou muitas mulheres e viveu a jornada. (4) SEM 'aço', SEM 'clareza brutal', SEM frieza — a força vem da verdade dita com afeto. (5) Frases diretas, mas quentes. Sensação: 'ela me cobrou, mas senti que é por mim'.",
};

// REGRA GLOBAL DA MARCA — DESMASCARAMENTO. Vale pra TODO post, com ou sem registro escolhido.
const REGRA_GLOBAL =
  "REGRA GLOBAL DA MARCA — DESMASCARAMENTO. Todo conteúdo responde a duas perguntas: (1) o que a audiência ACREDITA ser o problema? (2) o que REALMENTE é o problema? Ex.: ela acredita 'meu glúteo não cresce porque não tenho genética' → realidade 'seu glúteo não cresce porque nunca recebeu sobrecarga suficiente'. Ela acredita 'meu problema é motivação' → realidade 'seu problema é falta de estrutura'. A função da marca é desmascarar a falsa explicação e revelar a causa real do problema.";

export function registroBlock(id?: Registro | string | null): string {
  const r = id && id in TOM ? (id as Registro) : null;
  const head = r
    ? `\n\nREGISTRO / TOM DO POST (sua escolha — o roteiro INTEIRO vive neste tom). Isto define a POSTURA e a SUBSTÂNCIA; a CADÊNCIA continua sendo a dos exemplos de voz da Nathalia (não atropele o ritmo dela):\n- ${TOM[r]}`
    : "";
  return `${head}\n\n${REGRA_GLOBAL}`;
}

export interface DoseRow {
  info: RegInfo;
  n: number;
  pct: number;
  status: "ok" | "alto" | "baixo";
  nota: string;
}
export interface Dose {
  total: number;
  rows: DoseRow[];
  alarme: string | null;   // o desequilíbrio mais grave do mês (um só)
  pede: Registro | null;   // o que o ritmo pede agora (o mais em falta)
}

const TOL = 0.12;   // tolerância (±12 pontos) antes de gritar
const MIN = 3;      // abaixo disso não dá pra julgar ritmo

export function computeDose(registros: (Registro | undefined | null)[]): Dose {
  // só os registros de DISTRIBUIÇÃO entram na conta (Darkside é camada — fica de fora do numerador e do denominador)
  const tagged = registros.filter((r): r is Registro => !!r && DIST_IDS.has(r));
  const total = tagged.length;

  const rows: DoseRow[] = DIST.map((info) => {
    const n = tagged.filter((r) => r === info.id).length;
    const pct = total ? n / total : 0;
    const diff = pct - info.target;
    let status: "ok" | "alto" | "baixo" = "ok";
    if (total >= MIN) {
      if (diff > TOL) status = "alto";
      // registro de alvo baixo (ex: convocação 10% < tolerância 12%) nunca cairia em "baixo" pela conta.
      // pra ele, "baixo" = AUSÊNCIA total no mês. pros grandes, a banda normal.
      else if (info.target <= TOL ? n === 0 : diff < -TOL) status = "baixo";
    }
    const nota = status === "ok" ? "no ponto" : status === "alto" ? NOTA_ALTO[info.id] : NOTA_BAIXO[info.id];
    return { info, n, pct, status, nota };
  });

  let alarme: string | null = null;
  let pede: Registro | null = null;
  if (total >= MIN) {
    const alto = [...rows].filter((r) => r.status === "alto").sort((a, b) => (b.pct - b.info.target) - (a.pct - a.info.target))[0];
    const baixo = [...rows].filter((r) => r.status === "baixo").sort((a, b) => (a.pct - a.info.target) - (b.pct - b.info.target))[0];
    pede = baixo?.info.id || null;
    if (alto && baixo) alarme = `o mês tá com ${alto.info.emoji} ${alto.info.label.toLowerCase()} ${alto.nota} e ${baixo.info.emoji} ${baixo.info.label.toLowerCase()} ${baixo.nota}.`;
    else if (alto) alarme = `o mês tá com ${alto.info.emoji} ${alto.info.label.toLowerCase()} ${alto.nota}.`;
    else if (baixo) alarme = `o mês tá com ${baixo.info.emoji} ${baixo.info.label.toLowerCase()} ${baixo.nota}.`;
  }

  return { total, rows, alarme, pede };
}

// CONVOCAÇÃO — o "pedido" da marca. Não se mede por proporção (alvo baixo), se mede por CADÊNCIA:
// entregar bastante e, de tempos em tempos, chamar pra dentro. Recebe os registros JÁ ordenados (antigo→novo).
export interface ConvStatus { n: number; desde: number; never: boolean; pede: boolean }
export function convocacaoStatus(orderedRegistros: (Registro | undefined | null)[]): ConvStatus {
  const seq = orderedRegistros.filter(Boolean) as Registro[];
  const n = seq.length;
  const last = seq.lastIndexOf("convocacao");
  const never = last === -1;
  const desde = never ? n : n - 1 - last; // quantos posts desde a última convocação
  // só cobra DEPOIS de ter entregado um tanto (nunca no começo) — pra não virar pedinte
  const pede = never ? n >= 5 : desde >= 6;
  return { n, desde, never, pede };
}

// ALARMES DE SEQUÊNCIA — olham a ORDEM (cronológica) dos posts, não só a proporção.
// Recebe os registros JÁ ordenados do mais antigo pro mais novo.
export interface SeqAlert { tipo: string; msg: string }
export function sequenceAlerts(orderedRegistros: (Registro | undefined | null)[]): SeqAlert[] {
  const seq = orderedRegistros.filter(Boolean) as Registro[]; // só os marcados, em ordem
  const n = seq.length;
  const alerts: SeqAlert[] = [];
  if (n < 2) return alerts;

  // 1) CONFRONTOS SEGUIDOS — streak no fim da sequência (os mais recentes)
  let streak = 0;
  for (let i = n - 1; i >= 0 && seq[i] === "porrada"; i--) streak++;
  if (streak >= 3) alerts.push({ tipo: "porrada-streak", msg: `${streak} 🔥 confrontos seguidos — tá gritando, a galera anestesia. Respira num 🎯 diagnóstico.` });

  // 2) MUITO TEMPO SEM DIAGNÓSTICO — quantos posts desde o último
  const lastFerida = seq.lastIndexOf("ferida");
  const desdeFerida = lastFerida === -1 ? n : n - 1 - lastFerida;
  if (n >= 4 && desdeFerida >= 4) {
    alerts.push({ tipo: "sem-ferida", msg: lastFerida === -1
      ? `${n} posts e nenhum 🎯 diagnóstico — virou só técnica e sacudida, ninguém se viu no espelho.`
      : `${desdeFerida} posts desde o último 🎯 diagnóstico — a identificação tá esfriando.` });
  }

  // 3) CONVOCAÇÕES COLADAS — duas seguidas
  for (let i = 1; i < n; i++) {
    if (seq[i] === "convocacao" && seq[i - 1] === "convocacao") {
      alerts.push({ tipo: "convoca-dupla", msg: `2 ⚔️ convocações coladas — tá pedindo demais, ainda não mereceu. Entrega antes de pedir de novo.` });
      break;
    }
  }
  return alerts;
}
