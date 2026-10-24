// Node-only retrieval check: upload one tiny verification document, search, delete.
// No generation, business policies, customer data or sendAI calls are involved.
import { randomUUID } from 'node:crypto';
import { DNotifier } from '@dnotifier-realtime/dnotifier';
const appId=process.env.DNOTIFIER_APP_ID?.trim(), secret=process.env.DNOTIFIER_SECRET?.trim();
if(!appId || !secret){console.error('Set DNOTIFIER_APP_ID and DNOTIFIER_SECRET in .env.local.');process.exit(1);}
const senderId=process.env.DNOTIFIER_KB_USER_ID?.trim() || 'nexa-knowledge';
const recordId='nexa-rag-check-'+randomUUID(), source=recordId;
const marker='NEXA-'+randomUUID();
const redact=value=>String(value).split(secret).join('[redacted]').split(appId).join('[redacted]');
function checkError(result, operation){
 const data=result?.data ?? result;
 if(data?.type==='error' || result?._responseCode>=400)throw new Error(operation+': '+redact(data?.message || 'Service rejected the operation.'));
}
function containsMarker(value,depth=0){
 if(depth>12)return false;
 if(typeof value==='string')return value.includes(marker);
 if(value && typeof value==='object')return Object.values(value).some(v=>containsMarker(v,depth+1));
 return false;
}
function shape(value,depth=0){
 if(value===null)return 'null';
 if(Array.isArray(value))return {type:'array',length:value.length,first:depth<4?shape(value[0],depth+1):'…'};
 if(typeof value==='object')return depth<4?Object.fromEntries(Object.entries(value).slice(0,15).map(([k,v])=>[k,shape(v,depth+1)])):'object';
 return typeof value;
}
let stage='authentication',attempted=false;
const timer=setTimeout(()=>{console.error('Retrieval check timed out. Cleanup may be needed for document '+recordId);process.exit(1);},60000);
const client=new DNotifier({appId,secret,userId:senderId,transport:'http',logs:true,onConnected:()=>{},onMessage:()=>{},onDisconnected:()=>{}});
try{
 await client.connect();
 if(!client.isConnected)throw new Error('Authentication not confirmed.');
 const limits=client.getPlanLimits();
 if(!limits || !limits.aiEnabled || limits.knowledgeBaseMaxWords<=0)throw new Error('Knowledge-base capacity/access is not confirmed.');
 console.log('Verification document ID:',recordId);
 stage='document indexing';attempted=true;
 const added=await client.addDocument({senderId,recordId,content:'Retrieval verification only. The Nexa verification reference is '+marker+'. This is not a business policy.',type:'text',metadata:{source}});
 checkError(added,stage);
 console.log('Document request accepted.');
 stage='semantic search';
 const results=await client.search({senderId,query:'What is the Nexa verification reference?',limit:3,filterbySource:source});
 checkError(results,stage);
 console.log('Search result structure:',JSON.stringify(shape(results)));
 if(containsMarker(results))console.log('Retrieval confirmed: the search response contains the unique reference from our document.');
 else{console.error('Search returned, but the verification text was not found. Indexing may be asynchronous or the result schema may contain only IDs. Retrieval is not confirmed.');process.exitCode=2;}
}catch(error){
 console.error('Stopped during '+stage+'.');
 // Only explicitly checked service envelopes are shown; raw SDK errors stay private.
 if(error instanceof Error && (error.message.startsWith('document indexing:') || error.message.startsWith('semantic search:')))console.error(redact(error.message));
 else console.error('Check credentials, knowledge-base/embedding configuration and service availability.');
 process.exitCode=1;
}finally{
 if(attempted){
  try{const deleted=await client.deleteDocument({senderId,recordId});checkError(deleted,'cleanup');console.log('Verification document removed.');}
  catch{console.error('Cleanup not confirmed. Keep this document ID for removal: '+recordId);process.exitCode=1;}
 }
 clearTimeout(timer);
}
