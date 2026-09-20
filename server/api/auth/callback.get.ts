export default defineEventHandler(async event=>{
 const {code,token_hash,type,next}=getQuery(event),db=serverDb(event)
 let error
 if(typeof code==='string') ({error}=await db.auth.exchangeCodeForSession(code))
 else if(typeof token_hash==='string' && ['email','recovery','signup'].includes(String(type))) ({error}=await db.auth.verifyOtp({token_hash,type:type as 'email'|'recovery'|'signup'}))
 else error={message:'Confirmation link missing or invalid'}
 if(error) return sendRedirect(event,'/auth/login?error='+encodeURIComponent(error.message))
 return sendRedirect(event,next==='recovery'||type==='recovery'?'/auth/password':'/')
})
