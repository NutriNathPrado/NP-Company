// Helpers da Graph API oficial da Meta (Instagram business/creator).
// Fluxo validado: token curto -> longo -> me/accounts (Página) -> instagram_business_account
// -> perfil + últimos ~25 posts com insights (best effort, tolerante a métrica faltando).
import type { IgConfig, IgSnapshot, IgPost } from "./store";

const G = "https://graph.facebook.com/v21.0";

async function gget(path: string, params: Record<string, string>): Promise<Record<string, unknown>> {
  const qs = new URLSearchParams(params).toString();
  const res = await fetch(`${G}/${path}?${qs}`);
  const d = (await res.json()) as Record<string, unknown>;
  const err = d.error as { message?: string } | undefined;
  if (!res.ok || err) throw new Error(err?.message || `Graph API ${res.status}`);
  return d;
}

// troca o token curto do Graph API Explorer por um long-lived (~60 dias)
export async function exchangeToken(appId: string, appSecret: string, shortToken: string): Promise<{ token: string; expiresIn?: number }> {
  const d = await gget("oauth/access_token", {
    grant_type: "fb_exchange_token",
    client_id: appId,
    client_secret: appSecret,
    fb_exchange_token: shortToken,
  });
  return { token: String(d.access_token), expiresIn: d.expires_in as number | undefined };
}

// acha a Página do Facebook e a conta Instagram business ligada a ela
export async function discoverIg(userToken: string): Promise<{ pageId: string; pageToken: string; igUserId: string; username: string }> {
  const acc = await gget("me/accounts", { fields: "name,access_token,instagram_business_account", access_token: userToken });
  const data = (acc.data as Array<Record<string, unknown>>) || [];
  const page = data.find((p) => p.instagram_business_account) || data[0];
  if (!page) throw new Error("Nenhuma Página do Facebook encontrada nesse token. Ligue seu Instagram a uma Página.");
  const iba = page.instagram_business_account as { id: string } | undefined;
  if (!iba) throw new Error("A Página não tem uma conta Instagram business/creator vinculada.");
  const pageToken = String(page.access_token);
  const prof = await gget(String(iba.id), { fields: "username", access_token: pageToken });
  return { pageId: String(page.id), pageToken, igUserId: String(iba.id), username: String(prof.username) };
}

// token de Página derivado do token de usuário (não expira enquanto o de usuário valer)
async function pageToken(cfg: IgConfig): Promise<string> {
  const acc = await gget("me/accounts", { fields: "id,access_token", access_token: cfg.token });
  const data = (acc.data as Array<Record<string, unknown>>) || [];
  const page = data.find((p) => String(p.id) === cfg.pageId) || data[0];
  if (!page) throw new Error("Página não encontrada — reconecte o Instagram.");
  return String(page.access_token);
}

const METRICS = "reach,saved,shares,total_interactions,views";
const METRICS_FALLBACK = "reach,saved,shares,total_interactions";

// puxa perfil + últimos N posts com métricas reais. Tolerante: se uma métrica faltar, ignora.
export async function fetchSnapshot(cfg: IgConfig, limit = 25): Promise<IgSnapshot> {
  const tok = await pageToken(cfg);
  const prof = await gget(cfg.igUserId, { fields: "username,followers_count,media_count,profile_picture_url", access_token: tok });
  const media = await gget(`${cfg.igUserId}/media`, {
    fields: "id,caption,media_type,media_product_type,timestamp,permalink,thumbnail_url,media_url,like_count,comments_count",
    limit: String(limit),
    access_token: tok,
  });
  const items = (media.data as Array<Record<string, unknown>>) || [];
  const posts: IgPost[] = [];
  for (const m of items) {
    const post: IgPost = {
      id: String(m.id),
      caption: m.caption as string | undefined,
      mediaType: (m.media_product_type as string) || (m.media_type as string),
      timestamp: m.timestamp as string | undefined,
      permalink: m.permalink as string | undefined,
      thumbnail: (m.thumbnail_url as string) || (m.media_url as string) || undefined,
      likes: m.like_count as number | undefined,
      comments: m.comments_count as number | undefined,
    };
    // insights (best effort: tenta com views, cai pro fallback, e se ainda falhar ignora)
    for (const metric of [METRICS, METRICS_FALLBACK]) {
      try {
        const ins = await gget(`${m.id}/insights`, { metric, access_token: tok });
        for (const row of (ins.data as Array<Record<string, unknown>>) || []) {
          const name = String(row.name);
          const values = row.values as Array<{ value: number }> | undefined;
          const v = values?.[0]?.value;
          if (typeof v !== "number") continue;
          if (name === "reach") post.reach = v;
          else if (name === "saved") post.saved = v;
          else if (name === "shares") post.shares = v;
          else if (name === "total_interactions") post.totalInteractions = v;
          else if (name === "views") post.views = v;
        }
        break; // deu certo, não tenta o fallback
      } catch {
        // tenta o próximo conjunto de métricas
      }
    }
    posts.push(post);
  }
  return {
    updatedAt: new Date().toISOString(),
    profile: {
      username: String(prof.username),
      followers: (prof.followers_count as number) || 0,
      mediaCount: (prof.media_count as number) || 0,
      picture: prof.profile_picture_url as string | undefined,
    },
    posts,
  };
}

// pontuação de performance real de um post (mesma fórmula do ranking de campeões)
export function igScore(p: IgPost): number {
  const reach = p.reach || 0;
  const saved = p.saved || 0;
  const shares = p.shares || 0;
  const interactions = p.totalInteractions ?? ((p.likes || 0) + (p.comments || 0) + saved + shares);
  const engRate = reach > 0 ? interactions / reach : 0;
  return reach + saved * 15 + shares * 20 + engRate * 5000;
}
