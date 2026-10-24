// Explicit live upload. Usage: node --env-file=.env.local scripts/upload-hotel-faq.mjs --create
// Later edits use --update. Never automatically retry create after ambiguous errors.
import {readFile,writeFile,mkdir,rename} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {DNotifier} from '@dnotifier-realtime/dnotifier';
import {SOURCE,PDF_NAME} from './lib/hotel-faq.mjs';
const mode=process.argv[2];
if(!['--create','--update'].includes(mode)){console.error('Choose --create for first import, or --update for existing records.');process.exit(1);}
const appId=process.env.DNOTIFIER_APP_ID?.trim(),secret=process.env.DNOTIFIER_SECRET?.trim();
if(!appId||!secret){console.error('Set both DNotifier credentials in .env.local.');process.exit(1);}
const senderId=process.env.DNOTIFIER_KB_USER_ID?.trim()||'nexa-knowledge';
const redact=x=>String(x).split(secret).join('[redacted]').split(appId).join('[redacted]');
function validateReply(reply){const data=reply?.data??reply;if(data?.type==='error'||reply?._responseCode>=400)throw new Error('Service rejected operation: '+redact(data?.message||'Unknown service error.'));}
try{
 const manifest=JSON.parse(await readFile('.knowledge-cache/aster-house-faq.json','utf8'));
 const bytes=await readFile('data/knowledge/'+PDF_NAME);
 if(createHash('sha256').update(bytes).digest('hex')!==manifest.pdf_sha256)throw new Error('PDF changed. Run extraction again before upload.');
 const records=manifest.records;
 if(manifest.source!==SOURCE || !Array.isArray(records)||records.length!==24 || records.some((r,i)=>r.recordId!==SOURCE+'-faq-'+String(i+1).padStart(2,'0')||typeof r.content!=='string'||!r.content.trim()||r.metadata?.source!==SOURCE))throw new Error('Invalid extraction manifest. Run extraction again.');
 const scope=createHash('sha256').update(appId+'\n'+senderId+'\n'+SOURCE).digest('hex').slice(0,24);
 const statePath='.knowledge-cache/upload-'+scope+'.json';
 let state={attempted:[],accepted:[]};
 try{state=JSON.parse(await readFile(statePath,'utf8'));}catch(e){if(e.code!=='ENOENT')throw e;}
 if(mode==='--create'&&state.attempted.length)throw new Error('A create was already attempted for this app/identity/source. Do not create again. Review the saved upload state; use --update for existing records.');
 const client=new DNotifier({appId,secret,userId:senderId,transport:'http',logs:true,onConnected:()=>{},onMessage:()=>{},onDisconnected:()=>{}});
 await client.connect();
 const limit=client.getPlanLimits()?.knowledgeBaseMaxWords;
 const words=records.reduce((n,r)=>n+r.content.split(/\s+/).length,0);
 if(!Number.isFinite(limit)||limit<=0||words>limit)throw new Error('Document exceeds or lacks confirmed knowledge-base capacity.');
 console.log(`Submitting ${records.length} records, ${words} words. Plan capacity is not remaining usage.`);
 await mkdir('.knowledge-cache',{recursive:true});
 async function save(){await writeFile(statePath+'.tmp',JSON.stringify(state,null,2));await rename(statePath+'.tmp',statePath);}
 for(const record of records){
   if(mode==='--create'){state.attempted.push(record.recordId);await save();}
   const options={senderId,...record};
   const reply=mode==='--create'?await client.addDocument(options):await client.updateDocument(options);
   validateReply(reply);
   if(!state.accepted.includes(record.recordId))state.accepted.push(record.recordId);
   await save();
   console.log('Accepted:',record.recordId);
 }
 console.log('All document requests accepted. Semantic-search verification is still required.');
 console.log('Source filter:',SOURCE);
}catch(error){
 const message=String(error.message||'');
 if(/PDF changed|Invalid extraction|already attempted|capacity|Service rejected/.test(message))console.error(redact(message));
 else console.error('Upload stopped. Check credentials, network and local manifest. No automatic retry was made.');
 console.error('For partial imports, inspect .knowledge-cache upload state before retrying.');process.exitCode=1;
}
