import { NextRequest } from 'next/server';
import { EDEN_BASE, edenHeaders } from '@/lib/eden';

export const runtime = 'edge';

function textStream(s: string) {
  const enc = new TextEncoder();
  return new ReadableStream({
    start(controller) { controller.enqueue(enc.encode(s)); controller.close(); },
  });
}

export async function POST(req: NextRequest) {
  try {
    const { conversation_id, message } = await req.json();
    const r = await fetch(`${EDEN_BASE}/apis/modadata/chat/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...edenHeaders() },
      body: JSON.stringify({ conversation_id, message }),
    });
    if (!r.ok) return new Response(textStream(`[error ${r.status}] ${await r.text()}`));
    const data = await r.json().catch(() => ({}));
    const reply = data.reply ?? data.message ?? data.answer ?? JSON.stringify(data);
    return new Response(textStream(String(reply ?? '')), {
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    });
  } catch (e: any) {
    return new Response(textStream(`[client error] ${e?.message ?? e}`));
  }
}
