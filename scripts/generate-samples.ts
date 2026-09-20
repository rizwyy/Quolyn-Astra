import {demoProducts} from '../shared/utils/demo'
import {safeCsv} from '../shared/utils/csv'
import {writeFileSync,readFileSync} from 'node:fs'
import {renderQuotePdf} from '../server/utils/pdf'
writeFileSync('public/sample-catalogue.csv',safeCsv(demoProducts().map(p=>({sku:p.sku,name:p.name,description:p.description,category:p.category,brand:p.brand,price:(p.price_minor/100).toFixed(2),price_unit:p.price_unit,selling_unit:p.selling_unit,currency:p.currency,tax_percent:'18',cost:p.cost_minor==null?'':(p.cost_minor/100).toFixed(2),cost_unit:p.cost_unit,coverage:p.coverage,coverage_unit:p.coverage_unit,stock_status:p.stock_status,lead_time:p.lead_time,attributes:JSON.stringify(p.attributes)}))))
const q=JSON.parse(readFileSync('artifacts/verified-quote.json','utf8'))
writeFileSync('artifacts/verified-quote.pdf',await renderQuotePdf(q,readFileSync('public/fonts/NotoSans-Regular.ttf')))
const long={...q,snapshot:{...q.snapshot,lines:Array.from({length:35},(_,i)=>({...q.snapshot.lines[0],description:`${i+1}. Grey porcelain tile - fictional demonstration. `+'Extended product description, finish and dimensions checked by the salesperson. '.repeat(6)}))}}
writeFileSync('artifacts/multipage-quote.pdf',await renderQuotePdf(long,readFileSync('public/fonts/NotoSans-Regular.ttf')))
