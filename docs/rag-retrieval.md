# RAG retrieval checkpoint

This is the retrieval foundation, not complete generated-answer RAG. DNotifier's missing generation provider remains unresolved. The chat UI stays in mock mode; no public ingestion/search endpoint is introduced.

## Check locally

Use the existing .env.local App ID/App Secret. No new dependencies are needed.

```bash
npm run test:rag
npm run check:rag
```

The tests substitute SDK methods and block network calls. The LIVE check uploads a tiny verification document, searches it and deletes its uniquely generated document ID. These API operations can consume provider quota. It never calls sendAI and never uploads business/customer records. The record ID is printed for manual cleanup if deletion fails or a timeout interrupts it.

Success requires the search result to contain a unique reference included in the uploaded text. No undocumented result-field layout is assumed. Otherwise the script exits with an unconfirmed result and prints structure only, or a redacted service error. If indexing/search require an embedding provider, this check may reveal another configuration requirement. Do not treat authentication or request acceptance as evidence that indexing/search worked.

Indexing may be asynchronous. This single-pass check does not poll or retry automatically. A missing marker may also mean results contain document IDs only. Share the diagnostic output so we can inspect the actual service schema before wiring customer answers.

## Server helpers

lib/server/knowledge-base.ts provides addKnowledgeDocument(recordId, content, source) and searchKnowledgeBase(query, source), using the existing server-only connection helper. Both use the same server-owned identity: DNOTIFIER_KB_USER_ID when set, otherwise nexa-knowledge. Do not use arbitrary browser-supplied ownership IDs for document management.

These helpers currently return raw SDK results; API integration must validate envelopes and retrieved content after the live result shape is established. Source metadata/filtering selects documents; it must not be assumed to enforce tenant authorization. We have not yet verified the platform's app/user document scoping. Do not reuse this app across unrelated businesses before establishing that boundary.

The check uses its own unique source and record ID, never overwrites/deletes existing business records, and attempts cleanup even after indexing errors. If the process is terminated, use deleteDocument with the printed ID and same sender identity to clean up.

## Verified SDK calls

Official docs and installed SDK declarations verify:

- addDocument({ senderId, recordId, content, type, metadata })
- search({ senderId, query, limit, filterbySource })
- deleteDocument({ senderId, recordId })

References:
https://dnotifier.gitbook.io/product-docs/ai/manage-documents/javascript-typescript
https://dnotifier.gitbook.io/product-docs/reference/ai-methods/javascript-typescript

## Next steps after live verification

1. Ingest approved real business documents with stable IDs and controlled sources.
2. Verify matching and unrelated queries; define evidence-based retrieval acceptance rules.
3. Integrate source excerpts and human handoff into /api/chat, preserving the shared contract and lead routing.
4. Add generated grounded answers when a provider is configured, plus citations/observability and owner-side authorization.

Do not answer real fees/timings from verification text. An unrelated-query acceptance test and calibrated match policy are still required before customer use.
