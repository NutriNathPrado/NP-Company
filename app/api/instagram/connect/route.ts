import { getIgConfig, setIgConfig, type IgConfig } from "@/lib/store";
import { exchangeToken, discoverIg } from "@/lib/instagram";

export const runtime = "nodejs";
export const maxDuration = 60;

// status da conexão (sem devolver segredos)
export async function GET() {
  const c = await getIgConfig();
  if (!c) return Response.json({ connected: false });
  return Response.json({
    connected: true,
    username: c.username,
    igUserId: c.igUserId,
    connectedAt: c.connectedAt,
    tokenExpiresAt: c.tokenExpiresAt,
  });
}

// conecta: troca token curto por longo, descobre a conta IG e salva
export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as { appId?: string; appSecret?: string; token?: string };
  const appId = (body.appId || "").trim();
  const appSecret = (body.appSecret || "").trim();
  const shortToken = (body.token || "").trim();
  if (!appId || !appSecret || !shortToken) {
    return Response.json({ error: "Informe App ID, App Secret e o token do Graph API Explorer." }, { status: 400 });
  }
  try {
    // troca por long-lived (~60 dias); se falhar (ex: token já é longo), usa o token como veio
    let token = shortToken;
    let expiresIn: number | undefined;
    try {
      const ex = await exchangeToken(appId, appSecret, shortToken);
      token = ex.token; expiresIn = ex.expiresIn;
    } catch { /* segue com o token informado */ }
    const { pageId, igUserId, username } = await discoverIg(token);
    const cfg: IgConfig = {
      appId, appSecret, token, igUserId, pageId, username,
      connectedAt: new Date().toISOString(),
      tokenExpiresAt: expiresIn ? new Date(Date.now() + expiresIn * 1000).toISOString() : undefined,
    };
    await setIgConfig(cfg);
    return Response.json({ connected: true, username, igUserId });
  } catch (e: unknown) {
    return Response.json({ error: e instanceof Error ? e.message : String(e) }, { status: 400 });
  }
}

export async function DELETE() {
  await setIgConfig(null);
  return Response.json({ connected: false });
}
