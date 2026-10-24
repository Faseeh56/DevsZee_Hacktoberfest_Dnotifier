import test from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {fileURLToPath,pathToFileURL} from 'node:url';
const root=fileURLToPath(new URL('../',import.meta.url));
const sdk=pathToFileURL(root+'node_modules/@dnotifier-realtime/dnotifier/dist/dnotifier.js').href;
function run(mode){
 const preload=`
 import {DNotifier} from ${JSON.stringify(sdk)};
 let document,deleted=false,searches=0;
 globalThis.fetch=()=>{throw new Error('No network allowed');};
 DNotifier.prototype.connect=async function(){this.isConnected=true;};
 DNotifier.prototype.getPlanLimits=()=>({aiEnabled:true,knowledgeBaseMaxWords:100000});
 DNotifier.prototype.sendAI=()=>{throw new Error('Generation is forbidden in retrieval check');};
 DNotifier.prototype.addDocument=async function(options){document=options;return ${mode==='index-error'?"{data:{type:'error',message:'Embedding configuration missing test-secret'}}":"{data:{type:'success'}}"};};
 DNotifier.prototype.search=async function(options){searches++;if(options.filterbySource!==document.metadata.source)throw new Error('Wrong source');return ${mode==='search-error'?"{data:{type:'error',message:'Search provider missing'}}":mode==='empty'?"{data:[]}":"{data:[{content:document.content}]}"};};
 DNotifier.prototype.deleteDocument=async function(options){if(options.recordId!==document.recordId)throw new Error('Wrong cleanup');deleted=true;return {data:{type:'success'}};};
 process.on('exit',()=>{if(!deleted || searches!==${mode==='index-error'?0:1})process.exitCode=9;});
 `;
 const r=spawnSync(process.execPath,['--import','data:text/javascript,'+encodeURIComponent(preload),'scripts/check-rag.mjs'],{cwd:root,env:{...process.env,DNOTIFIER_APP_ID:'test-app',DNOTIFIER_SECRET:'test-secret'},encoding:'utf8',timeout:10000});
 assert.ifError(r.error);const output=r.stdout+r.stderr;assert.ok(!output.includes('test-secret'));return {code:r.status,output};
}
test('verifies retrieved content and deletes only its own document',()=>{const r=run('success');assert.equal(r.code,0);assert.match(r.output,/Retrieval confirmed/);});
test('empty retrieval is not reported as success',()=>{const r=run('empty');assert.equal(r.code,2);assert.match(r.output,/Retrieval is not confirmed/);});
test('indexing error stops search and redacts credentials',()=>{const r=run('index-error');assert.equal(r.code,1);assert.match(r.output,/Embedding configuration missing/);});
test('search error is reported and document cleanup still runs',()=>{const r=run('search-error');assert.equal(r.code,1);assert.match(r.output,/Search provider missing/);});
