export const EDEN_BASE = process.env.NEXT_PUBLIC_API_BASE!;
export const EDEN_TOKEN = process.env.EDEN_TOKEN;

export function edenHeaders(extra: Record<string, string> = {}) {
  return {
    ...(EDEN_TOKEN ? { Authorization: `Bearer ${EDEN_TOKEN}` } : {}),
    ...extra,
  };
}
