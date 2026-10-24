// Offline extraction: never imports DNotifier or reads credentials.
import { readFile,writeFile,mkdir } from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {PDFParse} from 'pdf-parse';
import {splitFaqPages,SOURCE,PDF_NAME} from './lib/hotel-faq.mjs';
try{
 const data=await readFile('data/knowledge/'+PDF_NAME);
 const parser=new PDFParse({data});
 let pages;
 try {pages=(await parser.getText()).pages;}finally{await parser.destroy();}
 if(pages.length!==4)throw new Error('Expected the approved four-page source.');
 const records=splitFaqPages(pages);
 const manifest={source:SOURCE,pdf_sha256:createHash('sha256').update(data).digest('hex'),records};
 await mkdir('.knowledge-cache',{recursive:true});
 await writeFile('.knowledge-cache/aster-house-faq.json',JSON.stringify(manifest,null,2)+'\n');
 const words=records.reduce((n,r)=>n+r.content.split(/\s+/).length,0);
 console.log(`Offline validation passed: ${pages.length} pages, ${records.length} FAQs, ${words} words.`);
 console.log('Review file: .knowledge-cache/aster-house-faq.json');
 console.log('Source:',SOURCE);
 console.log('First record:',records[0].recordId);
 console.log('Last record:',records.at(-1).recordId);
 console.log('No documents were uploaded.');
}catch(error){console.error('Extraction failed:',error.message);process.exitCode=1;}
