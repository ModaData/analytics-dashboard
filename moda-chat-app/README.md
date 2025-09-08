# MODA Chat App (Next.js, chat-only)

A minimal chat UI wired to your EdenAI RAG endpoints. No user uploads.

## Endpoints
- GET  /apis/modadata/conversations/
- POST /apis/modadata/conversation/
- GET  /apis/modadata/conversation/?conversation_id=...
- POST /apis/modadata/chat/

## Run
```bash
cp .env.example .env.local
npm i
npm run dev
```

Open http://localhost:3000
