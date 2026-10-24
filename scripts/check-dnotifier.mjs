// Run in Node only: npm run check:dnotifier
// This authenticates once. It sends no AI prompt and ingests no documents.
import { DNotifier } from "@dnotifier-realtime/dnotifier";

const appId = process.env.DNOTIFIER_APP_ID?.trim();
const secret = process.env.DNOTIFIER_SECRET?.trim();
if (!appId || !secret) {
  console.error(
    "Missing credentials. Set DNOTIFIER_APP_ID and DNOTIFIER_SECRET in .env.local.",
  );
  process.exit(1);
}

// A CLI watchdog bounds a stalled auth request without inventing SDK options.
const timeout = setTimeout(() => {
  console.error(
    "DNotifier authentication timed out after 20 seconds. Check your network and try again.",
  );
  process.exit(1);
}, 20_000);

try {
  const client = new DNotifier({
    appId,
    secret,
    transport: "http",
    userId: "nexa-connection-check",
    logs: true,
    onConnected: () => {},
    onMessage: () => {},
    onDisconnected: () => {},
  });
  await client.connect();
  if (!client.isConnected) throw new Error("Authentication was not confirmed.");

  const limits = client.getPlanLimits();
  console.log("DNotifier authentication successful.");
  if (!limits) {
    console.warn(
      "Plan limits were not returned. Confirm AI access before running agents.",
    );
  } else {
    // Print only capability/quota fields, never credentials or auth tokens.
    console.log("AI enabled:", limits.aiEnabled);
    console.log("Monthly AI word limit:", limits.maxAIWordsPerMonth);
    console.log("Knowledge-base word limit:", limits.knowledgeBaseMaxWords);
    if (!limits.aiEnabled)
      console.warn(
        "Authentication works, but AI is disabled for this app. Ask the organizer to enable it.",
      );
  }
} catch {
  // Raw SDK errors can contain request internals: do not print them.
  console.error(
    "DNotifier authentication failed. Check both credential values and network access.",
  );
  process.exitCode = 1;
} finally {
  clearTimeout(timeout);
}
