import {describe,it,expect} from 'vitest'
import {priceLine,convert,toMinor} from '../../shared/utils/pricing'
import {analysisSchema,deterministicAnalysis,compareRequirements} from '../../shared/utils/analysis'
import {validateImport} from '../../shared/utils/import'
import {safeCsv} from '../../shared/utils/csv'
const base={quantity:'100',unit:'m2',priceUnit:'box',priceMinor:'120000',coverage:'2.4',coverageUnit:'m2',taxBps:1800,customerDiscountBps:500}
describe('exact pricing',()=>{
 it('rounds to 42 boxes, preserves 100.8 m2 coverage and calculates tax after discount',()=>{expect(priceLine(base)).toMatchObject({packs:'42',delivered:'100.8',billable:'42',net:'4788000',tax:'861840',total:'5649840',marginMinor:null})})
 it('uses explicitly selected area basis',()=>{expect(priceLine({...base,priceUnit:'m2',priceMinor:'100',billing:'requested'}).billable).toBe('100');expect(priceLine({...base,priceUnit:'m2',priceMinor:'100',billing:'delivered'}).billable).toBe('100.8')})
 it('converts square feet exactly',()=>expect(convert('2400','ft2','m2').toString()).toBe('222.967296'))
 it('handles fractional quantity and rounds half up',()=>expect(priceLine({quantity:'0.5',unit:'each',priceUnit:'each',priceMinor:'101',taxBps:1000}).total).toBe('56'))
 it('manual discount replaces default and survives override',()=>expect(priceLine({...base,priceMinor:'100000',discountBps:1000})).toMatchObject({discountBps:1000,net:'3780000'}))
 it('excludes alternatives',()=>expect(priceLine({...base,included:false}).total).toBe('0'))
 it('blocks incompatible dimensions',()=>expect(()=>priceLine({...base,unit:'lm'})).toThrow('Missing conversion'))
 it('blocks missing tax but allows explicit zero',()=>{expect(()=>priceLine({...base,taxBps:null})).toThrow('tax');expect(priceLine({...base,taxBps:0}).tax).toBe('0')})
 it('does not invent margin from missing or incompatible cost',()=>{expect(priceLine(base).marginMinor).toBeNull();expect(priceLine({...base,costMinor:'100',costUnit:'lm'}).marginMinor).toBeNull()})
 it('supports currency minor digits and rejects excess decimals',()=>{expect(toMinor('1200.25','INR')).toBe('120025');expect(toMinor('1.234','KWD')).toBe('1234');expect(toMinor('500','JPY')).toBe('500');expect(()=>toMinor('1,200','INR')).toThrow()})
})
describe('analysis and matching safety',()=>{
 it('never invents accessory quantities',()=>{const r=deterministicAnalysis('Please quote 100 m2 tiles. Also include suitable underlay and matching edge trims.');expect(r.lines.filter(l=>/underlay|trims/.test(l.description)).every(l=>l.quantity===null)).toBe(true)})
 it('preserves ambiguous delivery as notes',()=>expect(deterministicAnalysis('We need delivery during the second week of next month.').notes.join(' ')).toContain('Clarify'))
 it('rejects invented AI fields',()=>expect(()=>analysisSchema.parse({lines:[{product_id:'invented'}],notes:[]})).toThrow())
 it('does not hide specification conflicts or unknowns',()=>expect(compareRequirements({colour:'grey',material:'vinyl',slip:'R10'},{colour:'grey',material:'ceramic'})).toEqual({confirmed:['colour: grey'],conflicts:['material: requested vinyl; catalogue ceramic'],unknown:['slip: unknown']}))
 it('bounds input',()=>expect(()=>deterministicAnalysis('x'.repeat(16001))).toThrow())
})
describe('import and CSV',()=>{
 it('rejects invalid prices and empty identification',()=>{const r=validateImport([{sku:'A',price:'bad'},{price:'10'}]);expect(r.every(x=>x.errors.length>0)).toBe(true)})
 it('warns on missing price and tax, preserving nulls',()=>expect(validateImport([{name:'Tile'}])[0]).toMatchObject({product:{price_minor:null,tax_bps:null},errors:[]}))
 it('rejects duplicates in one file',()=>expect(validateImport([{sku:'A'},{sku:'A'}])[1]!.errors).toContain('Duplicate SKU within file'))
 it('escapes spreadsheet formula injection',()=>expect(safeCsv([{name:'=HYPERLINK("evil")'}])).toContain("'=HYPERLINK"))
})

describe('configured compatible units',()=>{
 it('converts explicit boxes to per-area prices',()=>expect(priceLine({quantity:'5',unit:'box',priceUnit:'m2',priceMinor:'100',coverage:'2.4',coverageUnit:'m2',taxBps:0})).toMatchObject({packs:'5',delivered:'12',billable:'12',total:'1200'}))
 it('uses configured factors within a dimension',()=>expect(convert('10','yd2','m2',{yd2:{dimension:'area',factor:'0.83612736'}}).toString()).toBe('8.3612736'))
 it('rejects configured area-to-length conversions',()=>expect(()=>convert('10','yd2','lm',{yd2:{dimension:'area',factor:'0.83612736'}})).toThrow('Missing conversion'))
})

it('extracts m², preserves requested attributes and does not reinterpret negative/decimal-comma quantities',()=>{
 expect(deterministicAnalysis('100 m² grey commercial tile').lines[0]).toMatchObject({quantity:'100',unit:'m2',requirements:{colour:'grey',commercial_suitability:'true'}})
 expect(deterministicAnalysis('-5 m2 tile').lines[0]!.quantity).toBeNull()
 expect(deterministicAnalysis('1,5 m2 tile').lines[0]!.quantity).toBeNull()
})
