import {z} from 'zod'
export default defineEventHandler(async event=>{
 const db=await authenticatedDb(event),id=z.uuid().parse(getQuery(event).id)
 const {data,error}=await db.from('quolyn_quote_documents').select('id,path,quote_version,created_at').eq('quote_id',id).order('created_at',{ascending:false});if(error)throw createError({statusCode:400,message:error.message});return data
})
