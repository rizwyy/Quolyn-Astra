import PDFDocument from 'pdfkit'
import {money} from '../../shared/utils/pricing'
export async function renderQuotePdf(q:any,font:Buffer,logo?:Buffer):Promise<Buffer>{
 const doc=new PDFDocument({size:'A4',margin:48,bufferPages:true}),chunks:Buffer[]=[]
 const done=new Promise<Buffer>((resolve,reject)=>{doc.on('data',b=>chunks.push(b));doc.on('end',()=>resolve(Buffer.concat(chunks)));doc.on('error',reject)})
 doc.registerFont('Noto',font);doc.font('Noto')
 const draft=['draft','needs review'].includes(q.status), width=499
 function header(){doc.fillColor('#234e80').fontSize(10).text(draft?'DRAFT - NOT A FINAL QUOTATION':'QUOTATION',48,40);doc.fillColor('#243746').fontSize(9).text(`${q.number} / Revision ${q.revision}`,350,40,{width:197,align:'right'});doc.y=70}
 function space(h:number){if(doc.y+h>755){doc.addPage();header()}}
 header()
 if(logo){try{doc.image(logo,48,75,{fit:[90,45]});doc.y=130}catch{}}
 doc.fontSize(23).text(q.snapshot.distributor.name,48,doc.y,{width});doc.moveDown(.4);doc.fontSize(10).fillColor('#687d8f').text(q.snapshot.distributor.address||'Distributor address unresolved',{width});doc.moveDown(1.5)
 doc.fillColor('#243746').fontSize(9).text('PREPARED FOR');doc.fontSize(14).text(q.snapshot.customer.name||'Customer unresolved');doc.fontSize(10).text(q.snapshot.customer.address||'Billing address unresolved');if(q.snapshot.customer.tax_reference)doc.text('Tax reference: '+q.snapshot.customer.tax_reference)
 doc.moveDown();doc.fontSize(9).text(`Issue date: ${q.issue_date}    Valid until: ${q.expiry_date||'Unresolved'}`);doc.text(`Currency: ${q.currency} | Tax-exclusive pricing`);doc.moveDown(1.5)
 for(const included of [true,false]){
 const rows=q.snapshot.lines.filter((l:any)=>l.included===included);if(!rows.length)continue
 space(60);doc.fontSize(12).fillColor('#234e80').text(included?'Quotation items':'Alternatives - excluded from quotation total');doc.moveDown(.5)
 for(const l of rows){
 const detail=`Requested: ${l.quantity??'Unresolved'} ${l.unit??''} | Billable: ${l.billable??'Unresolved'} ${l.price_unit??''}\nPrice: ${money(l.price_minor,q.currency)} / ${l.price_unit??'unresolved'} | Discount: ${l.discount_bps/100}% | Tax: ${l.tax_bps==null?'Unresolved':l.tax_bps/100+'%'}${l.packs?`\nPacks: ${l.packs} | Delivered: ${l.delivered} ${l.coverage_unit}`:''}`
 doc.fontSize(11);const descHeight=doc.heightOfString(l.description,{width:width-125});doc.fontSize(9);const detailHeight=doc.heightOfString(detail,{width});const height=descHeight+detailHeight+32;space(Math.min(height,640));const y=doc.y
 doc.fillColor('#243746').fontSize(11).text(l.description,48,y,{width:width-125});const after=doc.y
 doc.fontSize(10).text(money(l.total_minor,q.currency),width-65,y,{width:110,align:'right'});doc.y=Math.max(after,y+15)+7
 doc.fontSize(9).fillColor('#728393').text(detail,48,doc.y,{width});doc.moveDown(.5);doc.text(`Net: ${money(l.net_minor,q.currency)}    Tax: ${money(l.tax_minor,q.currency)}`,{width});doc.moveDown(.6);doc.strokeColor('#e1e6eb').moveTo(48,doc.y).lineTo(547,doc.y).stroke();doc.moveDown(.8)
 }
 }
 space(100);doc.moveDown();doc.fontSize(16).fillColor('#234e80').text(q.total_minor==null?'Incomplete draft - no final total':`Total: ${money(q.total_minor,q.currency)}`,48,doc.y,{width,align:'right'});doc.moveDown()
 for(const [label,value] of [['Notes',q.notes],['Terms',q.terms],['Payment terms',q.snapshot.customer.payment_terms]]){if(!value)continue;space(55);doc.fontSize(11).fillColor('#243746').text(label,{width});doc.fontSize(9).fillColor('#728393').text(value,{width});doc.moveDown()}
 const range=doc.bufferedPageRange();for(let i=0;i<range.count;i++){doc.switchToPage(i);doc.fontSize(8).fillColor('#8a9aaa').text(`${q.number} · R${q.revision}    ${draft?'DRAFT - subject to review':'Prepared quotation'}    |    Page ${i+1} of ${range.count}`,48,772,{width,align:'center',lineBreak:false})}
 doc.end();return done
}
