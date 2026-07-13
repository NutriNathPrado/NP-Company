import { refreshInstagramSnapshot } from "@/lib/instagram-refresh";

export const runtime = "nodejs";
export const maxDuration = 60;
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && request.headers.get("authorization") !== `Bearer ${cronSecret}`) {
    return Response.json({ error: "Não autorizado." }, { status: 401 });
  }
  try {
    const snapshot = await refreshInstagramSnapshot();
    return Response.json({ ok: true, updatedAt: snapshot.updatedAt });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Erro ao atualizar Insights." }, { status: 500 });
  }
}
