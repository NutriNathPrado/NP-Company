import { openaiImage, hasOpenAI } from "@/lib/openai";
import sharp from "sharp";

export const runtime = "nodejs";
export const maxDuration = 120;

const SIZES: Record<string, string> = { retrato: "1024x1536", quadrado: "1024x1024", paisagem: "1536x1024" };

// gera um FUNDO de card (sem texto na imagem) e recomprime pra jpeg
export async function POST(req: Request) {
  if (!hasOpenAI()) return Response.json({ error: "Sem OPENAI_API_KEY — configure pra gerar fundos com IA.", degraded: true }, { status: 200 });
  const body = (await req.json().catch(() => ({}))) as { prompt?: string; shape?: string };
  const prompt = (body.prompt || "").trim();
  if (!prompt) return Response.json({ error: "Descreva o fundo que você quer." }, { status: 400 });
  const size = SIZES[body.shape || "retrato"] || SIZES.retrato;

  const fullPrompt = `${prompt}. Fotografia/arte de fundo para um card de Instagram, estética premium, sem NENHUM texto, letra, número ou logo na imagem. Composição com espaço para sobrepor texto depois.`;
  try {
    const b64 = await openaiImage({ prompt: fullPrompt, size });
    const jpeg = await sharp(Buffer.from(b64, "base64")).jpeg({ quality: 82 }).toBuffer();
    return Response.json({ dataUrl: `data:image/jpeg;base64,${jpeg.toString("base64")}` });
  } catch (e: unknown) {
    return Response.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 });
  }
}
