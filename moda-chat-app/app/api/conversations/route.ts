import { NextResponse } from 'next/server';
import { EDEN_BASE, edenHeaders } from '@/lib/eden';

export const runtime = 'edge';

export async function GET() {
  const r = await fetch(`${EDEN_BASE}/apis/modadata/conversations/`, {
    headers: edenHeaders(),
    cache: 'no-store',
  });
  if (!r.ok) return NextResponse.json({ error: await r.text() }, { status: r.status });
  return NextResponse.json(await r.json());
}
