export default defineEventHandler(event=>{
 setHeader(event,'Cache-Control','private, no-store');
 setHeader(event,'X-Content-Type-Options','nosniff');setHeader(event,'Referrer-Policy','same-origin');setHeader(event,'X-Frame-Options','DENY')
 if(event.path.startsWith('/api') && !['GET','HEAD','OPTIONS'].includes(event.method)) {
 const origin=getHeader(event,'origin');if(origin && origin!==getRequestURL(event).origin) throw createError({statusCode:403,message:'Cross-origin request denied'})
 }
})
