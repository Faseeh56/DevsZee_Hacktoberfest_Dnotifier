# First backend checkpoint: DNotifier authentication

This branch adds a server-only SDK helper and a local connection check. The chat/dashboard still use the local adapter; leave `NEXT_PUBLIC_USE_MOCK=true` until `/api/chat` and `/api/leads` are implemented.

## Install and configure

```bash
npm ci
```

Open your existing `.env.local`. Keep its current entries and add or update these two lines with your own values:

```env
DNOTIFIER_APP_ID=YOUR_APP_ID
DNOTIFIER_SECRET=YOUR_APP_SECRET
```

Do not copy these placeholder values unchanged. Do not prefix either key with NEXT_PUBLIC_. `.env.local` is ignored by Git. If the file does not exist, create it from `.env.example` first. Never overwrite an existing environment file to add these values.

## Run the check

```bash
npm run check:dnotifier
```

This runs a Node process, loads `.env.local`, and authenticates using HTTP transport. It sends no AI prompt, uploads no documents, and does not test agent output. Authentication itself may still be subject to the provider's quotas.

Expected output:

```text
DNotifier authentication successful.
AI enabled: true
Monthly AI word limit: <your plan's value>
Knowledge-base word limit: <your plan's value>
```

Plan limits are capacity settings, not remaining usage. If AI enabled is false, authentication still succeeded but your app needs AI access enabled. Missing credentials, rejected credentials and a 20-second timeout exit with a failure status. The script prints no app secret or auth token, and hides raw SDK errors. Prefer sharing only the final success/error message when asking for help.

## Server helper

`lib/server/dnotifier.ts` exports `connectDNotifier(userId)`. Future API routes can call it with a server-authorized user/session identifier, then use the returned authenticated SDK client. The import of `server-only` prevents this helper from being imported into a Next.js Client Component.

The installed SDK 1.1.25 declarations mark `url` and `WebSocketImpl` as required even though the official HTTP example omits them. The TypeScript helper supplies `undefined`, preserving SDK defaults without adding a socket dependency or overriding the service URL. This compatibility detail is isolated to the server helper.

`logs: true` enables SDK logging for subsequent supported AI requests. An authentication check is not an AI session/workflow; you should not expect router/FAQ/lead steps to appear in observability yet.

The CLI has a local watchdog. The SDK helper does not add request cancellation or retries; the future API integration must add appropriate timeout/rate-limit handling before public use. No public diagnostics endpoint was created.

## Verified interfaces

Official guides:

- https://dnotifier.gitbook.io/product-docs/getting-started/installation/javascript-typescript
- https://dnotifier.gitbook.io/product-docs/getting-started/first-connection/javascript-typescript
- https://dnotifier.gitbook.io/product-docs/platform-overview/developer-integration-guide

The SDK's installed declarations/runtime were also inspected to verify `connect()`, `isConnected` and `getPlanLimits()` and the HTTP options.

## Next milestone

Once authentication and AI access are confirmed locally, implement one server-side prompt using the official Send a prompt guide. Then add routing, grounded FAQ/handoff behavior, lead extraction, Supabase persistence and owner alerts in separate steps. Authentication success alone does not verify a configured model/provider or working agents.

## Local checks without credentials

```bash
npm run test:connection
npm run typecheck
npm run build
```

The connection tests replace fetch before loading the SDK. They verify missing/rejected credentials, enabled/disabled AI access, missing plan data and redaction. These tests never reach DNotifier and do not validate your actual account.
