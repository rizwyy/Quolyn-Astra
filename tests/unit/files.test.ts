import {describe,it,expect} from 'vitest'
import ExcelJS from 'exceljs'
import {unzipSync} from 'fflate'
import Papa from 'papaparse'
import {validateImport} from '../../shared/utils/import'
describe('maintained spreadsheet parsers',()=>{
 it('preserves quoted CSV fields and explicit decimal prices',()=>{const p=Papa.parse<Record<string,string>>('sku,name,price\nA,"Tile, grey",1200.25',{header:true});expect(p.errors).toEqual([]);expect(validateImport(p.data)[0]!.product).toMatchObject({name:'Tile, grey',price_minor:'120025'})})
 it('reads multi-sheet XLSX values and can identify formula XML',async()=>{const wb=new ExcelJS.Workbook();wb.addWorksheet('Products').addRows([['sku','name','price'],['A','Tile',1200.25]]);wb.addWorksheet('Formulas').getCell('A1').value={formula:'1+1',result:2};const bytes=await wb.xlsx.writeBuffer();const entries=unzipSync(new Uint8Array(bytes));expect(Object.values(entries).some(b=>/<f[\s>]/.test(new TextDecoder().decode(b)))).toBe(true);const read=new ExcelJS.Workbook();await read.xlsx.load(bytes);expect(read.worksheets).toHaveLength(2);expect(read.getWorksheet('Products')!.getCell('C2').text).toBe('1200.25')})
})
