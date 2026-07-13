"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Markdown from "@/components/Markdown";
import Modal from "@/components/Modal";
import { toast } from "@/lib/toast";
import {
  engagement, formatDate, formatLabel, formatNumber, formatPercent, hasNumber,
  percent, postsSince, ratio, sumAvailable, type DashboardPost,
} from "@/lib/instagram-metrics";

type Status = { connected: boolean; username?: string; connectedAt?: string; tokenExpiresAt?: string };
type Snapshot = { updatedAt: string; profile: { username: string; followers: number; mediaCount: number; picture?: string }; posts: DashboardPost[] };
type Analysis = { updatedAt: string; text: string };
type Learnings = { updatedAt: string; n: number; summary: string };
type SortMode = "recent" | "reach" | "engagement";
type InfoModal = "reach" | "funnel" | null;

async function jsonFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, init);
  const data = await response.json();
  if (!response.ok || data.error) throw new Error(data.error || "Não foi possível concluir a ação.");
  return data as T;
}

function MetricCard({ label, value, accent, onClick }: { label: string; value: string; accent?: boolean; onClick?: () => void }) {
  const content = <><strong>{value}</strong><span>{label}</span></>;
  return onClick ? (
    <button type="button" className={`ig-metric${accent ? " ig-metric--accent" : ""}`} onClick={onClick}>{content}</button>
  ) : <div className={`ig-metric${accent ? " ig-metric--accent" : ""}`}>{content}</div>;
}

function PrintAnalysis({ onSaved }: { onSaved?: (analysis: Analysis) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<Analysis | null>(null);
  const [open, setOpen] = useState(true);

  async function analyze() {
    if (!files.length || busy) return;
    setBusy(true);
    try {
      const images = await Promise.all(files.slice(0, 8).map((file) => new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result));
        reader.onerror = () => reject(new Error(`Não foi possível ler ${file.name}.`));
        reader.readAsDataURL(file);
      })));
      const data = await jsonFetch<{ analysis: Analysis }>("/api/instagram/print", { method: "POST", body: JSON.stringify({ images }) });
      setResult(data.analysis); setOpen(true); onSaved?.(data.analysis);
      toast("Prints analisados com sucesso.");
    } catch (error) { toast(error instanceof Error ? error.message : "Erro ao analisar os prints.", "err"); }
    finally { setBusy(false); }
  }

  return (
    <section className="ig-section">
      <div className="ig-section-head"><div><h2>Análise por prints</h2><p>Uma alternativa segura quando o Instagram não está conectado.</p></div></div>
      <input ref={inputRef} className="ig-file-input" type="file" accept="image/png,image/jpeg,image/webp,image/gif" multiple
        onChange={(event) => setFiles(Array.from(event.target.files || []).slice(0, 8))} />
      <button type="button" className="ig-dropzone" onClick={() => inputRef.current?.click()}>
        <span className="ig-camera" aria-hidden="true">▣</span>
        <strong>Envie prints dos Insights</strong>
        <small>PNG, JPG, WEBP ou GIF · até 8 imagens</small>
        <b>{files.length ? `${files.length} arquivo${files.length > 1 ? "s" : ""} selecionado${files.length > 1 ? "s" : ""}` : "selecionar imagens"}</b>
      </button>
      <div className="ig-actions"><button type="button" className="ig-btn ig-btn--primary" disabled={!files.length || busy} onClick={analyze}>{busy ? "analisando prints..." : "analisar prints"}</button></div>
      {result && <div className="ig-collapsible"><button type="button" onClick={() => setOpen((value) => !value)}><span>Resultado da análise · {formatDate(result.updatedAt, true)}</span><b>{open ? "recolher" : "ver análise"}</b></button>{open && <div className="ig-markdown"><Markdown text={result.text} /></div>}</div>}
    </section>
  );
}

