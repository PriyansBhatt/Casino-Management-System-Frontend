export const FNB_TABS = ['Overview', 'New Request', 'Live Requests', 'Records']
export const canMutateFnb = role => role === 'SUPER_ADMIN'
export const isFnbRoute = path => path === '/fnb' || path.startsWith('/fnb/') || path === '/fnb-kitchen-bar'
export const department = type => ({ FOOD: 'KITCHEN', BEVERAGE: 'BAR' }[type] || 'Unavailable')
export const actions = status => ({ PENDING: ['PREPARING','CANCELLED'], PREPARING: ['READY','CANCELLED'], READY: ['DELIVERED','CANCELLED'] }[status] || [])
export const validQuantity = value => /^[1-9]\d*$/.test(String(value)) && Number(value) <= 2147483647
export const createPayload = (form, customer, businessDate) => {
 if (!customer?.id) throw new Error('Select a customer from the search results.')
 if (!businessDate) throw new Error('Business Date unavailable. Refresh before creating.')
 if (!validQuantity(form.quantity)) throw new Error('Quantity must be a positive whole number up to 2147483647.')
 return { customerId: customer.id, customerSessionId: form.customerSessionId || null, expectedBusinessDate: businessDate, type: form.type, item: form.item.trim(), quantity: Number(form.quantity), location: form.location.trim(), remarks: form.remarks || null }
}
export const csvCell = value => { const text = String(value ?? ''); return `"${(/^[=+@-]/.test(text) ? "'" : '') + text.replaceAll('"', '""')}"` }
export const recordsCsv = rows => [['Request ID','Business Date','Requested time','Delivered time','Delivery Business Date','Customer','CID','Session ID','Type','Item','Quantity','Location','Department','Status','Requested by','Handled by','Remarks'], ...rows.map(r => [r.id,r.businessDate,r.requestedAt,r.deliveredAt ?? 'Unavailable',r.deliveredBusinessDate ?? 'Unavailable',r.customerName,r.customerCode,r.customerSessionId,r.type,r.item,r.quantity,r.location,r.department,r.status,r.requester,r.handler ?? 'Unavailable',r.remarks])].map(r => r.map(csvCell).join(',')).join('\n')
export function createGate() { let generation = 0; return { next: () => ++generation, current: (value) => value === generation } }
export function createSubmission(options = {}) {
 let busy = false, active = null
 let storage = options.storage
 try { storage ??= globalThis.sessionStorage } catch { storage = null }
 const storageKey = `fb1-retries:${options.namespace || 'default'}`
 let memory = {}
 const read = () => storage ? JSON.parse(storage.getItem(storageKey) || '{}') : memory
 const write = records => { if (storage) storage.setItem(storageKey, JSON.stringify(records)); else memory = records }
 return {
  pendingCreates() {
   return Object.entries(read()).flatMap(([signature, key]) => {
    const operation = JSON.parse(signature)
    return operation.target === 'create' ? [{ ...operation, key }] : []
   })
  },
  begin(target, payload) {
   if (busy) return null
   if (options.requireStorage && !storage) throw new Error('Browser retry storage is unavailable. No request was sent.')
   const signature = JSON.stringify({ target, payload }), pending = read()
   const key = pending[signature] || globalThis.crypto.randomUUID()
   pending[signature] = key
   write(pending) // Persist before sending; retain uncertain requests across unmount/remount.
   active = { signature, key }; busy = true
   return Object.freeze({ target, payload: Object.freeze({ ...payload }), key })
  },
  finish(confirmed) {
   busy = false
   if (confirmed && active) {
    try { const pending = read(); if (pending[active.signature] === active.key) { delete pending[active.signature]; write(pending) } }
    catch { /* Retaining a confirmed key is safe: the backend will replay its receipt. */ }
   }
   active = null
  },
 }
}
