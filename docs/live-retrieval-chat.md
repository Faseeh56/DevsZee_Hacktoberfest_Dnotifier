# Local retrieval chat
Set NEXT_PUBLIC_CHAT_USE_MOCK=false in .env.local, leave NEXT_PUBLIC_USE_MOCK=true and restart npm run dev. The new flag affects chat only. Owner navigation and the direct dashboard route's mock data are hidden in this mode. DNotifier credentials stay server-only.

Try: How much does a Standard Queen room cost per night? What is the free cancellation deadline? What is the hotel's annual revenue?

The API searches the already indexed aster-house-lahore-v1 source and returns the original attributed FAQ text. It performs no generated-answer/model calls. Topic gating is deterministic and limited to the hotel's FAQ, not the planned ROUTER agent. Unknown topics, booking actions and insufficient matching evidence require human assistance; no lead is saved or notification sent. The handoff text makes no follow-up promise.

A provisional 0.35 similarity floor is combined with a topic/FAQ allowlist and a fixed business-content prefix. This is a conservative demo policy based on the observed price/cancellation/revenue results, not a universally calibrated confidence threshold. Test more positive and negative examples before expanding use. Source filtering does not establish tenant authorization.

API contract remains POST /api/chat {sessionId,message} -> {reply,intent}. SDK error envelopes and malformed results become HTTP 503. Two active search calls per server instance are allowed. The browser has a 30-second request timeout; a timed-out search may continue remotely. No automatic retry occurs.

This is a public hackathon FAQ retrieval demo, not a production authenticated multi-tenant support service. Persistent lead storage, alerts, AI routing/extraction and generated answers are still unfinished. Supabase credentials are not needed for this narrowed retrieval demo.

Deployment: set NEXT_PUBLIC_CHAT_USE_MOCK=false, NEXT_PUBLIC_USE_MOCK=true, DNOTIFIER_APP_ID and DNOTIFIER_SECRET in Vercel, with the same optional DNOTIFIER_KB_USER_ID used at ingestion. Rebuild after changing public flags. Test the deployed URL. Do not upload documents again.
