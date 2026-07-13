"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import Toaster from "@/components/Toaster";

// menu lateral + barra de título. Itens soltos (Link) e grupos accordion (expansíveis).
type NavItem = { v: string; label: string };
type NavGroup = { group: string; label: string; icon: string; items: NavItem[] };
type NavEntry = NavItem | NavGroup;

const NAV: NavEntry[] = [
  { v: "hoje", label: "Hoje" },
  { v: "perfil", label: "Perfil" },
  { group: "criacao", label: "Criação", icon: "criacao", items: [
    { v: "criar", label: "Carrossel" },
    { v: "reels", label: "Reels" },
    { v: "stories", label: "Stories" },
    { v: "direct", label: "Direct" },
  ] },
  { group: "sky", label: "Sky", icon: "sky", items: [
    { v: "biblioteca", label: "Biblioteca" },
    { v: "marca", label: "Marca" },
    { v: "fontes", label: "Fontes" },
    { v: "cerebro", label: "Cérebro" },
  ] },
  { v: "quadro", label: "Quadro" },
  { v: "calendario", label: "Calendário" },
  { v: "vault", label: "Vault" },
];

const TITLES: Record<string, [string, string]> = {
  hoje: ["Bem Vinda ao Nath Prado Studio", ""],
  criar: ["CARROSSEL", "roteiro, gancho e carrossel"],
  stories: ["STORIES", "ideias e sequências do dia a dia"],
  reels: ["REELS", "banco de ideias para gravar"],
  kit: ["KIT DA MARCA", "seus estilos salvos: ver, renomear, excluir"],
  quadro: ["QUADRO", "pipeline do conteúdo"],
  calendario: ["CALENDÁRIO", "agenda de publicação"],
  marca: ["MARCA", "identidade, pilares e pautas"],
  fontes: ["FONTES", "PDFs e artigos de base"],
  biblioteca: ["BIBLIOTECA", "fotos por categoria + identidade visual"],
  cerebro: ["CÉREBRO", "lado técnico, voz e estrutura"],
  vault: ["VAULT", "desempenho & aprendizado"],
  perfil: ["PERFIL", "Instagram: números reais e diagnóstico da IA"],
  direct: ["DIRECT", "responder DMs e parcerias na sua voz"],
};

type ThemeMode = "light" | "dark" | "system";

const THEME_OPTIONS: { value: ThemeMode; label: string }[] = [
  { value: "light", label: "Claro" },
  { value: "dark", label: "Escuro" },
  { value: "system", label: "Auto" },
];

