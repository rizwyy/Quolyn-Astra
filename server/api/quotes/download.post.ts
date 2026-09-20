import {z} from 'zod'
export default defineEventHandler(async event=>{
 const db=await authenticatedDb(event),{id}=z.object({id:z.uuid()}).parse(await readBody(event))
 const {data:d,error}=await db.from('quolyn_quote_documents').select('path').eq('id',id).single();if(error||!d)throw createError({statusCode:404,message:'Document not found'})
 const r=await db.storage.from('quote-documents').createSignedUrl(d.path,60,{download:true});if(r.error)throw createError({statusCode:400,message:r.error.message});return{url:r.data.signedUrl}
})
