import Papa from 'papaparse'
import ExcelJS from 'exceljs'
export default defineEventHandler(async event=>{
 await authenticatedDb(event)
 const body=await readMultipartFormData(event),file=body?.find(p=>p.name==='file')
 if(!file?.data||file.data.length>10485760)throw createError({statusCode:400,message:'Select a CSV or XLSX file under 10 MB'})
 const sheets:Record<string,string[][]>={}
 if(file.filename?.toLowerCase().endsWith('.csv')){
 const parsed=Papa.parse<string[]>(file.data.toString('utf8'),{skipEmptyLines:'greedy'})
 if(parsed.errors.length)throw createError({statusCode:400,message:parsed.errors[0]!.message})
 sheets.Catalogue=parsed.data
 }else if(file.filename?.toLowerCase().endsWith('.xlsx')){
 const {unzipSync}=await import('fflate');let size=0
 const entries=unzipSync(file.data,{filter:f=>{size+=f.originalSize;if(size>30000000)throw new Error('Expanded workbook exceeds 30 MB');if(/vbaProject|macros/i.test(f.name))throw new Error('Macros are not accepted');return /\.xml$/.test(f.name)}})
 for(const bytes of Object.values(entries))if(/<f[\s>]/.test(new TextDecoder().decode(bytes)))throw createError({statusCode:400,message:'Formula cells are not accepted. Export values only.'})
 const wb=new ExcelJS.Workbook();await wb.xlsx.load(file.data as any)
 if(wb.worksheets.length>20)throw createError({statusCode:400,message:'Maximum 20 worksheets'})
 for(const ws of wb.worksheets){if(ws.rowCount>10001||ws.columnCount>100)throw createError({statusCode:400,message:'Maximum 10,000 rows and 100 columns'});const rows:string[][]=[];ws.eachRow(r=>{const cells:string[]=[];for(let i=1;i<=ws.columnCount;i++)cells.push(r.getCell(i).text);rows.push(cells)});sheets[ws.name]=rows}
 }else throw createError({statusCode:400,message:'Only CSV and XLSX are supported'})
 if(Object.values(sheets).some(r=>r.length>10001))throw createError({statusCode:400,message:'Maximum 10,000 product rows'})
 return {sheets}
})
