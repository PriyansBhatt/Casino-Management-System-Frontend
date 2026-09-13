import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { build } from 'esbuild'
import { UNAVAILABLE_WORKFLOWS, canPostBuyIn, requestGuard, denominationTotal, loadBuyInScope,
  matchingCustomers, verifySession, readyToPost, historyTotals, buyInCsv, scopedHistory,
  createBuyInSubmission, isBuyInRoute } from '../src/utils/buyIn.js'
const date = '2026-09-13'
const customer = { id: 'c1', customerCode: 'CUS-1', fullName: 'Alice', phone: '980000', nationality: 'Nepali', status: 'ACTIVE' }
const session = { id: 's1', customerId: 'c1', status: 'OPEN', exitTime: null, businessDate: date }
const transaction = (overrides = {}) => ({ id: 'b1', buyInCode: 'BI-1', customerId: 'c1', customerSessionId: 's1', businessDate: date,
  createdAt: '2026-09-13T10:00:00', amountReceived: 1000, totalChipValueIssued: 1000, denominations: { 1000: 1 },
  paymentMode: 'CASH', paymentReference: null, createdBy: { id: 'u1', username: 'cashier' }, ...overrides })
const row = (overrides = {}) => ({ transaction: transaction(), customerCode: 'CUS-1', customerName: 'Alice', ...overrides })
const api = (overrides = {}) => ({ getCurrentOpenBusinessDate: async () => ({ businessDate: date, status: 'OPEN' }),
  getCustomers: async () => [customer], getCurrentBusinessDateBuyIns: async () => [row()],
  getCurrentCashierReconciliation: async () => ({ businessDate: date, lifecycleStatus: 'OPEN' }), ...overrides })
const ready = (overrides = {}) => readyToPost({ role: 'CASHIER', date, ready: true, pending: false,
  selected: customer, verified: session, total: 1000, amount: 1000, mode: 'CASH', reference: '', finalized: false, ...overrides })
const deferred = () => { let resolve; let reject; const promise = new Promise((yes, no) => { resolve = yes; reject = no }); return { promise, resolve, reject } }

test('Buy-In route permits only backend history roles and posting excludes DIRECTOR', async () => {
  const bundle = await build({ entryPoints: ['src/utils/accessControl.js'], bundle: true, write: false, format: 'esm', platform: 'node' })
  const { canAccessRoute } = await import(`data:text/javascript;base64,${Buffer.from(bundle.outputFiles[0].text).toString('base64')}`)
  for (const role of ['CASHIER', 'DIRECTOR', 'SUPER_ADMIN']) assert.equal(canAccessRoute({ role }, '/cashier/buy-in'), true)
  for (const role of ['ADMIN', 'RECEPTIONIST', 'PIT_SUPERVISOR', 'DEALER']) assert.equal(canAccessRoute({ role }, '/cashier/buy-in'), false)
  for (const role of ['CASHIER', 'SUPER_ADMIN']) { assert.equal(canPostBuyIn(role), true); assert.equal(ready({ role }), true) }
  for (const role of ['DIRECTOR', 'ADMIN', undefined]) assert.equal(ready({ role }), false)
})

test('unsupported workflows are unavailable with no demo or local posting source', async () => {
  assert.match(UNAVAILABLE_WORKFLOWS.MACHINE_CASH_IN, /Unavailable.*Slot & Machine Gaming/)
  assert.match(UNAVAILABLE_WORKFLOWS.TIPS, /Unavailable.*not been implemented/)
  const page = await readFile('src/pages/cashier/BuyIn.jsx', 'utf8')
  assert.doesNotMatch(page, /initialTransactions|DEMO RECORD|24000|18400|localStorage|sessionStorage|getBuyInsBySession|exchangeRate|window.print/)
  assert.match(page, /disabled>Posting unavailable/)
  assert.match(page, /tab === 'CHIP_BUY_IN' && readyToPost/)
})

test('unavailable or invalid Business Date never falls back to history or zero', async () => {
  const noReads = () => { throw new Error('Unexpected secondary read') }
  const result = await loadBuyInScope(api({ getCurrentOpenBusinessDate: async () => null,
    getCustomers: noReads, getCurrentBusinessDateBuyIns: noReads, getCurrentCashierReconciliation: noReads }), 'CASHIER')
  assert.equal(result.businessDate, null)
  assert.deepEqual(result.history, [])
  assert.equal(ready({ date: null }), false)
  assert.equal(historyTotals([], false), null)
  assert.deepEqual(historyTotals([], true), { total: 0, cash: 0, nonCash: 0, count: 0 })
  await assert.rejects(loadBuyInScope(api({ getCurrentOpenBusinessDate: async () => ({ businessDate: date, status: 'CLOSED' }) }), 'CASHIER'))
})

