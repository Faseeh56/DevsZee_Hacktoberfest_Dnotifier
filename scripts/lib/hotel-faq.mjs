export const SOURCE = 'aster-house-lahore-v1';
export const PDF_NAME = 'Aster_House_Lahore_Fictional_Business_FAQ.pdf';
export function splitFaqPages(pages) {
  const records=[];
  for(const page of pages){
    const text=page.text.replace(/\r/g,'');
    const headings=[...text.matchAll(/^FAQ-(\d{2})\s*\|\s*(.+)$/gm)];
    for(let i=0;i<headings.length;i++){
      const h=headings[i];
      const question=h[2].trim();
      const answer=text.slice(h.index+h[0].length,headings[i+1]?.index ?? text.length)
        .split('\n').filter(line=>!/^FICTIONAL BUSINESS|^NEXA\s*\/\s*KNOWLEDGE SOURCE/.test(line.trim())).join(' ').replace(/\s+/g,' ').trim();
      if(!question.endsWith('?') || answer.length<40)throw new Error('Malformed FAQ-'+h[1]);
      records.push({recordId:SOURCE+'-faq-'+h[1],content:`Aster House Lahore (fictional business).\nFAQ-${h[1]} | ${question}\n${answer}`,type:'text',metadata:{source:SOURCE,faq_id:'FAQ-'+h[1],page:page.num,filename:PDF_NAME,fictional:true,version:'1.0'}});
    }
  }
  if(records.length!==24)throw new Error(`Expected 24 FAQs, found ${records.length}. No upload should be attempted.`);
  records.forEach((r,i)=>{if(!r.recordId.endsWith('-'+String(i+1).padStart(2,'0')))throw new Error('Missing, duplicate or unordered FAQ IDs.');});
  return records;
}
