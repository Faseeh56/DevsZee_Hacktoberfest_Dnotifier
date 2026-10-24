// Node-only, manual live check. Each run sends one short AI request.
import { randomUUID } from 'node:crypto';
import { DNotifier } from '@dnotifier-realtime/dnotifier';


// Describe structure only: no string values, tokens or raw response metadata.
function shape(value, depth = 0) {
  if (value === null) return 'null';
  if (typeof value === 'string') return { type: 'string', length: value.length };
  if (Array.isArray(value)) return { type: 'array', length: value.length, first: depth < 4 ? shape(value[0], depth + 1) : '…' };
  if (typeof value === 'object') return depth < 4 ? Object.fromEntries(Object.entries(value).slice(0, 20).map(([key, item]) => [key, shape(item, depth + 1)])) : 'object';
  return typeof value;
}

const appId = process.env.DNOTIFIER_APP_ID?.trim();
const secret = process.env.DNOTIFIER_SECRET?.trim();
if (!appId || !secret) {
  console.error('Set DNOTIFIER_APP_ID and DNOTIFIER_SECRET in .env.local.');
  process.exit(1);
}
const timeout = setTimeout(() => {
  console.error('AI check timed out after 60 seconds. A request may still have been processed; check dashboard usage before retrying.');
  process.exit(1);
}, 60_000);
let stage = 'authentication';
try {
  const userId = 'nexa-ai-check';
  const client = new DNotifier({
    appId, secret, userId, transport: 'http', logs: true,
    onConnected: () => {}, onMessage: () => {}, onDisconnected: () => {},
  });
  await client.connect();
  if (!client.isConnected) throw new Error();
  if (!client.getPlanLimits()?.aiEnabled) {
    console.error('Authentication works, but AI access is not enabled.');
    process.exitCode = 1;
  } else {
    stage = 'AI request';
    const sessionId = randomUUID();
    console.log('Authenticated. Sending one short AI prompt…');
    console.log('Session ID:', sessionId);
    const response = await client.sendAI({
      senderId: userId,
      sessionId,
      message: { text: 'Reply with exactly this sentence: Nexa AI is connected.' },
      saveHistory: true,
      // Omit provider/model to use the app's portal configuration.
    });
    // Official examples document these text fields; never dump raw metadata.
    const answer = response?.data?.content ?? response?.content;
    if (typeof answer !== 'string' || !answer.trim()) {
      console.error('AI returned no text in data.content or content.');
      console.error('Top-level response fields:', response && typeof response === 'object' ? Object.keys(response).join(', ') : typeof response);
      console.error('Data structure:', JSON.stringify(shape(response?.data)));
      if (typeof response?.data === 'string') {
        try { console.error('Decoded data structure:', JSON.stringify(shape(JSON.parse(response.data)))); } catch { /* Plain text isn't JSON. */ }
      }
      process.exitCode = 1;
    } else {
      // The prompt contains no business/customer data. Still redact known secrets.
      const safe = answer.split(secret).join('[redacted]').split(appId).join('[redacted]');
      console.log('AI:', safe);
      console.log('AI response received. Look for this session in DNotifier Logs.');
    }
  }
} catch {
  console.error(stage === 'authentication'
    ? 'Authentication failed. Check credentials and connectivity.'
    : 'AI request failed. Check the app’s configured model/provider, available quota, and DNotifier dashboard errors.');
  process.exitCode = 1;
} finally { clearTimeout(timeout); }