test('scope refresh replaces the dataset and rejects foreign Business Dates', async () => {
  let history = (await loadBuyInScope(api(), 'CASHIER')).history
  assert.equal(history.length, 1)
  history = (await loadBuyInScope(api({ getCurrentBusinessDateBuyIns: async () => [] }), 'CASHIER')).history
  assert.deepEqual(history, [])
  await assert.rejects(loadBuyInScope(api({ getCurrentBusinessDateBuyIns: async () => [row({ transaction: transaction({ businessDate: '2026-09-12' }) })] }), 'CASHIER'), /mismatched/)
  const page = await readFile('src/pages/cashier/BuyIn.jsx', 'utf8')
  assert.match(page, /setScope\(next\)/)
  assert.match(page, /setScope\(emptyScope\(\)\)/)
  assert.match(page, /loadBuyInScope\(scopeApi, role\)/)
})

test('malformed history and failed reconciliation cannot enable posting', async () => {
  await assert.rejects(loadBuyInScope(api({ getCurrentBusinessDateBuyIns: async () => null }), 'CASHIER'))
  await assert.rejects(loadBuyInScope(api({ getCurrentCashierReconciliation: async () => ({ businessDate: '2026-09-12', lifecycleStatus: 'OPEN' }) }), 'CASHIER'))
  assert.equal(ready({ finalized: true }), false)
  assert.equal(ready({ ready: false }), false)
  const directorApi = api({ getCustomers: () => assert.fail(), getCurrentCashierReconciliation: () => assert.fail() })
  assert.equal((await loadBuyInScope(directorApi, 'DIRECTOR')).history.length, 1)
})

