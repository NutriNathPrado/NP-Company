import { createIgReport, deleteIgReport, listIgReports } from "@/lib/store";

export const runtime = "nodejs";

export async function GET() {
  return Response.json({ reports: await listIgReports() });
}

export async function POST() {
  try {
    const report = await createIgReport();
    if (!report) return Response.json({ error: "Atualize os Insights antes de criar um relatório." }, { status: 400 });
    return Response.json({ report });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Não foi possível criar o relatório." }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  const id = new URL(req.url).searchParams.get("id") || "";
  if (!id) return Response.json({ error: "Relatório não informado." }, { status: 400 });
  try {
    await deleteIgReport(id);
    return Response.json({ ok: true });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Não foi possível apagar o relatório." }, { status: 500 });
  }
}
