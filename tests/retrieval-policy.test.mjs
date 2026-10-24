import test from 'node:test';
import assert from 'node:assert/strict';
import {allowedFaqs,selectEvidence} from '../lib/server/retrieval-policy.mjs';
const hit=(id,score)=>({content:`Aster House Lahore (fictional business).\nFAQ-${id} | Verified question?\nVerified answer.`,similarity:score});
test('pricing query accepts observed price match',()=>assert.equal(selectEvidence([hit('02',0.4445)],allowedFaqs('How much does a Standard Queen room cost per night?'))?.similarity,0.4445));
test('cancellation query accepts observed match',()=>assert.ok(selectEvidence([hit('13',0.625)],allowedFaqs('What is the free cancellation deadline?'))));
test('annual revenue query has no accepted topic',()=>assert.deepEqual(allowedFaqs('What is the hotel’s annual revenue?'),[]));
test('wrong FAQ is rejected even at a high score',()=>assert.equal(selectEvidence([hit('18',0.9)],['02']),null));
test('weak match is handed off',()=>assert.equal(selectEvidence([hit('02',0.2)],['02']),null));
test('booking action requires human assistance',()=>assert.deepEqual(allowedFaqs('I want to book a Standard Queen room'),[]));
test('other business content is rejected',()=>assert.equal(selectEvidence([{content:'Other hotel FAQ-02 | Hello',similarity:0.99}],['02']),null));