test('search offers all explicit CID/name/phone matches, never nationality or first-match verification', async () => {
  const second = { ...customer, id: 'c2', customerCode: 'CUS-2', fullName: 'Alice Two' }
  assert.equal(matchingCustomers([customer, second], 'Alice').length, 2)
  assert.deepEqual(matchingCustomers([customer], 'Nepali'), [])
  assert.deepEqual(matchingCustomers([customer], ''), [])
  assert.equal(matchingCustomers([customer], '980').length, 1)
  assert.equal(ready({ selected: null }), false)
  const page = await readFile('src/pages/cashier/BuyIn.jsx', 'utf8')
  assert.match(page, /matches.map\(\(customer\) =>/)
  assert.match(page, /onClick=\{\(\) => selectCustomer\(customer\)\}/)
  assert.match(page, /setQuery\(event.target.value\); clearSelection\(\)/)
})

test('active verification requires current date, matching owner, OPEN and null exit', () => {
  assert.equal(verifySession(customer, session, date), session)
  for (const invalid of [null, { ...session, status: 'CLOSED' }, { ...session, exitTime: '2026-09-13T10:01:00' },
    { ...session, customerId: 'c2' }, { ...session, businessDate: '2026-09-12' }, { ...session, status: 'ACTIVE' }]) {
    assert.throws(() => verifySession(customer, invalid, date))
    assert.equal(Boolean(ready({ verified: invalid })), false)
  }
  assert.throws(() => verifySession({ ...customer, status: 'INACTIVE' }, session, date))
})

test('request generations suppress late selection, scope and unmounted responses', async () => {
  const guard = requestGuard(); const first = deferred(); const second = deferred(); let value
  const read = async (pending) => { const current = guard.next(); const result = await pending; if (current()) value = result }
  const old = read(first.promise); const fresh = read(second.promise)
  second.resolve('new customer'); await fresh; first.resolve('old customer'); await old
  assert.equal(value, 'new customer')
  const last = deferred(); const abandoned = read(last.promise); guard.invalidate(); last.resolve('abandoned'); await abandoned
  assert.equal(value, 'new customer')
})

test('quantity and tender validation never accepts fractions, mismatches or missing noncash reference', () => {
  assert.equal(denominationTotal({ 500: 2, 1000: 3 }), 4000)
  for (const invalid of [{ 1000: 1.5 }, { 1000: -1 }, { 200: 1 }, { 1000: Number.MAX_SAFE_INTEGER }]) assert.equal(denominationTotal(invalid), null)
  assert.equal(ready({ total: null }), false)
  assert.equal(ready({ amount: 999 }), false)
  for (const mode of ['BANK', 'QR', 'CARD']) { assert.equal(ready({ mode }), false); assert.equal(ready({ mode, reference: 'ref' }), true) }
})

test('summary uses persisted scoped CHIP receipts across all cashiers', () => {
  const data = scopedHistory([row(), row({ transaction: transaction({ id: 'b2', paymentMode: 'BANK' }) })], date)
  assert.deepEqual(historyTotals(data, true), { total: 2000, cash: 1000, nonCash: 1000, count: 2 })
})

test('synchronous submit guard prevents two POSTs while mutation is pending', async () => {
  const pending = deferred(); const submit = createBuyInSubmission(() => 'key'); let posts = 0
  const handlers = { post: async () => { posts++; return pending.promise }, onSuccess() {}, refresh: async () => {}, onWarning() {} }
  const first = submit.run({ amount: 1000 }, handlers)
  assert.equal(submit.pending, true)
  assert.equal(await submit.run({ amount: 1000 }, handlers), null)
  assert.equal(posts, 1)
  pending.resolve(transaction()); await first
  assert.equal(submit.pending, false)
})

test('POST success survives failed secondary refresh, preserves confirmation and never retries', async () => {
  const events = []; let posted; let keys = 0
  const submit = createBuyInSubmission(() => `key-${++keys}`)
  const result = await submit.run({ amount: 1000 }, {
    post: async () => transaction(), onSuccess: (created) => { posted = created; events.push('success') },
    refresh: async () => { events.push('refresh'); throw new Error('offline') },
    onWarning: (message) => { assert.match(message, /posted successfully.*Do not repost/); events.push('warning') },
  })
  assert.equal(result, posted)
  assert.deepEqual(events, ['success', 'refresh', 'warning'])
  assert.equal(keys, 1)
})

test('uncertain retries retain idempotency key and reject a changed payload', async () => {
  const keys = []; let sequence = 0
  const submit = createBuyInSubmission(() => `key-${++sequence}`)
  const handlers = { post: async (payload) => { keys.push(payload.idempotencyKey); throw new Error('network') }, onSuccess() {}, refresh: async () => {}, onWarning() {} }
  await assert.rejects(submit.run({ amount: 1000 }, handlers))
  await assert.rejects(submit.run({ amount: 2000 }, handlers), /unconfirmed/)
  await assert.rejects(submit.run({ amount: 1000 }, handlers))
  assert.deepEqual(keys, ['key-1', 'key-1'])
  assert.equal(sequence, 1)
})

test('CSV preserves filtered persisted records, actual date, safe actor and formula escaping', () => {
  for (const prefix of ['=', '+', '-', '@']) {
    const csv = buyInCsv([row({ customerName: `${prefix}SUM(1,2)"` })], date)
    assert.ok(csv.includes(`"'${prefix}SUM(1,2)"""`))
    assert.ok(csv.includes(`"${date}"`)); assert.ok(csv.includes('"cashier"'))
    assert.equal(csv.split('\n').length, 2)
  }
  assert.throws(() => buyInCsv([row({ transaction: transaction({ businessDate: '2026-09-12' }) })], date))
  assert.throws(() => buyInCsv([{ type: 'DEMO' }], date))
  assert.equal(buyInCsv([], date).split('\n').length, 1)
})

test('header hides fake search, shift and notification on Buy-In only; print and PDF disabled', async () => {
  const layout = await readFile('src/components/layout/MainLayout.jsx', 'utf8')
  assert.equal(isBuyInRoute('/cashier/buy-in'), true)
  assert.equal(isBuyInRoute('/cashier/cash-out'), false)
  assert.match(layout, /isManagementDashboard \|\| isBuyIn \? \(/)
  assert.match(layout, /!isManagementDashboard && !isBuyIn && !isReception && !isCustomerDirectory/)
  const page = await readFile('src/pages/cashier/BuyIn.jsx', 'utf8')
  assert.match(page, /disabled title="Scoped print is unavailable/)
  assert.match(page, /disabled title="PDF reporting is unavailable/)
  assert.match(page, /disabled=\{!operational \|\| pending\} onClick=\{exportCsv\}/)
})


test('Business Date rollover during an empty history read cannot fabricate old-date zero', async () => {
  let reads = 0
  await assert.rejects(loadBuyInScope(api({
    getCurrentOpenBusinessDate: async () => ({ status: 'OPEN', businessDate: ++reads === 1 ? date : '2026-09-14' }),
    getCurrentBusinessDateBuyIns: async () => [],
  }), 'CASHIER'), /Business Date changed/)
})
