import test from 'node:test';
import assert from 'node:assert/strict';
import {splitFaqPages} from '../scripts/lib/hotel-faq.mjs';
const page=()=>({num:1,text:Array.from({length:24},(_,i)=>`FAQ-${String(i+1).padStart(2,'0')} | Is this question ${i+1}?\nThis is a sufficiently long fictional answer for validation only.`).join('\n')});
test('creates 24 stable IDs with whole questions, answers and source pages',()=>{const records=splitFaqPages([page()]);assert.equal(records.length,24);assert.equal(records[0].recordId,'aster-house-lahore-v1-faq-01');assert.equal(records[23].metadata.page,1);assert.ok(records.every(r=>r.metadata.fictional));});
test('fails closed if a FAQ is missing',()=>{const p=page();p.text=p.text.replace(/FAQ-24[\s\S]*/,'');assert.throws(()=>splitFaqPages([p]),/Expected 24/);});
test('rejects duplicate or out-of-order IDs',()=>{const p=page();p.text=p.text.replace('FAQ-02','FAQ-01');assert.throws(()=>splitFaqPages([p]),/duplicate/);});
test('rejects truncated answers',()=>{const p=page();p.text=p.text.replace('This is a sufficiently long fictional answer for validation only.','Short.');assert.throws(()=>splitFaqPages([p]),/Malformed/);});
