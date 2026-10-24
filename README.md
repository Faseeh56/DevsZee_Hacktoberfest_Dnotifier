# Nexa — Support & Lead Intelligence

**[Open the live app](https://devs-zee-hacktoberfest-dnotifier.vercel.app/)**

Nexa helps customers find answers in a business's own documents. Built for the **Best Use of DNotifier** hackathon category, the current implementation searches a fictional hotel's FAQ through DNotifier and returns attributed source text. Unsupported questions receive a human-assistance message.

## What works

- Mobile-friendly customer chat with light/dark themes, a browser-held session ID, typing indicator, and retry/error states.
- Server-side DNotifier authentication and semantic search.
- PDF extraction and ingestion of 24 FAQs for **Aster House Lahore**, an explicitly fictional hotel.
- Answers quoted from retrieved FAQ records, with their source FAQ identifiers.
- Deterministic topic checks and an evidence filter before displaying an answer.
- A separate local mock mode for developing the owner dashboard, lead statuses, and cross-tab alerts.

**Current scope:** answers are retrieved excerpts, not LLM-generated responses. AI agent routing, lead extraction, Supabase persistence, real owner notifications, and owner authentication are unfinished. A human-assistance message does not save a lead or notify an owner. The owner workspace is hidden in retrieval mode.

## Try it

Visit **https://devs-zee-hacktoberfest-dnotifier.vercel.app/** and ask:

| Question | Expected behavior |
| --- | --- |
| How much does a Standard Queen room cost per night? | FAQ-02: PKR 8,000 per room per night |
| What is the free cancellation deadline? | The documented 48-hour cancellation rule |
| What is the hotel's annual revenue? | Human-assistance message; no invented answer |

All hotel prices, policies, and contact details are fictional hackathon content. The app cannot confirm reservations or process payments.

## How DNotifier is used

1. The hotel PDF is extracted into individual FAQ records and uploaded to DNotifier's knowledge base.
2. The browser sends a question to our Next.js `POST /api/chat` route.
3. The server searches the indexed `aster-house-lahore-v1` source using the DNotifier JavaScript SDK.
4. Matching evidence passes a deterministic topic/FAQ gate and a provisional similarity filter.
5. The chat displays the attributed FAQ excerpt, or asks the customer to contact the business team.

DNotifier credentials stay on the server. The browser calls our API route directly.

The similarity floor is **not an accuracy score**. Retrieval has been smoke-tested with pricing, cancellation, and unsupported questions; precision and recall have not been measured on a representative evaluation set. The current topic rules can reject valid paraphrases.

## Stack

Next.js App Router · TypeScript · Tailwind CSS · `@dnotifier-realtime/dnotifier` · Vercel

Supabase is planned for lead storage and is not required for the current retrieval implementation.

## Run locally

Use Node.js 22.3+ in the Node 22 line, or Node 24, to support the PDF extraction dependency.

```bash
npm ci
cp -n .env.example .env.local
```

For live retrieval, set these values in `.env.local`:

```env
DNOTIFIER_APP_ID=your_app_id
DNOTIFIER_SECRET=your_app_secret
NEXT_PUBLIC_CHAT_USE_MOCK=false
NEXT_PUBLIC_USE_MOCK=true
```

If ingestion used a custom `DNOTIFIER_KB_USER_ID`, use that same value here. Otherwise the default is `nexa-knowledge`. The matching hotel source must already be indexed in your DNotifier app; see the ingestion guide below.

```bash
npm run dev
```

Open [localhost:3000](http://localhost:3000).

For frontend-only development without credentials, set **both** `NEXT_PUBLIC_CHAT_USE_MOCK=true` and `NEXT_PUBLIC_USE_MOCK=true`, then restart. This enables local mock chat and the owner dashboard at `/dashboard`. Mock leads and alerts are browser-local and do not represent backend integration.

Never commit `.env.local` or prefix DNotifier credentials with `NEXT_PUBLIC_`.

## Deploy on Vercel

Import this GitHub repository as a Next.js project. Use the directory containing `package.json` as the project root.

Add the four environment variables above to the **Production** environment, then deploy the latest `main` commit. Public flags are compiled into the frontend, so changing them requires a new build. The knowledge base remains in DNotifier; deployment does not require uploading the PDF again.

## Validation

```bash
npm run test:connection
npm run test:rag
node --test tests/hotel-faq.test.mjs tests/retrieval-policy.test.mjs
npm run typecheck
npm run build
```

Optional live authentication check:

```bash
npm run check:dnotifier
```

`npm run check:rag` creates, searches, and removes a temporary verification document. It changes the knowledge base and is separate from the offline tests above.

## Project map

| Path | Responsibility |
| --- | --- |
| `app/api/chat/route.ts` | Validate chat requests and return evidence or handoff |
| `lib/server/dnotifier.ts` | Server-only DNotifier connection |
| `lib/server/knowledge-base.ts` | Knowledge-base SDK calls |
| `lib/server/retrieval-policy.mjs` | Topic and evidence checks |
| `components/chat-panel.tsx` | Chat UI, session, loading, and retries |
| `components/dashboard.tsx` | Owner workspace for local mock development |
| `lib/api.ts` | UI adapter for API and mock modes |
| `scripts/extract-hotel-faq.mjs` | Extract and validate the PDF FAQs |
| `scripts/upload-hotel-faq.mjs` | Upload FAQ records |
| `data/knowledge/` | Fictional business source PDF |

## Further documentation

- [Live retrieval chat and limitations](docs/live-retrieval-chat.md)
- [Business knowledge ingestion](docs/business-knowledge-ingestion.md)
- [DNotifier connection setup](docs/dnotifier-connection.md)
- [Knowledge retrieval verification](docs/rag-retrieval.md)

This is a public hackathon prototype. Authentication, durable handoffs, shared lead storage, production abuse controls, and broader retrieval evaluation are needed before real customer use.
