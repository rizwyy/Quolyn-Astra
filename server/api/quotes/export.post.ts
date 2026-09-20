import {z} from 'zod'
import {renderQuotePdf} from '../../utils/pdf'
import {safeCsv} from '../../../shared/utils/csv'
export default defineEventHandler(async event=>{
 const db=await authenticatedDb(event),body=z.object({id:z.uuid(),version:z.number().int(),format:z.enum(['pdf','csv'])}).parse(await readBody(event))
 const {data:q,error}=await db.from('quolyn_quotes').select('*').eq('id',body.id).single();if(error||!q)throw createError({statusCode:404,message:'Quotation not found'})
 if(q.version!==body.version)throw createError({statusCode:409,message:'Quote changed. Reload before exporting.'})
 if(!['draft','needs review'].includes(q.status)&&(q.total_minor==null||q.validation.errors.length))throw createError({statusCode:422,message:'Resolve quotation review blockers'})
 let bytes:Buffer
 if(body.format==='pdf'){
 const font=await useStorage('assets:fonts').getItemRaw<Buffer>('NotoSans-Regular.ttf');if(!font)throw createError({statusCode:500,message:'PDF font unavailable'})
 let logo:Buffer|undefined
 const path=q.snapshot.distributor.logo_path
 if(path?.startsWith(q.workspace_id+'/')){const r=await db.storage.from('workspace-assets').download(path);if(r.data)logo=Buffer.from(await r.data.arrayBuffer())}
 bytes=await renderQuotePdf(q,Buffer.from(font),logo)
 }else bytes=Buffer.from(safeCsv(q.snapshot.lines.map((l:any)=>({document:['draft','needs review'].includes(q.status)?'DRAFT - NOT FINAL':'QUOTATION',quote:q.number,revision:q.revision,description:l.description,sku:l.sku,requested_quantity:l.quantity,requested_unit:l.unit,billable_quantity:l.billable,price_unit:l.price_unit,price_minor:l.price_minor,discount_bps:l.discount_bps,tax_bps:l.tax_bps,included:l.included,line_total_minor:l.total_minor,currency:q.currency,quote_total_minor:q.total_minor}))))
 const path=`${q.workspace_id}/${q.id}/${q.version}-${crypto.randomUUID()}.${body.format}`
 const upload=await db.storage.from('quote-documents').upload(path,bytes,{contentType:body.format==='pdf'?'application/pdf':'text/csv'});if(upload.error)throw createError({statusCode:500,message:upload.error.message})
 const saved=await db.rpc('record_document',{w:q.workspace_id,q:q.id,v:q.version,p:path});if(saved.error)throw createError({statusCode:409,message:saved.error.message})
 const signed=await db.storage.from('quote-documents').createSignedUrl(path,60,{download:`${q.number}-R${q.revision}.${body.format}`});if(signed.error)throw createError({statusCode:500,message:signed.error.message})
 return{url:signed.data.signedUrl}
})
