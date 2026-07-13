import { getStudioSettings, setStudioSettings, type StudioSettings } from "@/lib/store";

export const runtime = "nodejs";

export async function GET() {
  return Response.json({ settings: await getStudioSettings() });
}

export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as Partial<StudioSettings>;
  try {
    const current = await getStudioSettings();
    const settings = await setStudioSettings({ ...current, ...body });
    return Response.json({ settings });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Não foi possível salvar." }, { status: 500 });
  }
}
