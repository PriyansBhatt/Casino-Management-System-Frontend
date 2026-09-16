import { assertActor } from './persistedOperation.js'
export const CRM_TABS = ['Overview', 'Hotel Stays', 'Transport', 'Services & Gifts', 'All Records']
export const canMutateCrm = (role) => role === 'SUPER_ADMIN'
export const isCrmRoute = (path) => path === '/crm-gre' || path.startsWith('/crm-gre/') || path === '/crm' || path === '/crm-gre-marketing'
// Keep decimal amounts as text through JSON parsing, formatting and CSV.
export const crmMoney = (cost) => {
 if (cost == null) return 'Unavailable'
 const text = String(cost)
 if (!/^\d+(?:\.\d+)?$/.test(text)) return 'Unavailable'
 const [whole, fraction] = text.split('.')
 return `NPR ${BigInt(whole).toLocaleString('en-IN')}${fraction == null ? '' : `.${fraction}`}`
}
export function parseCrmResponse(raw) {
 if (typeof raw !== 'string') throw new Error('Invalid CRM response')
 let name = null, valueKey = null
 // Tokenize strings first so numeric-looking text inside descriptions is never rewritten.
 const exact = raw.replace(/"(?:\\.|[^"\\])*"|-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?|[{}[\]:,]|true|false|null/g, token => {
  if (token.startsWith('"')) { name = JSON.parse(token); valueKey = null; return token }
  if (token === ':') { valueKey = name; return token }
  const monetary = ['cost','estimatedCost','actualCost'].includes(valueKey) && /^-?\d/.test(token)
  name = null; valueKey = null
  return monetary ? JSON.stringify(token) : token
 })
 return JSON.parse(exact)
}
export const scopeType = (tab, type) => tab === 'Hotel Stays' ? 'HOTEL' : tab === 'Transport' ? 'TRANSPORT' : tab === 'Services & Gifts' ? (['GIFT','FOOD','TICKET','OTHER'].includes(type) ? type : 'SERVICE') : type

export const csvCell = (value) => { const text = String(value ?? ''); return `"${(/^[=+@-]/.test(text) ? "'" : '') + text.replaceAll('"', '""')}"` }
export const recordsCsv = (rows) => [['Date','Customer','Customer Code','Record Type','Description','Cost NPR','Cost Basis','Staff','Status','Recording Business Date'], ...rows.map(r => [r.recordAt,r.customerName,r.customerCode,r.recordType,r.description,r.cost ?? 'Unavailable',r.costBasis,r.staff ?? 'Unavailable',r.status,r.business_date ?? 'Unavailable'])].map(row => row.map(csvCell).join(',')).join('\n')
export const validCost = (value) => value === '' || /^(?:0|[1-9]\d{0,16})(?:\.\d{1,2})?$/.test(value)
export function createGate() { let generation = 0; return { next: () => ++generation, current: (value) => value === generation } }
export function createSubmission(options = {}) {
 let busy = false, active = null
 let storage = options.storage
 try { storage ??= globalThis.sessionStorage } catch { storage = null }
 const storageKey = `crm1-retries:${options.namespace || 'default'}`
 let memory = {}
 const read = () => {
  const records = storage ? JSON.parse(storage.getItem(storageKey) || '{}') : memory
  if (!records || Array.isArray(records) || typeof records !== 'object' || Object.keys(records).length > 100) throw new Error('Invalid CRM recovery storage. No request was sent.')
  for (const [signature, entry] of Object.entries(records)) {
    const key = typeof entry === 'string' ? entry : entry?.key
    const operation = JSON.parse(signature)
    if (typeof operation.target !== 'string' || !operation.payload || typeof operation.payload !== 'object' || typeof key !== 'string' || !key || key.length > 100) throw new Error('Invalid CRM recovery storage. No request was sent.')
  }
  return records
 }
 const write = records => {
  const raw = JSON.stringify(records)
  if (Object.keys(records).length > 100 || raw.length > 128000) throw new Error('CRM recovery storage is full. Resolve pending operations before creating another record.')
  if (storage) storage.setItem(storageKey, raw); else memory = records
 }
 return {
  pendingCreates() { return Object.entries(read()).map(([signature,entry]) => ({ ...JSON.parse(signature), signature, key: typeof entry === 'string' ? entry : entry.key, createdAt: typeof entry === 'string' ? null : entry.createdAt })).filter(p => p.target.startsWith('create:')) },
  discard(signature) { if (busy) return; if (options.requireStorage) assertActor(String(options.namespace)); const pending = read(); delete pending[signature]; write(pending) },
  begin(target, payload, retry = false) {
   if (busy) return null
   if (options.requireStorage && !storage) throw new Error('Browser retry storage is unavailable. No request was sent.')
   if (options.requireStorage) assertActor(String(options.namespace))
   const signature = JSON.stringify({ target, payload }), pending = read()
   if (options.requireStorage && target.startsWith('create:') && Object.keys(pending).some(s => JSON.parse(s).target.startsWith('create:')) && !retry) throw new Error('A create request is uncertain. Retry Original or discard its local recovery record before starting a new record.')
   if (retry && !pending[signature]) throw new Error('Saved CRM operation is unavailable.')
   const previous = pending[signature]
   const key = (typeof previous === 'string' ? previous : previous?.key) || globalThis.crypto.randomUUID()
   pending[signature] = previous || { key, createdAt: new Date().toISOString() }
   write(pending) // Persist before sending; retain uncertain requests across unmount/remount.
   active = { signature, key }; busy = true
   return Object.freeze({ target, payload: Object.freeze({ ...payload }), key })
  },
  finish(confirmed) {
   busy = false
   if (confirmed && active) {
    try { const pending = read(); if ((typeof pending[active.signature] === 'string' ? pending[active.signature] : pending[active.signature]?.key) === active.key) { delete pending[active.signature]; write(pending) } }
    catch { /* Retaining a confirmed key is safe: the backend will replay its receipt. */ }
   }
   active = null
  },
 }
}
export const hotelActions = (status) => ({ REQUESTED: ['approve','reject','CANCELLED'], APPROVED: ['BOOKED','CANCELLED'], BOOKED: ['CHECKED_IN','CANCELLED'], CHECKED_IN: ['COMPLETED','CANCELLED'] }[status] || [])
