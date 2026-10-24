import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { pathToFileURL, fileURLToPath } from 'node:url';
const root = fileURLToPath(new URL('../', import.meta.url));
const sdk = pathToFileURL(root + 'node_modules/@dnotifier-realtime/dnotifier/dist/dnotifier.js').href;
function run(mode) {
  // Substitute SDK methods before loading the CLI. No real auth or AI requests.
  const preload = `
    import {DNotifier} from ${JSON.stringify(sdk)};
    let calls=0;
    globalThis.fetch=()=>{throw new Error('Unexpected network request');};
    DNotifier.prototype.connect=async function(){this.isConnected=true;};
    DNotifier.prototype.getPlanLimits=()=>({aiEnabled:${mode !== 'disabled'}});
    DNotifier.prototype.sendAI=async function(options){
      calls++;
      if(calls!==1 || options.senderId!=='nexa-ai-check' || !options.sessionId || !options.saveHistory || !options.message.text) throw new Error('Invalid call');
      if(${JSON.stringify(mode)}==='failure')throw new Error('test-secret');
      if(${JSON.stringify(mode)}==='envelope-error')return {data:{type:'error',message:'Provider is not configured. test-secret',content:'This must not count as success'}};
      if(${JSON.stringify(mode)}==='empty')return {metadata:{token:'never-print-token'}};
      return ${mode === 'top' ? "{content:'Nexa AI is connected.'}" : "{data:{content:'Nexa AI is connected.'}}"};
    };
    process.on('exit',()=>{if(calls!==${mode === 'disabled' ? 0 : 1})process.exitCode=2;});
  `;
  const result=spawnSync(process.execPath,['--import','data:text/javascript,'+encodeURIComponent(preload),'scripts/check-ai.mjs'],{cwd:root,env:{...process.env,DNOTIFIER_APP_ID:'test-app',DNOTIFIER_SECRET:'test-secret'},encoding:'utf8',timeout:10000});
  assert.ifError(result.error);
  const output=result.stdout+result.stderr;
  assert.ok(!output.includes('test-secret'));
  assert.ok(!output.includes('never-print-token'));
  return {code:result.status,output};
}
for(const mode of ['nested','top'])test(`reads documented ${mode} text response`,()=>{const r=run(mode);assert.equal(r.code,0);assert.match(r.output,/Nexa AI is connected/);});
test('disabled AI prevents sending a prompt',()=>{const r=run('disabled');assert.equal(r.code,1);assert.match(r.output,/not enabled/);});
test('unexpected response fields fail without raw metadata',()=>{const r=run('empty');assert.equal(r.code,1);assert.match(r.output,/no text/);});
test('provider errors are reported without leaking raw errors',()=>{const r=run('failure');assert.equal(r.code,1);assert.match(r.output,/AI request failed/);});

test('error envelopes stay failures and report redacted service messages',()=>{const r=run('envelope-error');assert.equal(r.code,1);assert.match(r.output,/Response type: error/);assert.match(r.output,/Service message: Provider is not configured/);assert.ok(!r.output.includes('AI response received'));});
