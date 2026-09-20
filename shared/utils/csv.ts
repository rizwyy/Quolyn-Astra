import Papa from 'papaparse'
export function safeCsv(rows: Record<string,unknown>[]) {
  return Papa.unparse(rows.map(row => Object.fromEntries(Object.entries(row).map(([k,v]) => [k, typeof v === 'string' && /^[\s]*[=+@\-\t\r]/.test(v) ? `'${v}` : v]))))
}
