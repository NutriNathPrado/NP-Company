"use client";

import { useState } from "react";

type Opcao = { tom: string; texto: string };

export default function DirectPage() {
  const [modo, setModo] = useState<"dm" | "parceria">("dm");
  const [mensagem, setMensagem] = useState("");
  const [contexto, setContexto] = useState("");
  const [opcoes, setOpcoes] = useState<Opcao[]>([]);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  async function gerar() {
    if (!mensagem.trim()) return;
    setBusy(true); setMsg(""); setOpcoes([]);
    const r = await fetch("/api/assistant", { method: "POST", body: JSON.stringify({ modo, mensagem, contexto }) }).then((r) => r.json());
    setBusy(false);
    if (r.error) return setMsg(r.error);
    setOpcoes(r.opcoes || []);
  }

  return (
    <div className="studio-page">
      <div className="studio-hero">
        <div className="studio-hero__copy">
          <div className="studio-eyebrow">DIRECT</div>
          <h2>Assistente de Direct</h2>
          <p>Cole a mensagem que você recebeu e receba 3 respostas na sua voz. Venda consultiva sem ser pushy, ou condução de parceria com profissionalismo.</p>
        </div>
      </div>

      <div className="studio-section studio-section--pad">
        <div className="create-stepper" style={{ maxWidth: 360, marginBottom: 14 }}>
          <button className={"create-step" + (modo === "dm" ? " is-active" : "")} onClick={() => setModo("dm")}><span className="create-step-copy"><strong>DM / venda</strong></span></button>
          <button className={"create-step" + (modo === "parceria" ? " is-active" : "")} onClick={() => setModo("parceria")}><span className="create-step-copy"><strong>Parcerias</strong></span></button>
        </div>
        <textarea className="studio-textarea" rows={4} placeholder="Cole aqui a mensagem que você recebeu no Direct..." value={mensagem} onChange={(e) => setMensagem(e.target.value)} />
        <textarea className="studio-textarea" style={{ marginTop: 10 }} rows={2} placeholder="Contexto (opcional): o que você já sabe dessa pessoa, o que quer conduzir..." value={contexto} onChange={(e) => setContexto(e.target.value)} />
        <button className="hoje-action hoje-action--primary" style={{ marginTop: 12 }} disabled={busy} onClick={gerar}>{busy ? "Gerando..." : "Gerar 3 respostas"}</button>
        {msg && <p className="studio-note" style={{ marginTop: 10 }}>{msg}</p>}
      </div>

      {opcoes.map((o, i) => (
        <div key={i} className="studio-section studio-section--pad">
          <div className="studio-section-head">
            <h3 style={{ fontSize: 16 }}>{o.tom}</h3>
            <span className="spacer" />
            <button className="studio-mini-btn" onClick={() => navigator.clipboard.writeText(o.texto)}>copiar</button>
          </div>
          <div style={{ whiteSpace: "pre-wrap", fontSize: 14, lineHeight: 1.5 }}>{o.texto}</div>
        </div>
      ))}
    </div>
  );
}
