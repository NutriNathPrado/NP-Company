type InstagramProfileCardProps = {
  username: string;
  picture?: string;
  updatedAtLabel: string;
  busy?: string;
  onUpdate: () => void;
  onCreateReport: () => void;
  onReports: () => void;
  onDisconnect: () => void;
  className?: string;
};

export default function InstagramProfileCard({
  username,
  picture,
  updatedAtLabel,
  busy = "",
  onUpdate,
  onCreateReport,
  onReports,
  onDisconnect,
  className = "",
}: InstagramProfileCardProps) {
  return (
    <section className={`ig-section ig-profile-card ${className}`.trim()}>
      <div className="ig-profile-identity">
        <div className="ig-avatar">
          {picture ? <img src={picture} alt={`Foto de @${username}`} /> : <span>{username.slice(0, 1).toUpperCase()}</span>}
        </div>
        <div>
          <h2>@{username}</h2>
          <p>Insights atualizados em {updatedAtLabel}</p>
        </div>
      </div>
      <div className="ig-actions ig-actions--profile">
        <button type="button" className="ig-btn ig-btn--primary" disabled={!!busy} onClick={onUpdate}>
          {busy === "insights" ? "atualizando..." : "atualizar insights"}
        </button>
        <button type="button" className="ig-btn ig-btn--primary" disabled={!!busy} onClick={onCreateReport}>
          {busy === "report" ? "criando..." : "criar relatório"}
        </button>
        <button type="button" className="ig-btn" disabled={!!busy} onClick={onReports}>meus relatórios</button>
        <button type="button" className="ig-btn ig-btn--quiet" disabled={!!busy} onClick={onDisconnect}>
          {busy === "disconnect" ? "desconectando..." : "desconectar"}
        </button>
      </div>
    </section>
  );
}
