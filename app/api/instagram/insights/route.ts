import { getIgSnapshot } from "@/lib/store";
import { refreshInstagramSnapshot } from "@/lib/instagram-refresh";

export const runtime = "nodejs";
export const maxDuration = 120;

// cache atual dos números
export async function GET() {
  const snap = await getIgSnapshot();
  return Response.json({ snapshot: snap });
}

// atualiza os números da API (e renova o token se faltar < 7 dias)
export async function POST() {
  try {
    const snap = await refreshInstagramSnapshot();
    return Response.json({ snapshot: snap });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e);
    return Response.json({ error: message }, { status: message === "Instagram não conectado." ? 400 : 500 });
  }
}
