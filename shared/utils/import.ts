import { toMinor } from './pricing'
export const importFields=['sku','name','manufacturer_code','description','category','brand','price','price_unit','selling_unit','currency','tax_percent','cost','cost_unit','coverage','coverage_unit','stock_status','lead_time','aliases','attributes'] as const
export function validateImport(rows: Record<string,string>[], currency='INR') {
 if(rows.length>10000)throw new Error('Maximum 10,000 rows')
 const seen=new Set<string>()
 return rows.map((row,index)=>{
 const warnings:string[]=[],errors:string[]=[]
 const sku=row.sku?.trim()||null,name=row.name?.trim()||sku||''
 if(!sku&&!name)errors.push('SKU or name is required')
 if(sku&&seen.has(sku))errors.push('Duplicate SKU within file');if(sku)seen.add(sku)
 if(!sku)warnings.push('Internal identifier will be generated')
 let price_minor:string|null=null,cost_minor:string|null=null,tax_bps:number|null=null,attributes:Record<string,unknown>={}
 const c=row.currency?.trim()||currency
 try{if(row.price?.trim())price_minor=toMinor(row.price,c);else warnings.push('Missing price: requires review')}catch(e:any){errors.push(e.message)}
 try{if(row.cost?.trim())cost_minor=toMinor(row.cost,c)}catch(e:any){errors.push('Cost: '+e.message)}
 if(row.tax_percent?.trim()){const n=Number(row.tax_percent);if(!/^\d+(\.\d{1,2})?$/.test(row.tax_percent)||n<0||n>100)errors.push('Invalid tax percentage');else tax_bps=Math.round(n*100)}else warnings.push('Tax treatment missing')
 if(row.coverage && (!/^\d+(\.\d+)?$/.test(row.coverage)||Number(row.coverage)<=0))errors.push('Invalid pack coverage')
 try{if(row.attributes){attributes=JSON.parse(row.attributes);if(!attributes||Array.isArray(attributes)||typeof attributes!=='object')throw new Error()}}catch{errors.push('Attributes must be a JSON object')}
 return {row:index+2,errors,warnings,product:{sku,name,manufacturer_code:row.manufacturer_code||null,description:row.description||'',category:row.category||'',brand:row.brand||'',price_minor,cost_minor,cost_unit:row.cost_unit||null,price_unit:row.price_unit||'each',selling_unit:row.selling_unit||row.price_unit||'each',currency:c,tax_bps,coverage:row.coverage||null,coverage_unit:row.coverage_unit||null,stock_status:row.stock_status||'Unknown',lead_time:row.lead_time||'',attributes},aliases:(row.aliases||'').split('|').map(a=>a.trim()).filter(Boolean)}
 })
}
