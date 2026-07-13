"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Markdown from "@/components/Markdown";
import { engagement, formatDate, formatLabel, formatNumber, formatPercent, percent, postsSince, sumAvailable, type DashboardPost } from "@/lib/instagram-metrics";

type Report = { id: string; createdAt: string; username: string; summary: string; analysis?: { text: string; updatedAt: string } | null; snapshot: { profile: { followers: number; mediaCount: number }; posts: DashboardPost[] } };
type Tab = "overview" | "content" | "diagnosis";

export default function ReportDashboard({ report }: { report: Report }) {
  const router = useRouter(); const [tab, setTab] = useState<Tab>("overview");
  const now = new Date(report.createdAt).getTime();
  const current = useMemo(() => postsSince(report.snapshot.posts, 30, now), [report, now]);
  const recent7 = useMemo(() => postsSince(report.snapshot.posts, 7, now), [report, now]);
  const prior = useMemo(() => report.snapshot.posts.filter((post) => { if (!post.timestamp) return false; const age = now - new Date(post.timestamp).getTime(); return age > 30 * 864e5 && age <= 60 * 864e5; }), [report, now]);
  const rankedReach = useMemo(() => [...report.snapshot.posts].filter((p) => typeof p.reach === "number").sort((a, b) => (b.reach || 0) - (a.reach || 0)), [report]);
  const rankedEng = useMemo(() => [...report.snapshot.posts].sort((a, b) => engagement(b) - engagement(a)), [report]);
  const averageEng = report.snapshot.posts.length ? rankedEng.reduce((sum, post) => sum + engagement(post), 0) / report.snapshot.posts.length : 0;
  const below = rankedEng.filter((post) => engagement(post) < averageEng).slice(-5).reverse();
  const healthSignals = [sumAvailable(current, "reach"), sumAvailable(current, "views"), report.snapshot.posts.length].filter((v) => typeof v === "number" && v > 0).length;
  const health = healthSignals === 3 ? "Dados consistentes" : healthSignals >= 1 ? "Dados parciais" : "Sem dados suficientes";
  const formats = Object.entries(report.snapshot.posts.reduce<Record<string, { n: number; reach: number; engagement: number }>>((acc, post) => { const key = formatLabel(post.mediaType); acc[key] ||= { n: 0, reach: 0, engagement: 0 }; acc[key].n += 1; acc[key].reach += post.reach || 0; acc[key].engagement += engagement(post); return acc; }, {}));
  const maxFormat = Math.max(1, ...formats.map(([, value]) => value.reach));

  return <div className="ig-dashboard">
    <header className="ig-header"><div><span>RELATÓRIO SALVO · {formatDate(report.createdAt, true)}</span><h1>Dashboard estratégico · @{report.username}</h1><p>{report.summary}</p></div><button type="button" className="ig-btn" onClick={() => router.push("/perfil/relatorios")}>meus relatórios</button></header>
    <nav className="ig-tabs" aria-label="Seções do relatório">{([['overview','Visão geral'],['content','Conteúdo'],['diagnosis','Diagnóstico da IA']] as const).map(([value,label]) => <button type="button" key={value} className={tab === value ? "is-active" : ""} onClick={() => setTab(value)}>{label}</button>)}</nav>
    {tab === "overview" && <>
      <section className="ig-section"><div className="ig-section-head"><div><h2>Saúde do perfil</h2><p>Qualidade e completude dos dados disponíveis neste retrato.</p></div><span className="ig-health">{health}</span></div><div className="ig-metrics-grid"><DashMetric label="Seguidores" value={formatNumber(report.snapshot.profile.followers)} /><DashMetric label="Posts no perfil" value={formatNumber(report.snapshot.profile.mediaCount)} /><DashMetric label="Visualizações · 30 dias*" value={formatNumber(sumAvailable(current, "views"))} /><DashMetric label="Alcance · 30 dias*" value={formatNumber(sumAvailable(current, "reach"))} /><DashMetric label="Posts lidos" value={formatNumber(report.snapshot.posts.length)} /></div></section>
      <section className="ig-section"><div className="ig-section-head"><div><h2>Comparações entre períodos</h2><p>Somente publicações datadas presentes no snapshot salvo.</p></div></div><div className="ig-comparison"><Compare label="Alcance" current={sumAvailable(current, "reach")} previous={sumAvailable(prior, "reach")} /><Compare label="Visualizações" current={sumAvailable(current, "views")} previous={sumAvailable(prior, "views")} /><Compare label="Alcance · 7 dias" current={sumAvailable(recent7, "reach")} previous={null} /></div></section>
      <section className="ig-section"><div className="ig-section-head"><div><h2>Desempenho por formato</h2><p>Alcance somado e engajamento dos posts lidos.</p></div></div>{formats.length ? <div className="ig-bars">{formats.map(([name,value]) => <div key={name}><span>{name} · {value.n} post{value.n > 1 ? "s" : ""}</span><div><i style={{ width: `${Math.max(4, (value.reach / maxFormat) * 100)}%` }} /></div><b>{formatNumber(value.reach)} alcance · {formatNumber(value.engagement)} eng.</b></div>)}</div> : <div className="ig-empty">Sem publicações para comparar.</div>}</section>
    </>}
    {tab === "content" && <div className="ig-report-rankings"><Ranking title="Top 5 por alcance" posts={rankedReach.slice(0, 5)} metric={(p) => `${formatNumber(p.reach)} alcance`} /><Ranking title="Top 5 por engajamento" posts={rankedEng.slice(0, 5)} metric={(p) => `${formatNumber(engagement(p))} engajamentos`} /><Ranking title="Posts abaixo da média" posts={below} metric={(p) => `${formatNumber(engagement(p))} engajamentos`} /><Ranking title="Conteúdos que valem ser replicados" posts={rankedEng.filter((post) => engagement(post) >= averageEng).slice(0, 5)} metric={(p) => `${formatNumber(engagement(p))} eng. · ${formatPercent(percent(engagement(p), p.reach))}`} /></div>}
    {tab === "diagnosis" && <section className="ig-section"><div className="ig-section-head"><div><h2>Diagnóstico estratégico</h2><p>Análise salva junto com este relatório.</p></div></div>{report.analysis?.text ? <div className="ig-markdown"><Markdown text={report.analysis.text} /></div> : <div className="ig-empty"><strong>Este relatório não possui diagnóstico.</strong><span>Crie uma análise no Perfil antes do próximo relatório.</span></div>}</section>}
  </div>;
}

function DashMetric({ label, value }: { label: string; value: string }) { return <div className="ig-metric"><strong>{value}</strong><span>{label}</span></div>; }
function Compare({ label, current, previous }: { label: string; current: number | null; previous: number | null }) { const change = previous && current != null ? percent(current - previous, previous) : null; return <div><span>{label}</span><strong>{formatNumber(current)}</strong><small>{previous == null ? "comparação indisponível" : `${formatPercent(change)} vs. período anterior`}</small></div>; }
function Ranking({ title, posts, metric }: { title: string; posts: DashboardPost[]; metric: (post: DashboardPost) => string }) { return <section className="ig-section"><div className="ig-section-head"><div><h2>{title}</h2></div></div>{posts.length ? <div className="ig-ranking-list">{posts.map((post,index) => <article key={post.id}><b>{index + 1}</b><div className="ig-ranking-cover">{post.thumbnail ? <img src={post.thumbnail} alt="" /> : <span>sem capa</span>}</div><div><strong>{formatLabel(post.mediaType)}</strong><p>{post.caption?.slice(0, 90) || "Sem legenda"}</p></div><span>{metric(post)}</span></article>)}</div> : <div className="ig-empty">Sem dados suficientes para este ranking.</div>}</section>; }
