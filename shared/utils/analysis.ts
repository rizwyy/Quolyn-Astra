import { z } from 'zod'
export const extractedLine = z.object({ original_text: z.string().max(2000), description: z.string().min(1).max(1000), quantity: z.string().regex(/^\d+(\.\d+)?$/).nullable(), unit: z.string().max(30).nullable(), brand: z.string().max(100).nullable(), sku: z.string().max(100).nullable(), requirements: z.record(z.string(), z.string()).default({}), missing: z.array(z.string().max(300)).max(20), delivery: z.string().max(300).nullable() }).strict()
export const analysisSchema = z.object({ lines: z.array(extractedLine).max(60), notes: z.array(z.string().max(1000)).max(30) }).strict()
export function deterministicAnalysis(text: string) {
  if (text.length > 16000) throw new Error('Enquiry exceeds 16,000 characters')
  const notes: string[] = [], lines: z.infer<typeof extractedLine>[] = []
  for (const part of text.split(/\n|(?<=[.!?])\s+/).map(s => s.trim()).filter(Boolean)) {
    if (/delivery|next month|next week|substitut|another option/i.test(part)) { notes.push(part); if (!/quote|flooring|tiles|\d.*(?:m²|m2|sq ft|boxes)/i.test(part)) continue }
    const chunks = part.split(/\s+and\s+(?=(?:matching\s+)?(?:edge trims|trims|underlay))/i)
    for (const raw of chunks) {
      const m = raw.match(/(?<![\d,.-])((?:\d{1,3}(?:,\d{3})+|\d+)(?:\.\d+)?)\s*(sq\s*ft|ft2|m²|m2|sqm|boxes|box|each|lm)(?=\s|[.,;:]|$)/i)
      const unit = m ? ({ 'sq ft': 'ft2', 'm²': 'm2', sqm: 'm2', boxes: 'box' }[m[2]!.toLowerCase()] ?? m[2]!.toLowerCase()) : null
      const missing = ['Confirm product requirements with customer']
      if (!m) missing.push('Quantity and unit required')
      if (/flooring/i.test(raw) && !/vinyl|laminate|porcelain|ceramic/i.test(raw)) missing.push('Material is ambiguous')
      if (/underlay|trims|suitable|matching/i.test(raw)) missing.push('Compatibility requires confirmation')
      if (/approximately/i.test(raw)) missing.push('Approximate quantity requires confirmation')
      const requirements:Record<string,string>={}
      if(/\bgr[ae]y\b/i.test(raw))requirements.colour='grey'
      if(/wood[- ]look/i.test(raw))requirements.finish='wood-look'
      if(/commercial/i.test(raw))requirements.commercial_suitability='true'
      if(/water resistant/i.test(raw))requirements.water_resistance='true'
      lines.push({ original_text: raw, description: raw, quantity: m?.[1]?.replaceAll(',', '') ?? null, unit, sku: null, brand: null, requirements, missing, delivery: null })
    }
  }
  if (/next month|next week|second week/i.test(text)) notes.push('Clarify the exact delivery date; relative date preserved above.')
  return analysisSchema.parse({ lines, notes })
}
export function compareRequirements(requirements: Record<string,string>, attributes: Record<string,unknown>) {
  const confirmed: string[] = [], conflicts: string[] = [], unknown: string[] = []
  for (const [key,value] of Object.entries(requirements)) {
    if (attributes[key] == null) unknown.push(`${key}: unknown`)
    else if (String(attributes[key]).toLowerCase() === value.toLowerCase()) confirmed.push(`${key}: ${value}`)
    else conflicts.push(`${key}: requested ${value}; catalogue ${attributes[key]}`)
  }
  return { confirmed, conflicts, unknown }
}
