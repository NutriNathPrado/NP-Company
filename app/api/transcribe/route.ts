import { openaiTranscribe, hasOpenAI } from "@/lib/openai";

export const runtime = "nodejs";
export const maxDuration = 300;

const LIMIT = 25 * 1024 * 1024; // 25MB (limite do Whisper)

// transcreve vídeo/áudio de reel (multipart form-data, campo "file")
export async function POST(req: Request) {
  if (!hasOpenAI()) return Response.json({ error: "Sem OPENAI_API_KEY — configure pra transcrever.", degraded: true }, { status: 200 });
  let file: File | null = null;
  try {
    const form = await req.formData();
    file = form.get("file") as File | null;
  } catch {
    return Response.json({ error: "Envie o arquivo do reel (form-data)." }, { status: 400 });
  }
  if (!file) return Response.json({ error: "Nenhum arquivo enviado." }, { status: 400 });
  if (file.size > LIMIT) {
    return Response.json({ error: `O arquivo tem ${(file.size / 1048576).toFixed(1)}MB e o limite é 25MB. Comprima ou envie só o áudio.` }, { status: 400 });
  }
  try {
    const bytes = new Uint8Array(await file.arrayBuffer());
    const text = await openaiTranscribe(bytes, file.name || "reel.mp4");
    return Response.json({ text });
  } catch (e: unknown) {
    return Response.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 });
  }
}
