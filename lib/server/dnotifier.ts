import "server-only";
import { DNotifier } from "@dnotifier-realtime/dnotifier";

/** Create an authenticated HTTP client from a Next.js server route or worker. */
export async function connectDNotifier(userId: string): Promise<DNotifier> {
  const appId = process.env.DNOTIFIER_APP_ID?.trim();
  const secret = process.env.DNOTIFIER_SECRET?.trim();
  if (!appId || !secret) {
    throw new Error("Set DNOTIFIER_APP_ID and DNOTIFIER_SECRET on the server.");
  }
  if (!userId.trim())
    throw new Error("A non-empty DNotifier user ID is required.");

  const client = new DNotifier({
    appId,
    secret,
    userId,
    transport: "http",
    logs: true,
    // SDK 1.1.25 types require these keys, although HTTP doesn't use them.
    // undefined retains the SDK defaults; no custom service URL is supplied.
    url: undefined,
    WebSocketImpl: undefined,
    onConnected: () => {},
    onMessage: () => {},
    onDisconnected: () => {},
  });

  await client.connect();
  if (!client.isConnected)
    throw new Error("DNotifier did not confirm authentication.");
  return client;
}
