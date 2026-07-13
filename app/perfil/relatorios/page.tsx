"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { formatDate, formatNumber, hasNumber, postsSince, sumAvailable, type DashboardPost } from "@/lib/instagram-metrics";
import { toast } from "@/lib/toast";

type Report = { id: string; createdAt: string; username: string; summary: string; snapshot: { account?: { views30?: number; reach30?: number }; posts: DashboardPost[] } };

export default function ReportsPage() {
  const router = useRouter();
  const [reports, setReports] = useState<Report[]>([]);
  const [busy, setBusy] = useState("load");
  const load = useCallback(async () => {
    try { const response = await fetch("/api/instagram/reports"); const data = await response.json(); if (!response.ok) throw new Error(data.error); setReports(data.reports || []); }
    catch (error) { toast(error instanceof Error ? error.message : "Erro ao carregar relatórios.", "err"); }
    finally { setBusy(""); }
  }, []);
  useEffect(() => {
    const timer = window.setTimeout(() => { void load(); }, 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  async function create() {
    if (busy) return; setBusy("create");
    try { const response = await fetch("/api/instagram/reports", { method: "POST" }); const data = await response.json(); if (!response.ok) throw new Error(data.error); toast("Relatório criado."); router.push(`/perfil/relatorios/${data.report.id}`); }
    catch (error) { toast(error instanceof Error ? error.message : "Erro ao criar relatório.", "err"); setBusy(""); }
  }

  async function remove(id: string) {
    if (busy || !window.confirm("Apagar este relatório? Esta ação não pode ser desfeita.")) return;
    setBusy(id);
    try { const response = await fetch(`/api/instagram/reports?id=${encodeURIComponent(id)}`, { method: "DELETE" }); const data = await response.json(); if (!response.ok) throw new Error(data.error); setReports((items) => items.filter((item) => item.id !== id)); toast("Relatório apagado."); }
    catch (error) { toast(error instanceof Error ? error.message : "Erro ao apagar relatório.", "err"); }
    finally { setBusy(""); }
  }

  return <div className="ig-dashboard">
    <header className="ig-header"><div><span>HISTÓRICO</span><h1>Meus relatórios</h1><p>Retratos salvos da performance do perfil em cada momento.</p></div><div className="ig-actions"><button type="button" className="ig-btn" onClick={() => router.push("/perfil")}>voltar ao Perfil</button><button type="button" className="ig-btn ig-btn--primary" disabled={!!busy && busy !== "load"} onClick={create}>{busy === "create" ? "criando..." : "criar novo relatório"}</button></div></header>
    {busy === "load" ? <div className="ig-loading">Carregando relatórios…</div> : reports.length ? <div className="ig-report-grid">{reports.map((report) => <ReportCard key={report.id} report={report} busy={busy === report.id} onOpen={() => router.push(`/perfil/relatorios/${report.id}`)} onRemove={() => remove(report.id)} />)}</div> : <div className="ig-empty ig-empty--large"><strong>Nenhum relatório salvo.</strong><span>Volte ao Perfil, atualize os Insights e crie seu primeiro relatório estratégico.</span><button type="button" className="ig-btn ig-btn--primary" onClick={() => router.push("/perfil")}>ir para o Perfil</button></div>}
  </div>;
}

function ReportCard({ report, busy, onOpen, onRemove }: { report: Report; busy: boolean; onOpen: () => void; onRemove: () => void }) {
  const posts30 = useMemo(() => postsSince(report.snapshot.posts, 30, new Date(report.createdAt).getTime()), [report]);
  const views30 = hasNumber(report.snapshot.account?.views30) ? report.snapshot.account.views30 : sumAvailable(posts30, "views");
  const reach30 = hasNumber(report.snapshot.account?.reach30) ? report.snapshot.account.reach30 : sumAvailable(posts30, "reach");
  return <article className="ig-report-card"><div><span>@{report.username}</span><time>{formatDate(report.createdAt, true)}</time></div><div className="ig-report-metrics"><p><strong>{formatNumber(views30)}</strong><span>visualizações · 30 dias</span></p><p><strong>{formatNumber(reach30)}</strong><span>alcance · 30 dias</span></p><p><strong>{report.snapshot.posts.length}</strong><span>posts lidos</span></p></div><p>{report.summary}</p><div className="ig-actions"><button type="button" className="ig-btn ig-btn--primary" onClick={onOpen}>abrir</button><button type="button" className="ig-btn ig-btn--danger" disabled={busy} onClick={onRemove}>{busy ? "apagando..." : "apagar"}</button></div></article>;
}
