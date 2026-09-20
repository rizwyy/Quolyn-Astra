import {it,expect} from 'vitest'
import {renderQuotePdf} from '../../server/utils/pdf'
import {readFileSync,writeFileSync,mkdtempSync,rmSync} from 'node:fs'
import {execFileSync} from 'node:child_process'
import {tmpdir} from 'node:os'
const poppler=process.env.PDFTOTEXT||'pdftotext'
let hasPoppler=true;try{execFileSync(poppler,['-v'],{stdio:'ignore'})}catch{hasPoppler=false}
it.skipIf(!hasPoppler)('draft PDF preserves missing values and excludes internal fields',async()=>{
 const quote={number:'TEST-00001',revision:1,status:'draft',currency:'INR',issue_date:'2026-09-20',expiry_date:'2026-10-20',notes:'Customer-facing note',terms:'Payment on delivery',total_minor:null,snapshot:{distributor:{name:'Fictional Distributor',address:'Example Road'},customer:{name:'Fictional Customer',address:'Example Street'},lines:[{description:'Tile',quantity:null,unit:'m2',billable:null,price_minor:null,discount_bps:0,tax_bps:null,included:true,total_minor:null,net_minor:null,tax_minor:null,margin_minor:'SECRET_MARGIN',cost_minor:'SECRET_COST'}]}}
 const bytes=await renderQuotePdf(quote,readFileSync('public/fonts/NotoSans-Regular.ttf')),dir=mkdtempSync(tmpdir()+'/quolyn-pdf-')
 try{const path=dir+'/draft.pdf';writeFileSync(path,bytes);const text=execFileSync(poppler,[path,'-'],{encoding:'utf8'});expect(text).toContain('DRAFT - NOT A FINAL QUOTATION');expect(text).toContain('Incomplete draft - no final total');expect(text).toContain('Unresolved');expect(text).not.toContain('SECRET_');expect(text).not.toContain('₹0.00');expect(text.match(/\f/g)).toHaveLength(1)}finally{rmSync(dir,{recursive:true,force:true})}
})