// ícones de linha (stroke = currentColor): consistentes, herdam a cor do item (rosa quando ativo)
function Icon({ name }: { name: string }) {
  const c = { width: 18, height: 18, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.55, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  switch (name) {
    case "hoje": return (<svg {...c}><path d="M3 9.5 12 3l9 6.5" /><path d="M5 8.5V20a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V8.5" /><path d="M9.5 21v-6h5v6" /></svg>);
    case "criar": return (<svg {...c}><path d="M11 4H5a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2h13a2 2 0 0 0 2-2v-6" /><path d="M18.5 2.5a2.1 2.1 0 0 1 3 3L12 15l-4 1 1-4z" /></svg>);
    case "stories": return (<svg {...c}><circle cx="12" cy="12" r="9" /><path d="m10 8.5 5.5 3.5-5.5 3.5z" /></svg>);
    case "kit": return (<svg {...c}><rect x="3" y="6" width="13" height="13" rx="2" /><path d="M8 6V4a1 1 0 0 1 1-1h11a1 1 0 0 1 1 1v11a1 1 0 0 1-1 1h-2" /><circle cx="9.5" cy="12.5" r="2" /></svg>);
    case "quadro": return (<svg {...c}><rect x="3" y="3" width="18" height="18" rx="2" /><path d="M9 3v18M15 3v18" /></svg>);
    case "calendario": return (<svg {...c}><rect x="3" y="4.5" width="18" height="16.5" rx="2" /><path d="M3 9h18M8 2.5v4M16 2.5v4" /></svg>);
    case "marca": return (<svg {...c}><path d="M6 3h12l3.5 6L12 21 2.5 9z" /><path d="M2.5 9h19M9 3 6.5 9 12 21M15 3l2.5 6L12 21" /></svg>);
    case "fontes": return (<svg {...c}><path d="M3 4.5h6a3 3 0 0 1 3 3V21a2.5 2.5 0 0 0-2.5-2.5H3z" /><path d="M21 4.5h-6a3 3 0 0 0-3 3V21a2.5 2.5 0 0 1 2.5-2.5H21z" /></svg>);
    case "biblioteca": return (<svg {...c}><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><path d="m21 15-5-5L5 21" /></svg>);
    case "cerebro": return (<svg {...c}><rect x="5" y="5" width="14" height="14" rx="2" /><rect x="9" y="9" width="6" height="6" /><path d="M9 2v3M15 2v3M9 19v3M15 19v3M2 9h3M2 15h3M19 9h3M19 15h3" /></svg>);
    case "vault": return (<svg {...c}><path d="M4 10V8l8-5 8 5v2" /><path d="M5.5 10h13v9a2 2 0 0 1-2 2h-9a2 2 0 0 1-2-2z" /><path d="M9 15h6M12 12v6" /></svg>);
    case "reels": return (<svg {...c}><rect x="2" y="2" width="20" height="20" rx="4" /><path d="m10 8 6 4-6 4V8z" /><path d="M2 12h2M20 12h2M12 2v2M12 20v2" /></svg>);
    case "perfil": return (<svg {...c}><circle cx="12" cy="8" r="4" /><path d="M4 21v-1a6 6 0 0 1 6-6h4a6 6 0 0 1 6 6v1" /></svg>);
    case "direct": return (<svg {...c}><path d="M21 11.5a8.5 8.5 0 0 1-12.5 7.5L3 21l2-5.5A8.5 8.5 0 1 1 21 11.5z" /></svg>);
    case "criacao": return (<svg {...c}><path d="m12 2 9 5-9 5-9-5 9-5z" /><path d="m3 12 9 5 9-5" /><path d="m3 17 9 5 9-5" /></svg>);
    case "sky": return (<svg {...c}><path d="M17.5 19a4.5 4.5 0 0 0 .5-8.98A6 6 0 0 0 6.4 8.5 4 4 0 0 0 6.5 19h11z" /></svg>);
    default: return null;
  }
}

function applyTheme(mode: ThemeMode) {
  const root = document.documentElement;
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  root.dataset.themeMode = mode;
  root.dataset.theme = mode === "system" ? (prefersDark ? "dark" : "light") : mode;
}

function ThemeSwitch() {
  const [mode, setMode] = useState<ThemeMode>("system");

  useEffect(() => {
    const saved = window.localStorage.getItem("np-theme-mode") as ThemeMode | null;
    const initial = saved === "light" || saved === "dark" || saved === "system" ? saved : "system";
    setMode(initial);
    applyTheme(initial);
  }, []);

  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => {
      if ((window.localStorage.getItem("np-theme-mode") || "system") === "system") applyTheme("system");
    };
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, []);

  const select = (next: ThemeMode) => {
    setMode(next);
    window.localStorage.setItem("np-theme-mode", next);
    applyTheme(next);
  };

  return (
    <div className="dg-theme-switch" aria-label="Tema do site">
      {THEME_OPTIONS.map((option) => (
        <button
          key={option.value}
          type="button"
          className={mode === option.value ? "is-active" : ""}
          onClick={() => select(option.value)}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

export default function Shell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const cur = (pathname?.split("/")[1] || "hoje");
  const [title, sub] = TITLES[cur] || TITLES.hoje;
  const hidePageHead = cur === "stories" || cur === "reels";

  const groupWith = (v: string) => NAV.find((e): e is NavGroup => "group" in e && e.items.some((i) => i.v === v));
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(() => {
    const g = groupWith(cur);
    return g ? { [g.group]: true } : {};
  });
  useEffect(() => {
    const g = groupWith(cur);
    if (g) setOpenGroups((o) => (o[g.group] ? o : { ...o, [g.group]: true }));
  }, [cur]);
  const toggle = (g: string) => setOpenGroups((o) => ({ ...o, [g]: !o[g] }));

  return (
    <div className="dg-shell">
      <aside className="dg-sidebar">
        <Link href="/hoje" className="dg-brand">
          <img src="/logo/np-logo.png" alt="Nath Company" className="dg-brand-logo"
            onError={(e) => { e.currentTarget.style.display = "none"; const s = e.currentTarget.nextElementSibling as HTMLElement | null; if (s) s.style.display = "block"; }} />
          <span className="dg-brand-fallback">NP</span>
          <div className="dg-brand-copy">
            <span>NATH COMPANY</span>
            <small>Studio</small>
          </div>
        </Link>

        <nav className="dg-nav-list" aria-label="Menu principal">
          {NAV.map((entry) => {
            if ("v" in entry) {
              const active = cur === entry.v;
              return (
                <Link key={entry.v} href={`/${entry.v}`} className={"dg-nav" + (active ? " active" : "")}>
                  <span className="ico"><Icon name={entry.v} /></span>
                  {entry.label}
                </Link>
              );
            }
            const isOpen = !!openGroups[entry.group];
            const hasActive = entry.items.some((i) => i.v === cur);
            return (
              <div key={entry.group}>
                <button
                  type="button"
                  onClick={() => toggle(entry.group)}
                  aria-expanded={isOpen}
                  className="dg-nav"
                  style={{ width: "100%", background: "transparent", border: 0, font: "inherit", cursor: "pointer", textAlign: "left", color: hasActive ? "var(--dg-red)" : undefined }}
                >
                  <span className="ico"><Icon name={entry.icon} /></span>
                  {entry.label}
                  <span style={{ marginLeft: "auto", transition: "transform .15s ease", transform: isOpen ? "rotate(90deg)" : "none", opacity: 0.7, fontSize: 17, lineHeight: 1 }}>›</span>
                </button>
                {isOpen && (
                  <div style={{ display: "flex", flexDirection: "column", gap: 4, margin: "3px 0 4px 10px", paddingLeft: 8, borderLeft: "1px solid var(--dg-line)" }}>
                    {entry.items.map((i) => {
                      const active = cur === i.v;
                      return (
                        <Link key={i.v} href={`/${i.v}`} className={"dg-nav" + (active ? " active" : "")} style={{ minHeight: 38, fontSize: 14 }}>
                          <span className="ico"><Icon name={i.v} /></span>
                          {i.label}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        <div className="dg-user-card">
          <div
            className="dg-user-avatar"
            aria-hidden="true"
          >
            <span />
          </div>
          <div>
            <strong>Nath Prado Studio</strong>
          </div>
        </div>
      </aside>

      <main className="dg-main">
        {hidePageHead ? (
          <div className="dg-page-head dg-page-head--theme-only">
            <ThemeSwitch />
          </div>
        ) : (
          <div className="dg-page-head">
            <div className="dg-page-title">
              <span className="dg-page-mark" />
              <h1 className="dg-title">{title}</h1>
              {sub && <span>{sub}</span>}
            </div>
            <ThemeSwitch />
          </div>
        )}
        {children}
      </main>
      <Toaster />
    </div>
  );
}
