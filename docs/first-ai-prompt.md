# First AI prompt

Keep NEXT_PUBLIC_USE_MOCK=true. This checkpoint runs in Node only; it does not implement /api/chat or change the UI.

## Run locally

Use the existing .env.local containing DNOTIFIER_APP_ID and DNOTIFIER_SECRET.

```bash
npm run test:ai
npm run check:ai
```

The tests substitute SDK methods and make no network calls. The live command authenticates and sends ONE short prompt per run, consuming AI quota. It uses the app's default provider/model configured in the DNotifier portal. Authentication plus aiEnabled does not guarantee a configured working model.

Expected output includes a session ID and an AI answer such as “Nexa AI is connected.” Wording can vary; success here verifies that nonempty answer text was returned. logs:true and saveHistory:true are enabled. Check the printed session ID in dashboard Logs; model telemetry may depend on platform behavior. No router/workflow steps exist yet.

A 60-second watchdog stops a stalled CLI. It cannot cancel an already accepted remote request, so check usage before retrying. Raw errors and full response objects are not printed. If the response has no documented data.content/content string, share only the safe top-level field names shown so we can adjust the parser from evidence.

## Implementation

scripts/check-ai.mjs follows:
https://dnotifier.gitbook.io/product-docs/ai/send-prompt/javascript-typescript

Verified options: senderId, sessionId, message.text, saveHistory. Provider/model overrides are intentionally omitted to use your app configuration. Secrets remain in the Node process and no public endpoint is added.
