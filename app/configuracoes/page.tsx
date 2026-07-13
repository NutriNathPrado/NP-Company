"use client";

import { useEffect, useRef, useState } from "react";
import { toast } from "@/lib/toast";

type ThemeMode = "light" | "dark" | "system";
type Settings = { menuTitle: string; menuSubtitle: string; footerTitle: string; footerNote: string; logo?: string };
const defaults: Settings = { menuTitle: "NATH COMPANY", menuSubtitle: "Studio", footerTitle: "Nath Prado Studio", footerNote: "Seu espaço de criação" };

function applyTheme(mode: ThemeMode) {
  const dark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  document.documentElement.dataset.themeMode = mode;
  document.documentElement.dataset.theme = mode === "system" ? (dark ? "dark" : "light") : mode;
  localStorage.setItem("np-theme-mode", mode);
}

export default function SettingsPage() {
  const fileRef = useRef<HTMLInputElement>(null);
  const [settings, setSettings] = useState<Settings>(defaults);
  const [mode, setMode] = useState<ThemeMode>(() => {
    if (typeof window === "undefined") return "system";
    const saved = localStorage.getItem("np-theme-mode");
    return saved === "light" || saved === "dark" || saved === "system" ? saved : "system";
  });
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    fetch("/api/studio-settings").then((r) => r.json()).then((d) => d.settings && setSettings(d.settings)).catch(() => {});
  }, []);

  async function chooseLogo(file?: File) {
    if (!file) return; setBusy(true);
    try { const form = new FormData(); form.set("file", file); const response = await fetch("/api/upload", { method: "POST", body: form }); const data = await response.json(); if (!response.ok) throw new Error(data.error); setSettings((value) => ({ ...value, logo: data.src })); }
    catch (error) { toast(error instanceof Error ? error.message : "Não foi possível carregar a logo.", "err"); }
    finally { setBusy(false); }
  }

  async function save() {
    if (busy) return; setBusy(true);
    try { const response = await fetch("/api/studio-settings", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(settings) }); const data = await response.json(); if (!response.ok) throw new Error(data.error); setSettings(data.settings); window.dispatchEvent(new CustomEvent("studio-settings", { detail: data.settings })); toast("Configurações salvas."); }
    catch (error) { toast(error instanceof Error ? error.message : "Não foi possível salvar.", "err"); }
    finally { setBusy(false); }
  }

  return <div className="ig-dashboard"><header className="ig-header"><div><span>PERSONALIZAÇÃO</span><h1>Configurações do Studio</h1><p>Ajuste o menu, o rodapé e a aparência do aplicativo.</p></div></header>
    <section className="ig-section"><div className="ig-section-head"><div><h2>Aparência</h2><p>O modo automático acompanha a preferência do seu sistema.</p></div></div><div className="settings-theme-grid">{([['light','Claro','Interface clara e alto contraste'],['system','Automático','Segue o sistema'],['dark','Escuro','Interface grafite']] as const).map(([value,title,note]) => <button type="button" key={value} className={mode === value ? "is-active" : ""} onClick={() => { setMode(value); applyTheme(value); }}><span>{title}</span><small>{note}</small></button>)}</div></section>
    <section className="ig-section"><div className="ig-section-head"><div><h2>Identidade do menu</h2><p>Esses dados aparecem no topo e no rodapé fixo do menu.</p></div></div><div className="settings-layout"><div className="settings-logo"><div>{settings.logo ? <img src={settings.logo} alt="Prévia da logo" /> : <img src="/logo/np-logo.png" alt="Logo atual" />}</div><input ref={fileRef} type="file" accept="image/*" hidden onChange={(e) => chooseLogo(e.target.files?.[0])} /><button type="button" className="ig-btn" disabled={busy} onClick={() => fileRef.current?.click()}>trocar logo</button>{settings.logo && <button type="button" className="ig-btn ig-btn--quiet" onClick={() => setSettings((value) => ({ ...value, logo: undefined }))}>usar logo padrão</button>}</div><div className="ig-form-grid"><label><span>Título do menu</span><input className="studio-input" value={settings.menuTitle} onChange={(e) => setSettings({ ...settings, menuTitle: e.target.value })} /></label><label><span>Subtítulo do menu</span><input className="studio-input" value={settings.menuSubtitle} onChange={(e) => setSettings({ ...settings, menuSubtitle: e.target.value })} /></label><label><span>Título do rodapé</span><input className="studio-input" value={settings.footerTitle} onChange={(e) => setSettings({ ...settings, footerTitle: e.target.value })} /></label><label><span>Texto auxiliar do rodapé</span><input className="studio-input" value={settings.footerNote} onChange={(e) => setSettings({ ...settings, footerNote: e.target.value })} /></label></div></div><div className="ig-actions"><button type="button" className="ig-btn ig-btn--primary" disabled={busy} onClick={save}>{busy ? "salvando..." : "salvar configurações"}</button></div></section>
  </div>;
}
