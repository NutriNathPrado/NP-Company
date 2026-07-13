// Complementos OpenAI (o TEXTO final do conteúdo continua sendo do Claude).
// Usa fetch direto na API (sem SDK). Todas as rotas degradam com aviso se faltar OPENAI_API_KEY.
const BASE = "https://api.openai.com/v1";

export function hasOpenAI(): boolean {
  return !!process.env.OPENAI_API_KEY;
}
function key(): string {
  const k = process.env.OPENAI_API_KEY;
  if (!k) throw new Error("Sem OPENAI_API_KEY.");
  return k;
}

type ChatMsg = { role: "system" | "user" | "assistant"; content: unknown };

// chat completions; se json=true força objeto JSON e faz parse
export async function openaiChat(opts: { model?: string; messages: ChatMsg[]; json?: boolean; maxTokens?: number }): Promise<string> {
  const res = await fetch(`${BASE}/chat/completions`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${key()}` },
    body: JSON.stringify({
      model: opts.model || "gpt-4o-mini",
      messages: opts.messages,
      max_tokens: opts.maxTokens || 900,
      ...(opts.json ? { response_format: { type: "json_object" } } : {}),
    }),
  });
  const d = (await res.json()) as { choices?: { message?: { content?: string } }[]; error?: { message?: string } };
  if (!res.ok || d.error) throw new Error(d.error?.message || `OpenAI ${res.status}`);
  return d.choices?.[0]?.message?.content || "";
}

// gera imagem (gpt-image-1) e devolve o base64 png cru
export async function openaiImage(opts: { prompt: string; size?: string }): Promise<string> {
  const res = await fetch(`${BASE}/images/generations`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${key()}` },
    body: JSON.stringify({ model: "gpt-image-1", prompt: opts.prompt, size: opts.size || "1024x1024", n: 1 }),
  });
  const d = (await res.json()) as { data?: { b64_json?: string }[]; error?: { message?: string } };
  if (!res.ok || d.error) throw new Error(d.error?.message || `OpenAI image ${res.status}`);
  const b64 = d.data?.[0]?.b64_json;
  if (!b64) throw new Error("Imagem não retornada.");
  return b64;
}

// transcreve áudio/vídeo (whisper-1)
export async function openaiTranscribe(bytes: Uint8Array, filename: string): Promise<string> {
  const form = new FormData();
  form.append("file", new Blob([bytes as BlobPart]), filename);
  form.append("model", "whisper-1");
  const res = await fetch(`${BASE}/audio/transcriptions`, {
    method: "POST",
    headers: { Authorization: `Bearer ${key()}` },
    body: form,
  });
  const d = (await res.json()) as { text?: string; error?: { message?: string } };
  if (!res.ok || d.error) throw new Error(d.error?.message || `Whisper ${res.status}`);
  return d.text || "";
}
