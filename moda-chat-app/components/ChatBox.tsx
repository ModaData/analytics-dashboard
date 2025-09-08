'use client';

import { useEffect, useRef, useState } from 'react';

type Conv = { id?: string; conversation_id?: string; title?: string };
type Msg = { role: 'user' | 'assistant'; content: string };

export default function ChatBox() {
  const [convId, setConvId] = useState<string>('');
  const [convs, setConvs] = useState<Conv[]>([]);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Msg[]>([
    { role: 'assistant', content: 'Hi! Ask me anything about your supplier knowledge base.' },
  ]);
  const [busy, setBusy] = useState(false);
  const chatRef = useRef<HTMLDivElement>(null);

  useEffect(() => { listConversations().catch(console.warn); }, []);
  useEffect(() => { if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight; }, [messages]);

  async function listConversations() {
    const r = await fetch('/api/conversations', { cache: 'no-store' });
    const data = await r.json();
    const arr: Conv[] = Array.isArray(data) ? data : data.results || [];
    setConvs(arr);
    if (!convId && arr[0]) setConvId(arr[0].id || arr[0].conversation_id || '');
  }

  async function newConversation() {
    setBusy(true);
    try {
      const r = await fetch('/api/conversation', { method: 'POST' });
      const d = await r.json();
      const id = d.id || d.conversation_id;
      setConvId(id);
      await listConversations();
    } finally { setBusy(false); }
  }

  async function sendMessage() {
    const text = input.trim();
    if (!text) return;
    setInput('');
    setMessages(m => [...m, { role: 'user', content: text }]);
    let localConvId = convId;
    if (!localConvId) {
      const r = await fetch('/api/conversation', { method: 'POST' });
      const d = await r.json();
      localConvId = d.id || d.conversation_id;
      setConvId(localConvId);
      await listConversations();
    }
    setBusy(true);
    try {
      const r = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversation_id: localConvId, message: text }),
      });
      const reply = await r.text();
      setMessages(m => [...m, { role: 'assistant', content: reply || '[no reply]' }]);
    } catch (e: any) {
      setMessages(m => [...m, { role: 'assistant', content: 'Error: ' + (e?.message ?? e) }]);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="container">
      <div className="card">
        <div className="header">
          <div className="title">MODA Chat</div>
          <div className="row">
            <select className="select" value={convId} onChange={e => setConvId(e.target.value)}>
              <option value="">— Select conversation —</option>
              {convs.map((c, i) => (
                <option key={i} value={c.id || c.conversation_id}>
                  {c.title || `Conversation ${i + 1}`}
                </option>
              ))}
            </select>
            <button className="btn" onClick={newConversation} disabled={busy}>+ New</button>
          </div>
        </div>

        <div ref={chatRef} className="chat" aria-live="polite">
          {messages.map((m, i) => (
            <div key={i} className={`msg ${m.role === 'assistant' ? 'bot' : ''}`}>
              <div className="avatar" />
              <div className="bubble">{m.content}</div>
            </div>
          ))}
        </div>

        <div className="footer">
          <textarea
            placeholder="Ask about suppliers, parts, OEMs…"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
            disabled={busy}
          />
          <button className="btn primary" onClick={sendMessage} disabled={busy}>Send</button>
        </div>
      </div>
      <p className="small" style={{marginTop:8}}>
        End-user uploads are disabled. Admin ingestion happens elsewhere.
      </p>
    </div>
  );
}
