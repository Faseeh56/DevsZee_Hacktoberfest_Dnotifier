// Conservative, temporary topic gate for this fixed FAQ source; not an AI router.
export function allowedFaqs(message) {
 const q=message.toLowerCase();
 if (/annual revenue|profit|turnover|weather|stock price/.test(q)) return [];
 if (/want to (book|reserve)|book (me|a room|a stay)|make a (booking|reservation)|availability|available rooms|speak to|talk to|complaint|duplicate charge|approve.*refund/.test(q)) return [];
 const topics=[
 [/cancel|cancellation/,['13','14','15']],
 [/refund/,['13','14','16']],
 [/deposit|remaining balance/,['09']],
 [/breakfast/,['04']],
 [/check.?in|check.?out|late departure|early arrival/,['10','11']],
 [/standard queen|deluxe twin|family suite|room price|room rate|room cost|rooms cost|cost.*room|price.*room/,['02']],
 [/tax|service charge|meals|lunch|dinner/,['03']],
 [/discount|promo|extra bed|connecting room/,['05']],
 [/timezone|currency/,['06']],
 [/how.*book|booking process|request a booking/,['07','08']],
 [/identification|passport|cnic|minimum age/,['12']],
 [/change.*(date|room|guest)|modify/,['17']],
 [/payment|pay by|cash|credit card|bank transfer/,['18']],
 [/wifi|wi-fi|parking|pool|gym|amenities|spa/,['19']],
 [/pet|smoking/,['20']],
 [/airport|transfer|accessible|accessibility|step.free/,['21']],
 [/contact|email|phone|whatsapp|website|address/,['22','24']],
 ];
 return [...new Set(topics.filter(([rule])=>rule.test(q)).flatMap(([,ids])=>ids))];
}
export function selectEvidence(rows, allowed) {
 return rows.filter(row=> typeof row.content==='string' && row.content.startsWith('Aster House Lahore (fictional business).') && Number.isFinite(row.similarity) && row.similarity>=0.35 && allowed.includes(row.content.match(/FAQ-(\d{2})\s*\|/)?.[1]))
 .sort((a,b)=>b.similarity-a.similarity)[0] || null;
}
