"use client";

import { useMemo, useState } from "react";
import Modal from "@/components/Modal";
import {
  formatNumber,
  formatPercent,
  hasNumber,
  percent,
  postsSince,
  sumAvailable,
  type InstagramDashboardSnapshot,
} from "@/lib/instagram-metrics";

type InfoModal = "reach" | "funnel" | null;

function MetricCard({ label, value, accent, onClick }: { label: string; value: string; accent?: boolean; onClick?: () => void }) {
  const content = <><strong>{value}</strong><span>{label}</span></>;
  return onClick ? (
    <button type="button" className={`ig-metric${accent ? " ig-metric--accent" : ""}`} onClick={onClick}>{content}</button>
  ) : <div className={`ig-metric${accent ? " ig-metric--accent" : ""}`}>{content}</div>;
}

export default function InstagramMetricsPanel({ snapshot, compact = false }: { snapshot: InstagramDashboardSnapshot; compact?: boolean }) {
  const [infoModal, setInfoModal] = useState<InfoModal>(null);
  const posts30 = useMemo(() => postsSince(snapshot.posts, 30), [snapshot.posts]);
  const posts7 = useMemo(() => postsSince(snapshot.posts, 7), [snapshot.posts]);
  const views30 = useMemo(() => sumAvailable(posts30, "views"), [posts30]);
  const views7 = useMemo(() => sumAvailable(posts7, "views"), [posts7]);
  const reach30 = useMemo(() => sumAvailable(posts30, "reach"), [posts30]);
  const reach7 = useMemo(() => sumAvailable(posts7, "reach"), [posts7]);
  const newFollowers30 = snapshot.account?.newFollowers30;
  const profileViews30 = snapshot.account?.profileViews30;
  const conversionBase = hasNumber(profileViews30) && profileViews30 > 0
    ? profileViews30
    : (hasNumber(reach30) && reach30 > 0 ? reach30 : null);
  const conversion = percent(newFollowers30, conversionBase);
  const conversionUsesReach = conversionBase === reach30 && !(hasNumber(profileViews30) && profileViews30 > 0);

  return (
    <>
      <section className={compact ? "ig-metrics-panel ig-metrics-panel--compact" : "ig-metrics-panel"} aria-labelledby={compact ? "metricas-hoje-title" : "metricas-title"}>
        <div className="ig-section-head ig-section-head--plain">
          <div>
            <h2 id={compact ? "metricas-hoje-title" : "metricas-title"}>Painel de métricas</h2>
            <p>* Totais de visualizações e alcance representam a soma dos posts datados lidos pela API.</p>
          </div>
        </div>
        <div className="ig-metrics-grid">
          <MetricCard label="Seguidores" value={formatNumber(snapshot.profile.followers)} />
          <MetricCard label="Posts no perfil" value={formatNumber(snapshot.profile.mediaCount)} />
          <MetricCard label="Visualizações · últimos 30 dias*" value={formatNumber(views30)} />
          <MetricCard label="Visualizações · últimos 7 dias*" value={formatNumber(views7)} />
          <MetricCard label="Alcance · últimos 30 dias*" value={formatNumber(reach30)} onClick={() => setInfoModal("reach")} />
          <MetricCard label="Alcance · últimos 7 dias*" value={formatNumber(reach7)} onClick={() => setInfoModal("reach")} />
          <MetricCard label="Novos seguidores · 30 dias" value={formatNumber(newFollowers30)} />
          <MetricCard
            label={`Taxa de conversão em seguidores${conversionUsesReach ? " · base: alcance" : ""}`}
            value={formatPercent(conversion)}
            accent
            onClick={() => setInfoModal("funnel")}
          />
          <MetricCard label="Deixaram de seguir · 30 dias" value={formatNumber(snapshot.account?.unfollows30)} />
          <MetricCard label="Novos seguidores · 7 dias" value={formatNumber(snapshot.account?.newFollowers7)} />
          <MetricCard label="Deixaram de seguir · 7 dias" value={formatNumber(snapshot.account?.unfollows7)} />
          <MetricCard label="Posts lidos pela API" value={formatNumber(snapshot.posts.length)} />
        </div>
      </section>

      {infoModal === "reach" && <Modal title="Alcance e visualizações" onClose={() => setInfoModal(null)}><div className="ig-modal-copy"><p><b>Alcance</b> representa contas únicas que visualizaram o conteúdo.</p><p><b>Visualizações</b> podem contar várias reproduções da mesma pessoa e, por isso, podem ser maiores que o alcance.</p><p>Os valores variam de acordo com os dados disponibilizados pela Meta.</p></div><button type="button" className="ig-btn ig-btn--primary" onClick={() => setInfoModal(null)}>entendi</button></Modal>}
      {infoModal === "funnel" && <Modal title="Funil de conversão" onClose={() => setInfoModal(null)} maxWidth={860}>
        <div className="ig-funnel">
          <MetricCard label="Alcance · 30 dias*" value={formatNumber(reach30)} />
          <MetricCard label="Visitas ao perfil" value={formatNumber(profileViews30)} />
          <MetricCard label="Taxa de visita" value={formatPercent(percent(profileViews30, reach30))} />
          <MetricCard label="Novos seguidores" value={formatNumber(newFollowers30)} />
          <MetricCard label={conversionUsesReach ? "Taxa final · base: alcance" : "Taxa final · base: visitas"} value={formatPercent(conversion)} accent />
        </div>
        {conversionUsesReach && <p className="ig-modal-note">Visitas ao perfil não foram disponibilizadas pela Meta; a taxa final usa novos seguidores ÷ alcance e está identificada dessa forma.</p>}
        <button type="button" className="ig-btn" onClick={() => setInfoModal(null)}>fechar</button>
      </Modal>}
    </>
  );
}
