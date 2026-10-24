import 'server-only';
import { connectDNotifier } from './dnotifier';

// Use a consistent server-owned identity for ingestion and retrieval.
const ownerId = () => process.env.DNOTIFIER_KB_USER_ID?.trim() || 'nexa-knowledge';
export async function addKnowledgeDocument(recordId: string, content: string, source: string) {
  if (!recordId.trim() || !content.trim() || !source.trim()) throw new Error('Document ID, content and source are required.');
  const senderId = ownerId();
  const client = await connectDNotifier(senderId);
  return client.addDocument({ senderId, recordId, content, type: 'text', metadata: { source } });
}
export async function searchKnowledgeBase(query: string, source: string) {
  if (!query.trim() || !source.trim()) throw new Error('Query and source are required.');
  const senderId = ownerId();
  const client = await connectDNotifier(senderId);
  return client.search({ senderId, query, limit: 3, filterbySource: source });
}
// Raw results deliberately remain unparsed until the live response is verified.
// Future API routes must validate results and handle service error envelopes.
