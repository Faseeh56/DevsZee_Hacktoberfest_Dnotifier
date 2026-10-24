import { NextResponse } from 'next/server';
import { searchKnowledgeBase } from '@/lib/server/knowledge-base';
import { allowedFaqs, selectEvidence } from '@/lib/server/retrieval-policy.mjs';

export const runtime = 'nodejs';
const handoff = () => NextResponse.json({ reply: 'I cannot confirm an answer from the hotel FAQ for this request. Please contact the business team for assistance. This chat cannot confirm bookings or arrange follow-up.', intent: 'needs_human' });
let activeRequests=0;
export async function POST(request: Request) {
 let body: unknown;
 try { body=await request.json(); } catch { return NextResponse.json({error:'Invalid JSON.'},{status:400}); }
 if (!body || typeof body!=='object') return NextResponse.json({error:'Invalid request.'},{status:400});
 const {sessionId,message}=body as Record<string,unknown>;
 if(typeof sessionId!=='string'||!sessionId.trim()||sessionId.length>200||typeof message!=='string'||!message.trim()||message.length>4000) return NextResponse.json({error:'Invalid session or message.'},{status:400});
 const allowed=allowedFaqs(message);
 if(!allowed.length)return handoff();
 if(activeRequests>=2)return NextResponse.json({error:'Please try again shortly.'},{status:429});
 activeRequests++;
 try {
   const result=await searchKnowledgeBase(message,'aster-house-lahore-v1');
   if(result?.data?.type==='error'||!Array.isArray(result?.data?.rows))throw new Error('Invalid search response');
   const hit=selectEvidence(result.data.rows,allowed);
   if(!hit)return handoff();
   const faq=hit.content.match(/FAQ-\d{2}/)?.[0];
   return NextResponse.json({reply:`From Aster House Lahore, ${faq} (fictional hotel):\n\n${hit.content.replace('Aster House Lahore (fictional business).','').trim()}`,intent:'faq'});
 } catch { return NextResponse.json({error:'Knowledge search is temporarily unavailable.'},{status:503}); }
 finally {activeRequests--;}
}
