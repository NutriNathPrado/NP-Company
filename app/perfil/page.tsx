"use client";

import { useEffect, useState } from "react";

type Status = { connected: boolean; username?: string; connectedAt?: string; tokenExpiresAt?: string };
type IgPost = { id: string; caption?: string; mediaType?: string; permalink?: string; thumbnail?: string; likes?: number; comments?: number; reach?: number; saved?: number; shares?: number; totalInteractions?: number; views?: number };
type Snapshot = { updatedAt: string; profile: { username: string; followers: number; mediaCount: number; picture?: string }; posts: IgPost[] };

function score(p: IgPost) {
  const reach = p.reach || 0, saved = p.saved || 0, shares = p.shares || 0;
  const inter = p.totalInteractions ?? ((p.likes || 0) + (p.comments || 0) + saved + shares);
  return reach + saved * 15 + shares * 20 + (reach ? inter / reach : 0) * 5000;
}

export default function PerfilPage() {
  const [status, setStatus] = useState<Status | null>(null);
  const [snap, setSnap] = useState<Snapshot | null>(null);
  const [analysis, setAnalysis] = useState<string>("");
  const [winners, setWinners] = useState<string>("");
  const [busy, setBusy] = useState<string>("");
  const [msg, setMsg] = useState<string>("");
  const [form, setForm] = useState({ appId: "", appSecret: "", token: "" });
  const [sortBy, setSortBy] = useState<"score" | "reach" | "saved" | "shares">("score");

  async function load() {
    const s = await fetch("/api/instagram/connect").then((r) => r.json());
    setStatus(s);
    if (s.connected) {
      const [ins, an, wn] = await Promise.all([
        fetch("/api/instagram/insights").then((r) => r.json()),
        fetch("/api/instagram/analyze").then((r) => r.json()),
        fetch("/api/instagram/learn-winners").then((r) => r.json()),
      ]);
      setSnap(ins.snapshot || null);
      setAnalysis(an.analysis?.text || "");
      setWinners(wn.learnings?.summary || "");
    }
  }
  useEffect(() => { load(); }, []);

  async function connect() {
    setBusy("connect"); setMsg("");
    const r = await fetch("/api/instagram/connect", { method: "POST", body: JSON.stringify(form) }).then((r) => r.json());
    setBusy(""); if (r.error) return setMsg(r.error);
    setMsg(`✓ Conectado como @${r.username}`); await load();
  }
  async function post(path: string, key: string, after: (d: unknown) => void) {
    setBusy(key); setMsg("");
    const r = await fetch(path, { method: "POST" }).then((r) => r.json());
    setBusy(""); if (r.error) return setMsg(r.error);
    after(r);
  }

  const posts = snap ? [...snap.posts].sort((a, b) => sortBy === "score" ? score(b) - score(a) : (b[sortBy] || 0) - (a[sortBy] || 0)) : [];

  return (
    <div className="studio-page">
      <div className="studio-hero">
        <div className="studio-hero__copy">
          <div className="studio-eyebrow">INSTAGRAM</div>
          <h2>Seu Perfil</h2>
          <p>Conecte seu Instagram e traga os números reais dos seus posts. A IA cruza com o seu Cérebro e te diz o que está funcionando.</p>
        </div>
      </div>

      {msg && <div className="create-status"><span>{msg}</span></div>}

      {!status?.connected ? (
        <div className="studio-section studio-section--pad">
          <div className="studio-section-head"><h3>Conectar</h3><p>via API oficial da Meta</p></div>
          <p className="studio-note">Crie um App em developers.facebook.com, pegue o <b>App ID</b>, a <b>Chave Secreta</b> e um <b>token</b> no Graph API Explorer (com as permissões instagram_basic, instagram_manage_insights, pages_show_list). Cole abaixo — eu troco por um token de 60 dias automaticamente.</p>
          <div className="studio-grid-2" style={{ marginTop: 12 }}>
            <input className="studio-input" placeholder="App ID" value={form.appId} onChange={(e) => setForm({ ...form, appId: e.target.value })} />
            <input className="studio-input" placeholder="Chave Secreta do App" value={form.appSecret} onChange={(e) => setForm({ ...form, appSecret: e.target.value })} />
          </div>
          <textarea className="studio-textarea" style={{ marginTop: 10 }} rows={3} placeholder="Token de acesso (Graph API Explorer)" value={form.token} onChange={(e) => setForm({ ...form, token: e.target.value })} />
          <button className="hoje-action hoje-action--primary" style={{ marginTop: 12 }} disabled={busy === "connect"} onClick={connect}>{busy === "connect" ? "Conectando..." : "Conectar Instagram"}</button>
        </div>
      ) : (
        <>
          <div className="studio-section studio-section--pad">
            <div className="studio-section-head">
              <h3>@{status.username}</h3>
              <p>{snap ? `${snap.profile.followers} seguidores · ${snap.profile.mediaCount} posts` : "conectado"}</p>
              <span className="spacer" />
              <button className="studio-mini-btn" disabled={busy === "ins"} onClick={() => post("/api/instagram/insights", "ins", (d) => setSnap((d as { snapshot: Snapshot }).snapshot))}>{busy === "ins" ? "atualizando..." : "↻ atualizar números"}</button>
              <button className="studio-mini-btn" disabled={busy === "an"} onClick={() => post("/api/instagram/analyze", "an", (d) => setAnalysis((d as { analysis?: { text?: string } }).analysis?.text || ""))}>{busy === "an" ? "analisando..." : "🧠 diagnóstico da IA"}</button>
              <button className="studio-mini-btn" disabled={busy === "wn"} onClick={() => post("/api/instagram/learn-winners", "wn", (d) => setWinners((d as { learnings?: { summary?: string } }).learnings?.summary || ""))}>{busy === "wn" ? "aprendendo..." : "🏆 aprender com meus campeões"}</button>
            </div>
            {analysis && <div className="dg-box" style={{ padding: 14, whiteSpace: "pre-wrap", fontSize: 13, lineHeight: 1.5 }}>{analysis}</div>}
            {winners && <div className="dg-box" style={{ padding: 14, marginTop: 10, whiteSpace: "pre-wrap", fontSize: 13, lineHeight: 1.5 }}><b>🏆 O que bomba:</b>{"\n"}{winners}</div>}
          </div>

          <div className="studio-section studio-section--pad">
            <div className="studio-section-head">
              <h3>Posts</h3><p>ordenar por</p>
              <span className="spacer" />
              {(["score", "reach", "saved", "shares"] as const).map((k) => (
                <button key={k} className={"studio-mini-btn" + (sortBy === k ? " is-active" : "")} onClick={() => setSortBy(k)} style={sortBy === k ? { borderColor: "var(--dg-red)", color: "var(--dg-red)" } : undefined}>{k === "score" ? "performance" : k}</button>
              ))}
            </div>
            <div className="media-grid">
              {posts.map((p) => (
                <a key={p.id} href={p.permalink} target="_blank" rel="noreferrer" className="media-tile" style={{ aspectRatio: "1", textDecoration: "none" }} title={p.caption}>
                  {p.thumbnail && <img src={p.thumbnail} alt="" />}
                  <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg,transparent 40%,rgba(0,0,0,.82))", display: "flex", flexDirection: "column", justifyContent: "flex-end", padding: 6, color: "#fff", fontSize: 10, fontWeight: 700 }}>
                    <span>👁 {p.reach ?? "-"} · 🔖 {p.saved ?? "-"} · ↗ {p.shares ?? "-"}</span>
                    <span>❤ {p.likes ?? "-"} · 💬 {p.comments ?? "-"}</span>
                  </div>
                </a>
              ))}
            </div>
          </div>

          <div className="studio-section studio-section--pad">
            <div className="studio-section-head"><h3>Plano B · sem API</h3><p>diagnóstico por prints dos Insights</p></div>
            <p className="studio-note">Se preferir não usar a API, suba prints dos seus Insights que a IA lê e analisa.</p>
            <input type="file" accept="image/*" multiple onChange={async (e) => {
              const files = Array.from(e.target.files || []);
              if (!files.length) return;
              setBusy("print"); setMsg("");
              const images = await Promise.all(files.slice(0, 8).map((f) => new Promise<string>((res) => { const rd = new FileReader(); rd.onload = () => res(String(rd.result)); rd.readAsDataURL(f); })));
              const r = await fetch("/api/instagram/print", { method: "POST", body: JSON.stringify({ images }) }).then((r) => r.json());
              setBusy(""); if (r.error) return setMsg(r.error);
              setAnalysis(r.analysis?.text || "");
            }} />
            {busy === "print" && <p className="studio-note">lendo os prints...</p>}
          </div>

          <button className="studio-danger-btn" style={{ alignSelf: "flex-start" }} onClick={async () => { await fetch("/api/instagram/connect", { method: "DELETE" }); load(); }}>Desconectar Instagram</button>
        </>
      )}
    </div>
  );
}
