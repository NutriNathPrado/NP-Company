import { getIgConfig, setIgConfig, getIgSnapshot, setIgSnapshot } from "@/lib/store";
import { fetchSnapshot, exchangeToken } from "@/lib/instagram";

export const runtime = "nodejs";
export const maxDuration = 120;

// cache atual dos números
export async function GET() {
  const snap = await getIgSnapshot();
  return Response.json({ snapshot: snap });
}

// atualiza os números da API (e renova o token se faltar < 7 dias)
export async function POST() {
  const cfg = await getIgConfig();
  if (!cfg) return Response.json({ error: "Instagram não conectado." }, { status: 400 });
  try {
    // renova o token long-lived se estiver perto de expirar (< 7 dias)
    if (cfg.tokenExpiresAt) {
      const msLeft = new Date(cfg.tokenExpiresAt).getTime() - Date.now();
      if (msLeft < 7 * 24 * 3600 * 1000) {
        try {
          const { token, expiresIn } = await exchangeToken(cfg.appId, cfg.appSecret, cfg.token);
          cfg.token = token;
          cfg.tokenExpiresAt = expiresIn ? new Date(Date.now() + expiresIn * 1000).toISOString() : cfg.tokenExpiresAt;
          await setIgConfig(cfg);
        } catch { /* segue com o token atual */ }
      }
    }
    const snap = await fetchSnapshot(cfg, 25);
    await setIgSnapshot(snap);
    return Response.json({ snapshot: snap });
  } catch (e: unknown) {
    return Response.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 });
  }
}
