import { NextRequest, NextResponse } from 'next/server';
import { EDEN_BASE, edenHeaders } from '@/lib/eden';

export const runtime = 'edge';

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const r = await fetch(`${EDEN_BASE}/apis/modadata/conversation/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...edenHeaders() },
    body: JSON.stringify({ name: body?.name }),
  });
  if (!r.ok) return NextResponse.json({ error: await r.text() }, { status: r.status });
  return NextResponse.json(await r.json());
}

export async function GET(req: NextRequest) {
  const id = new URL(req.url).searchParams.get('conversation_id') ?? '';
  const r = await fetch(`${EDEN_BASE}/apis/modadata/conversation/?conversation_id=${encodeURIComponent(id)}`, {
    headers: edenHeaders(),
    cache: 'no-store',
  });
  if (!r.ok) return NextResponse.json({ error: await r.text() }, { status: r.status });
  return NextResponse.json(await r.json());
}