export default function PerfilPage() {
  const router = useRouter();
  const [status, setStatus] = useState<Status | null>(null);
  const [snap, setSnap] = useState<Snapshot | null>(null);
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [learnings, setLearnings] = useState<Learnings | null>(null);
  const [busy, setBusy] = useState<string>("load");
  const [form, setForm] = useState({ appId: "", appSecret: "", token: "" });
  const [sortBy, setSortBy] = useState<SortMode>("recent");
  const [analysisOpen, setAnalysisOpen] = useState(false);
  const [selectedPost, setSelectedPost] = useState<DashboardPost | null>(null);
  const [infoModal, setInfoModal] = useState<InfoModal>(null);

  const load = useCallback(async () => {
    try {
      const current = await jsonFetch<Status>("/api/instagram/connect");
      setStatus(current);
      if (!current.connected) { setSnap(null); setAnalysis(null); setLearnings(null); return; }
      const [insights, diagnosis, winners] = await Promise.all([
        jsonFetch<{ snapshot: Snapshot | null }>("/api/instagram/insights"),
        jsonFetch<{ analysis: Analysis | null }>("/api/instagram/analyze"),
        jsonFetch<{ learnings: Learnings | null }>("/api/instagram/learn-winners"),
      ]);
      setSnap(insights.snapshot); setAnalysis(diagnosis.analysis); setLearnings(winners.learnings);
    } catch (error) { toast(error instanceof Error ? error.message : "Erro ao carregar o perfil.", "err"); }
    finally { setBusy(""); }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => { void load(); }, 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  async function runAction<T>(key: string, path: string, after: (data: T) => void, success: string, init: RequestInit = { method: "POST" }) {
    if (busy) return;
    setBusy(key);
    try { const data = await jsonFetch<T>(path, init); after(data); toast(success); }
    catch (error) { toast(error instanceof Error ? error.message : "Não foi possível concluir.", "err"); }
    finally { setBusy(""); }
  }

  async function connect() {
    await runAction<{ username: string }>("connect", "/api/instagram/connect", async () => { setForm({ appId: "", appSecret: "", token: "" }); await load(); }, "Instagram conectado.", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
  }

  async function disconnect() {
    if (!window.confirm("Desconectar o Instagram? Os relatórios salvos serão preservados.")) return;
    await runAction<Status>("disconnect", "/api/instagram/connect", () => { setStatus({ connected: false }); setSnap(null); }, "Instagram desconectado.", { method: "DELETE" });
  }

  async function createReport() {
    await runAction<{ report: { id: string } }>("report", "/api/instagram/reports", (data) => router.push(`/perfil/relatorios/${data.report.id}`), "Relatório criado.");
  }

  const posts30 = useMemo(() => postsSince(snap?.posts || [], 30), [snap]);
  const posts7 = useMemo(() => postsSince(snap?.posts || [], 7), [snap]);
  const views30 = useMemo(() => sumAvailable(posts30, "views"), [posts30]);
  const views7 = useMemo(() => sumAvailable(posts7, "views"), [posts7]);
  const reach30 = useMemo(() => sumAvailable(posts30, "reach"), [posts30]);
  const reach7 = useMemo(() => sumAvailable(posts7, "reach"), [posts7]);

  const posts = useMemo(() => [...(snap?.posts || [])].sort((a, b) => {
    if (sortBy === "reach") return (b.reach ?? -1) - (a.reach ?? -1);
    if (sortBy === "engagement") return engagement(b) - engagement(a);
    return (b.timestamp ? new Date(b.timestamp).getTime() : 0) - (a.timestamp ? new Date(a.timestamp).getTime() : 0);
  }), [snap, sortBy]);

  if (busy === "load" && status === null) return <div className="ig-dashboard"><div className="ig-loading">Carregando o perfil…</div></div>;

  return (
    <div className="ig-dashboard">
      <header className="ig-header">
        <div><span>INSTAGRAM ANALYTICS</span><h1>insights atualizados direto da Meta</h1><p>Performance real, diagnóstico estratégico e aprendizados do conteúdo.</p></div>
        {status?.connected && snap && <div className="ig-header-stats"><div><strong>{formatNumber(snap.profile.followers)}</strong><span>seguidores</span></div><div><strong>{formatNumber(views30)}</strong><span>visualizações · 30 dias*</span></div></div>}
      </header>

      {!status?.connected ? <>
        <section className="ig-section ig-connect">
          <div className="ig-section-head"><div><span className="ig-kicker">CONEXÃO OFICIAL</span><h2>Conectar Instagram</h2><p>Use o fluxo já configurado com a API oficial da Meta.</p></div></div>
          <div className="ig-form-grid">
            <label><span>App ID</span><input className="studio-input" value={form.appId} onChange={(e) => setForm({ ...form, appId: e.target.value })} autoComplete="off" /></label>
            <label><span>Chave secreta do App</span><input className="studio-input" type="password" value={form.appSecret} onChange={(e) => setForm({ ...form, appSecret: e.target.value })} autoComplete="off" /></label>
            <label className="ig-form-wide"><span>Token de acesso</span><textarea className="studio-textarea" rows={3} value={form.token} onChange={(e) => setForm({ ...form, token: e.target.value })} /></label>
          </div>
          <details className="ig-details"><summary>como conectar</summary><ol><li>Abra o App já usado em developers.facebook.com.</li><li>Gere o token no Graph API Explorer com instagram_basic, instagram_manage_insights e pages_show_list.</li><li>Cole os três dados acima. O fluxo existente troca o token por um de longa duração automaticamente.</li></ol></details>
          <button type="button" className="ig-btn ig-btn--primary" disabled={busy === "connect" || !form.appId || !form.appSecret || !form.token} onClick={connect}>{busy === "connect" ? "conectando..." : "conectar Instagram"}</button>
        </section>
        <PrintAnalysis onSaved={(value) => { setAnalysis(value); setAnalysisOpen(true); }} />
      </> : <>
        <section className="ig-section ig-profile-card">
          <div className="ig-profile-identity">
            <div className="ig-avatar">{snap?.profile.picture ? <img src={snap.profile.picture} alt={`Foto de @${snap.profile.username}`} /> : <span>{(status.username || "I").slice(0, 1).toUpperCase()}</span>}</div>
            <div><h2>@{status.username}</h2><p>Insights atualizados em {formatDate(snap?.updatedAt, true)}</p></div>
          </div>
          <div className="ig-actions ig-actions--profile">
            <button type="button" className="ig-btn ig-btn--primary" disabled={!!busy} onClick={() => runAction<{ snapshot: Snapshot }>("insights", "/api/instagram/insights", (data) => setSnap(data.snapshot), "Insights atualizados.")}>{busy === "insights" ? "atualizando..." : "atualizar insights"}</button>
            <button type="button" className="ig-btn ig-btn--primary" disabled={!!busy || !snap} onClick={createReport}>{busy === "report" ? "criando..." : "criar relatório"}</button>
            <button type="button" className="ig-btn" onClick={() => router.push("/perfil/relatorios")}>meus relatórios</button>
            <button type="button" className="ig-btn ig-btn--quiet" disabled={!!busy} onClick={disconnect}>{busy === "disconnect" ? "desconectando..." : "desconectar"}</button>
          </div>
        </section>

        <section aria-labelledby="metricas-title">
          <div className="ig-section-head ig-section-head--plain"><div><h2 id="metricas-title">Painel de métricas</h2><p>* Totais de período representam a soma dos posts datados lidos pela API, não o agregado oficial da conta.</p></div></div>
          <div className="ig-metrics-grid">
            <MetricCard label="Seguidores" value={formatNumber(snap?.profile.followers)} />
            <MetricCard label="Posts no perfil" value={formatNumber(snap?.profile.mediaCount)} />
            <MetricCard label="Visualizações · últimos 30 dias*" value={formatNumber(views30)} />
            <MetricCard label="Visualizações · últimos 7 dias*" value={formatNumber(views7)} />
            <MetricCard label="Alcance · últimos 30 dias*" value={formatNumber(reach30)} onClick={() => setInfoModal("reach")} />
            <MetricCard label="Alcance · últimos 7 dias*" value={formatNumber(reach7)} onClick={() => setInfoModal("reach")} />
            <MetricCard label="Novos seguidores · 30 dias" value="—" />
            <MetricCard label="Taxa de conversão em seguidores" value="—" accent onClick={() => setInfoModal("funnel")} />
            <MetricCard label="Deixaram de seguir · 30 dias" value="—" />
            <MetricCard label="Novos seguidores · 7 dias" value="—" />
            <MetricCard label="Deixaram de seguir · 7 dias" value="—" />
            <MetricCard label="Posts lidos pela API" value={formatNumber(snap?.posts.length)} />
          </div>
        </section>

        <section className="ig-section">
          <div className="ig-section-head"><div><h2>análise estratégica</h2><p>Diagnóstico da IA com as métricas atuais e o Cérebro da marca.</p></div><button type="button" className="ig-btn ig-btn--primary" disabled={!!busy || !snap?.posts.length} onClick={() => runAction<{ analysis: Analysis }>("analysis", "/api/instagram/analyze", (data) => { setAnalysis(data.analysis); setAnalysisOpen(true); }, "Análise atualizada.")}>{busy === "analysis" ? "analisando..." : "analisar meu perfil"}</button></div>
          {analysis ? <div className="ig-collapsible"><button type="button" onClick={() => setAnalysisOpen((value) => !value)}><span>Última análise · {formatDate(analysis.updatedAt, true)}</span><b>{analysisOpen ? "recolher" : "ver análise"}</b></button>{analysisOpen && <div className="ig-markdown"><Markdown text={analysis.text} /></div>}</div> : <div className="ig-empty"><strong>A análise estratégica ainda não foi criada.</strong><span>Atualize os Insights e selecione “analisar meu perfil”.</span></div>}
        </section>

        <section className="ig-section">
          <div className="ig-section-head"><div><h2>aprender com meus campeões</h2><p>A IA compara os posts de maior e menor desempenho para descobrir padrões.</p></div><button type="button" className="ig-btn ig-btn--primary" disabled={!!busy || (snap?.posts.length || 0) < 3} onClick={() => runAction<{ learnings: Learnings }>("winners", "/api/instagram/learn-winners", (data) => setLearnings(data.learnings), "Aprendizado atualizado e aplicado às gerações.")}>{busy === "winners" ? "aprendendo..." : "iniciar aprendizado"}</button></div>
          {learnings ? <div className="ig-learning-status"><div><strong>Aprendizado ativo</strong><span>Executado em {formatDate(learnings.updatedAt, true)} · {learnings.n} posts analisados</span></div><b>Já aplicado às novas gerações</b></div> : <div className="ig-empty"><strong>Nenhum aprendizado executado.</strong><span>São necessários pelo menos 3 posts lidos.</span></div>}
        </section>

        <section className="ig-section">
          <div className="ig-section-head"><div><h2>Publicações</h2><p>{snap?.posts.length || 0} posts lidos pela API.</p></div><div className="ig-pills" aria-label="Ordenar publicações">{([['recent','Recentes'],['reach','Alcance'],['engagement','Engajamento']] as const).map(([value, label]) => <button type="button" key={value} className={sortBy === value ? "is-active" : ""} onClick={() => setSortBy(value)}>{label}</button>)}</div></div>
          {posts.length ? <div className="ig-post-grid">{posts.map((post) => <button type="button" key={post.id} className="ig-post-card" onClick={() => setSelectedPost(post)}>
            <div className="ig-post-cover">{post.thumbnail ? <img src={post.thumbnail} alt="" loading="lazy" /> : <span>sem capa</span>}<b className={`ig-badge ig-badge--${formatLabel(post.mediaType).toLowerCase()}`}>{formatLabel(post.mediaType)}</b></div>
            <div className="ig-post-body"><time>{formatDate(post.timestamp)}</time><p>{post.caption?.trim() || "Publicação sem legenda."}</p><div className="ig-post-stats"><span>♥ {formatNumber(post.likes)}</span><span>◌ {formatNumber(post.comments)}</span><span>▣ {formatNumber(post.saved)}</span><span>↗ {formatNumber(post.shares)}</span><span>◎ {formatNumber(post.reach)}</span></div><strong>{formatNumber(engagement(post))} engajamentos</strong></div>
          </button>)}</div> : <div className="ig-empty"><strong>Nenhuma publicação disponível.</strong><span>Atualize os Insights para buscar os posts mais recentes.</span></div>}
        </section>
      </>}

      {infoModal === "reach" && <Modal title="Alcance e visualizações" onClose={() => setInfoModal(null)}><div className="ig-modal-copy"><p><b>Alcance</b> representa contas únicas que visualizaram o conteúdo.</p><p><b>Visualizações</b> podem contar várias reproduções da mesma pessoa e, por isso, podem ser maiores que o alcance.</p><p>Os valores variam de acordo com os dados disponibilizados pela Meta.</p></div><button type="button" className="ig-btn ig-btn--primary" onClick={() => setInfoModal(null)}>entendi</button></Modal>}
      {infoModal === "funnel" && <Modal title="Funil de conversão" onClose={() => setInfoModal(null)} maxWidth={860}><div className="ig-funnel"><MetricCard label="Alcance · 30 dias*" value={formatNumber(reach30)} /><MetricCard label="Visitas ao perfil" value="—" /><MetricCard label="Taxa de visita" value="—" /><MetricCard label="Novos seguidores" value="—" /><MetricCard label="Taxa final" value="—" accent /></div><p className="ig-modal-note">A API atual não fornece visitas ao perfil nem novos seguidores por período. Nenhuma taxa foi estimada sem esses dados.</p><button type="button" className="ig-btn" onClick={() => setInfoModal(null)}>fechar</button></Modal>}
      {selectedPost && <PostModal post={selectedPost} onClose={() => setSelectedPost(null)} />}
    </div>
  );
}

function PostModal({ post, onClose }: { post: DashboardPost; onClose: () => void }) {
  const total = engagement(post);
  const base = hasNumber(post.reach) && post.reach > 0 ? post.reach : (hasNumber(post.views) && post.views > 0 ? post.views : null);
  const rate = percent(total, base);
  const repetition = ratio(post.views, post.reach);
  const observations = [
    repetition == null ? "Repetição indisponível sem visualizações e alcance válidos." : repetition > 1.25 ? "Há sinais de repetição: parte da audiência viu o conteúdo mais de uma vez." : "A repetição está próxima de uma visualização por conta alcançada.",
    hasNumber(post.saved) ? (post.saved > 0 ? `${formatNumber(post.saved)} salvamentos indicam intenção de consultar novamente.` : "Não houve salvamentos registrados.") : "Salvamentos não foram disponibilizados.",
    hasNumber(post.shares) ? (post.shares > 0 ? `${formatNumber(post.shares)} compartilhamentos ampliaram a distribuição.` : "Não houve compartilhamentos registrados.") : "Compartilhamentos não foram disponibilizados.",
  ];
  return <Modal title="Resumo da publicação" onClose={onClose} maxWidth={820}><div className="ig-post-modal">
    <div className="ig-post-modal-cover">{post.thumbnail ? <img src={post.thumbnail} alt="Capa da publicação" /> : <span>sem capa</span>}</div>
    <div className="ig-post-modal-content"><div className="ig-post-modal-meta"><span className={`ig-badge ig-badge--${formatLabel(post.mediaType).toLowerCase()}`}>{formatLabel(post.mediaType)}</span><time>{formatDate(post.timestamp)}</time></div><p className="ig-caption-full">{post.caption?.slice(0, 420) || "Publicação sem legenda."}</p>
      <div className="ig-detail-grid"><MetricCard label="Alcance" value={formatNumber(post.reach)} /><MetricCard label="Visualizações" value={formatNumber(post.views)} /><MetricCard label="Curtidas" value={formatNumber(post.likes)} /><MetricCard label="Comentários" value={formatNumber(post.comments)} /><MetricCard label="Salvamentos" value={formatNumber(post.saved)} /><MetricCard label="Compartilhamentos" value={formatNumber(post.shares)} /><MetricCard label="Engajamento total" value={formatNumber(total)} accent /><MetricCard label={`Taxa de engajamento${base === post.views ? " · base: visualizações" : ""}`} value={formatPercent(rate)} /><MetricCard label="Repetição · views ÷ alcance" value={repetition == null ? "—" : `${repetition.toLocaleString("pt-BR", { maximumFractionDigits: 2 })}×`} /></div>
      <div className="ig-reading"><strong>Leitura objetiva</strong><ul>{observations.map((item) => <li key={item}>{item}</li>)}</ul></div>
      <div className="ig-actions">{post.permalink && <a className="ig-btn ig-btn--primary" href={post.permalink} target="_blank" rel="noopener noreferrer">abrir no Instagram</a>}<button type="button" className="ig-btn" onClick={onClose}>fechar</button></div>
    </div>
  </div></Modal>;
}
