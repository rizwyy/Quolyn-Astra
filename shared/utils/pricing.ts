import Decimal from 'decimal.js'
Decimal.set({precision:40})
export type Unit = 'each' | 'box' | 'm2' | 'ft2' | 'lm' | string
export interface PriceInput { quantity: string; unit: Unit; priceUnit: Unit; priceMinor: string; coverage?: string | null; coverageUnit?: string | null; billing?: 'requested' | 'delivered'; discountBps?: number | null; customerDiscountBps?: number; taxBps: number | null; costMinor?: string | null; costUnit?: string | null; included?: boolean; units?:Record<string,UnitDefinition> }
export interface UnitDefinition { dimension:'area'|'length'|'count'; factor:string }
export function convert(q: Decimal.Value, from: Unit, to: Unit, units:Record<string,UnitDefinition>={}): Decimal {
  if (from === to) return new Decimal(q)
  if (from === 'ft2' && to === 'm2') return new Decimal(q).mul('0.09290304')
  if (from === 'm2' && to === 'ft2') return new Decimal(q).div('0.09290304')
  const definitions:Record<string,UnitDefinition>={...units,m2:{dimension:'area',factor:'1'},ft2:{dimension:'area',factor:'0.09290304'},lm:{dimension:'length',factor:'1'},each:{dimension:'count',factor:'1'}}
  const a=definitions[from],b=definitions[to]
  if(a&&b&&a.dimension===b.dimension&&new Decimal(a.factor).gt(0)&&new Decimal(b.factor).gt(0))return new Decimal(q).mul(a.factor).div(b.factor)
  throw new Error(`Missing conversion: ${from} → ${to}`)
}
export function priceLine(x: PriceInput) {
  const requested = new Decimal(x.quantity)
  if (!requested.isFinite() || requested.lte(0)) throw new Error('Quantity must be positive')
  const price = new Decimal(x.priceMinor)
  if (!price.isInteger() || price.lt(0)) throw new Error('Invalid minor-unit price')
  if (x.taxBps === null) throw new Error('Resolve tax treatment')
  const discount = x.discountBps ?? x.customerDiscountBps ?? 0
  if (![discount, x.taxBps].every(v => Number.isInteger(v) && v >= 0 && v <= 10000)) throw new Error('Invalid rate')
  let packs: Decimal | null = null, delivered: Decimal | null = null, billable: Decimal
  if (x.coverage && x.coverageUnit && x.unit !== 'box') {
    const coverage = new Decimal(x.coverage)
    if (coverage.lte(0)) throw new Error('Invalid pack coverage')
    packs = convert(requested, x.unit, x.coverageUnit,x.units).div(coverage).ceil()
    delivered = packs.mul(coverage)
  }
  if(x.unit==='box'&&x.coverage&&x.coverageUnit){packs=requested;delivered=requested.mul(x.coverage)}
  if(x.unit==='box'&&x.priceUnit!=='box'){if(!delivered||!x.coverageUnit)throw new Error('Missing pack conversion');billable=convert(delivered,x.coverageUnit,x.priceUnit,x.units)}
  else if (x.priceUnit === 'box' && x.unit !== 'box') {
    if (!packs) throw new Error('Missing pack conversion')
    billable = packs
  } else if (x.billing === 'delivered') {
    if (!delivered || !x.coverageUnit) throw new Error('Missing delivered coverage')
    billable = convert(delivered, x.coverageUnit, x.priceUnit,x.units)
  } else billable = convert(requested, x.unit, x.priceUnit,x.units)
  const round = (v: Decimal) => v.toDecimalPlaces(0, Decimal.ROUND_HALF_UP)
  const gross = round(billable.mul(price))
  const discountMinor = round(gross.mul(discount).div(10000))
  const net = gross.sub(discountMinor)
  const tax = round(net.mul(x.taxBps).div(10000))
  const marginMinor = x.costMinor != null && x.costUnit === x.priceUnit ? net.sub(round(billable.mul(x.costMinor))).toFixed(0) : null
  return { packs: packs?.toString() ?? null, delivered: delivered?.toString() ?? null, billable: billable.toString(), gross: gross.toFixed(0), discountMinor: discountMinor.toFixed(0), net: net.toFixed(0), tax: tax.toFixed(0), total: x.included === false ? '0' : net.add(tax).toFixed(0), marginMinor, discountBps: discount }
}
export function money(minor: string | number | null | undefined, currency = 'INR') {
  if (minor == null) return 'Unresolved'
  const digits = new Intl.NumberFormat('en', { style: 'currency', currency }).resolvedOptions().maximumFractionDigits ?? 2
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency }).format(new Decimal(minor).div(new Decimal(10).pow(digits)).toNumber())
}
export function toMinor(value: string, currency: string) {
  if (!/^\d+(\.\d+)?$/.test(value.trim())) throw new Error('Use a decimal point, without thousands separators')
  const digits = new Intl.NumberFormat('en', { style: 'currency', currency }).resolvedOptions().maximumFractionDigits ?? 2
  const scaled = new Decimal(value).mul(new Decimal(10).pow(digits))
  if (!scaled.isInteger()) throw new Error(`Price has more than ${digits} decimal places`)
  return scaled.toFixed(0)
}
