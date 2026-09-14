import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { build } from 'esbuild'
import { requestGuard } from '../src/utils/buyIn.js'
import { canPostCashOut, loadCashOutScope, postingAllowed, emptySelection, loadSelection, financialPayload,
  eligibilityPayload, persistedHistory, returnWorkspace, freezeCashOut, freezeLosingReturn,
  createCashOutSubmission, payoutChanged } from '../src/utils/cashOut.js'
const date = '2026-09-02'
const customer = { id: 'c', customerCode: 'CUS-1', fullName: 'Customer One', status: 'ACTIVE' }
const session = { id: 's', customerId: 'c', status: 'OPEN', exitTime: null, businessDate: date }
const financial = { customerId: 'c', customerSessionId: 's', businessDate: date, totalBuyIn: 10000, totalCashOut: 0, verifiedGamingWin: 500, verifiedGamingLoss: 0, calculatedChipPosition: 10500 }
const custody = { locationType: 'CUSTOMER_SESSION', referenceId: 's', initialized: true, denominations: { 500: 0, 1000: 10, 5000: 0, 10000: 0, 25000: 0 }, totalValue: 10000 }
const quote = { customerId: 'c', customerSessionId: 's', businessDate: date, totalBuyIn: 10000, verifiedWins: 0, verifiedLosses: 20000, previousCashOuts: 0, previousLosingReturns: 0, eligibleVerifiedLoss: 20000, minimumEligibleLoss: 20000, returnRate: 0.1, availableReturnAmount: 2000, eligible: true, alreadyPaid: false, eligibilityReason: 'Eligible' }
const selection = { customer, session, financial, custody, eligibility: quote }
const status = { businessDate: date, businessDateOpen: true, systemLocked: false, businessDateHealth: 'STALE', continuationOverrideActive: false }
const scope = { date, status, reconciliation: { businessDate: date, lifecycleStatus: 'OPEN' } }
const api = (extra = {}) => ({ getCurrentOpenBusinessDate: async () => ({ businessDate: date, status: 'OPEN' }), getOperationalStatus: async () => status,
  getCurrentCashierReconciliation: async () => scope.reconciliation, getActiveSession: async () => session,
  getSessionFinancialPosition: async () => financial, getCustomerSessionInventory: async () => custody,
  getCashOutsBySession: async () => [], getLosingReturnHistory: async () => [], ...extra })
const form = { paymentMode: 'CASH', paymentReference: '', remarks: '' }
const operation = () => freezeCashOut(selection, scope, { 1000: 10 }, form)
const deferred = () => { let resolve; const promise = new Promise((r) => { resolve = r }); return { resolve, promise } }

test('Cash-Out route permits Cashier/Super Admin mutations and Director read only; unrelated roles denied', async () => {
  const bundle = await build({ entryPoints: ['src/utils/accessControl.js'], bundle: true, write: false, format: 'esm', platform: 'node' })
  const { canAccessRoute } = await import(`data:text/javascript;base64,${Buffer.from(bundle.outputFiles[0].text).toString('base64')}`)
  for (const role of ['CASHIER','SUPER_ADMIN','DIRECTOR']) assert.equal(canAccessRoute({ role }, '/cashier/cash-out'), true)
  for (const role of ['ADMIN','RECEPTIONIST','PIT_SUPERVISOR','DEALER']) assert.equal(canAccessRoute({ role }, '/cashier/cash-out'), false)
  assert.equal(canPostCashOut('DIRECTOR'), false); assert.equal(canPostCashOut('CASHIER'), true); assert.equal(canPostCashOut('SUPER_ADMIN'), true)
  assert.equal(postingAllowed('DIRECTOR', scope), false)
})
test('real date and settlement STALE semantics are preserved without mock dates', async () => {
  const value = await loadCashOutScope(api(), 'CASHIER')
  assert.equal(value.date, date); assert.equal(postingAllowed('CASHIER', value), true)
  assert.equal(postingAllowed('CASHIER', { ...value, status: { ...status, systemLocked: true } }), false)
})
test('no OPEN Business Date means unavailable, never an operational zero', async () => {
  const value = await loadCashOutScope(api({ getCurrentOpenBusinessDate: async () => null, getOperationalStatus: () => assert.fail('must not read') }), 'CASHIER')
  assert.equal(value.date, null); assert.equal(value.reconciliation, null); assert.equal(postingAllowed('CASHIER', value), false)
})
test('reconciliation failure, malformed response and submitted status fail closed', async () => {
  await assert.rejects(loadCashOutScope(api({ getCurrentCashierReconciliation: async () => { throw new Error('reconciliation failed') } }), 'CASHIER'))
  await assert.rejects(loadCashOutScope(api({ getCurrentCashierReconciliation: async () => null }), 'CASHIER'))
  assert.equal(postingAllowed('CASHIER', { ...scope, reconciliation: { businessDate: date, lifecycleStatus: 'SUBMITTED' } }), false)
  assert.equal(postingAllowed('CASHIER', null), false)
})
test('Director reads do not fetch a privileged operator reconciliation', async () => {
  const value = await loadCashOutScope(api({ getCurrentCashierReconciliation: () => assert.fail('Director does not post') }), 'DIRECTOR')
  assert.equal(value.date, date); assert.equal(value.reconciliation, null)
})
test('Business Date rollover during prerequisite reads rejects stale scope', async () => {
  let count = 0
  await assert.rejects(loadCashOutScope(api({ getCurrentOpenBusinessDate: async () => ({ status: 'OPEN', businessDate: count++ ? '2026-09-03' : date }) }), 'CASHIER'), /changed/)
})
test('failed financial/custody/history reads are null with errors, not zero or empty', async () => {
  const reject = async () => { throw new Error('unavailable') }
  const value = await loadSelection(api({ getSessionFinancialPosition: reject, getCustomerSessionInventory: reject, getCashOutsBySession: reject }), customer, date)
  assert.equal(value.financial, null); assert.equal(value.custody, null); assert.equal(value.cashHistory, null)
  assert.deepEqual(value.returnHistory, []); assert.equal(Object.keys(value.errors).length, 3)
})
test('failed, exited, wrong-owner and wrong-date sessions cannot be verified', async () => {
  for (const invalid of [null, { ...session, exitTime: '2026-09-02T12:00' }, { ...session, customerId: 'other' }, { ...session, businessDate: '2026-09-01' }, { ...session, status: 'CLOSED' }]) {
    await assert.rejects(loadSelection(api({ getActiveSession: async () => invalid }), customer, date), /OPEN/)
  }
})
for (const name of ['search','verification','eligibility','prerequisite']) test(`stale ${name} completion cannot overwrite the latest generation`, async () => {
  const guard = requestGuard(), first = deferred(), second = deferred(); let displayed = null
  const read = async (promise) => { const current = guard.next(); const value = await promise; if (current()) displayed = value }
  const a = read(first.promise), b = read(second.promise)
  second.resolve('new'); await b; first.resolve('old'); await a; assert.equal(displayed, 'new')
  const c = read(Promise.resolve('invalidated')); guard.invalidate(); await c; assert.equal(displayed, 'new')
})
test('customer change empties authoritative state and rejects a quote for another target/date', () => {
  assert.ok(Object.values(emptySelection()).every((v) => v === null))
  assert.throws(() => eligibilityPayload(quote, 'other', 's', date))
  assert.throws(() => eligibilityPayload(quote, 'c', 's', '2026-09-03'))
  assert.throws(() => financialPayload({ ...financial, calculatedChipPosition: null }, 'c', 's', date))
})
test('financial and denomination custody independently bound a partial and exact Cash-Out', () => {
  const full = returnWorkspace({ 1000: 10 }, financial, custody)
  assert.equal(full.total, 10000); assert.equal(full.financialRemaining, 500); assert.equal(full.physicalRemaining, 0)
  const partial = returnWorkspace({ 1000: 3 }, financial, custody)
  assert.equal(partial.financialRemaining, 7500); assert.equal(partial.physicalRemaining, 7000)
  assert.throws(() => returnWorkspace({ 1000: 11 }, financial, custody), /custody/)
  assert.throws(() => returnWorkspace({ 1000: 10 }, { ...financial, calculatedChipPosition: 9500 }, custody), /entitlement/)
  for (const q of [-1,1.5,'text',Number.MAX_SAFE_INTEGER]) assert.throws(() => returnWorkspace({ 1000: q }, financial, custody))
})
test('Cash-Out requires positive denominations and a reference for noncash', () => {
  assert.throws(() => freezeCashOut(selection, scope, {}, form))
  assert.throws(() => freezeCashOut(selection, scope, { 1000: 1 }, { ...form, paymentMode: 'QR' }), /reference/)
})
test('confirmation target is copied deeply and immutable including denominations and retry key', () => {
  const submit = createCashOutSubmission(() => 'key'), op = operation(), frozen = submit.prepare(op)
  op.payload.customerId = 'other'; op.payload.denominations[1000] = 1
  assert.equal(frozen.payload.customerId, 'c'); assert.equal(frozen.payload.denominations[1000], 10); assert.equal(frozen.payload.idempotencyKey, 'key')
  assert.throws(() => { frozen.payload.denominations[1000] = 1 })
})
test('synchronous duplicate guard covers preflight and POST; success consumes key', async () => {
  let keys = 0, calls = 0
  const submit = createCashOutSubmission(() => `key-${++keys}`); submit.prepare(operation()); const wait = deferred()
  const callbacks = { preflight: () => wait.promise, post: async () => { calls++; return { id: 'persisted' } }, success: () => {}, refresh: async () => {}, warning: () => {} }
  const first = submit.run(callbacks); assert.equal(await submit.run(callbacks), null)
  wait.resolve(); assert.equal((await first).confirmed, true); assert.equal(calls, 1); assert.equal(submit.target, null)
  assert.equal(submit.prepare(operation()).payload.idempotencyKey, 'key-2')
})
test('uncertain retry keeps target/key, disallows edits and reaches backend replay after lifecycle changes', async () => {
  const submit = createCashOutSubmission(() => 'stable'); submit.prepare(operation()); const posted = []
  const callbacks = { preflight: async () => {}, post: async (target) => { posted.push(target); throw new Error('network') }, success: () => {}, refresh: async () => {}, warning: () => {} }
  await assert.rejects(submit.run(callbacks), /unconfirmed/); assert.equal(submit.uncertain, true)
  assert.throws(() => submit.prepare(operation()), /unconfirmed/); submit.cancel(); assert.ok(submit.target)
  await submit.run({ ...callbacks, preflight: () => assert.fail('Replay must reach backend'), post: async (target) => { posted.push(target); return { id: 'same' } } })
  assert.strictEqual(posted[0], posted[1]); assert.equal(posted[1].payload.idempotencyKey, 'stable')
})
test('confirmed POST with missing details and refresh failure remains successful, never uncertain', async () => {
  const submit = createCashOutSubmission(() => 'key'); submit.prepare(operation()); let confirmed = false, warning
  const result = await submit.run({ preflight: async () => {}, post: async () => undefined, success: () => { confirmed = true }, refresh: async () => { throw new Error('read failed') }, warning: (value) => { warning = value } })
  assert.equal(result.confirmed, true); assert.equal(confirmed, true); assert.match(warning, /successful/); assert.equal(submit.target, null); assert.equal(submit.uncertain, false)
})
test('already-paid quote is never actionable even when arithmetic availability increases', () => {
  const paid = { ...quote, eligible: false, alreadyPaid: true, availableReturnAmount: 3000, eligibilityReason: 'Already paid' }
  assert.throws(() => freezeLosingReturn({ ...selection, eligibility: paid }, scope, ''), /Already paid/)
  assert.throws(() => eligibilityPayload({ ...paid, eligible: true }, 'c', 's', date))
})
test('Losing Return never submits the quote amount; authoritative changed payout is displayed', () => {
  const target = freezeLosingReturn(selection, scope, '')
  assert.equal(Object.hasOwn(target.payload, 'amountPaid'), false); assert.equal(Object.hasOwn(target.payload, 'availableReturnAmount'), false)
  assert.equal(payoutChanged({ amountPaid: 3000 }, target), true); assert.equal(payoutChanged({ amountPaid: 2000 }, target), false)
})
test('history accepts only persisted customer/date scoped rows; malformed data is not empty', () => {
  const row = { id: 'persisted', customerId: 'c', customerSessionId: 's', businessDate: date, createdAt: '2026-09-03T16:00:00', cashOutCode: 'CO-1', cashPaid: 1000 }
  assert.equal(persistedHistory([row], 'cash', 'c', 's', date).length, 1)
  assert.deepEqual(persistedHistory([], 'return', 'c', 's', date), [])
  for (const rows of [null, [{}], [{ ...row, businessDate: '2026-09-01' }], [{ ...row, id: null }]]) assert.throws(() => persistedHistory(rows, 'cash', 'c', 's', date))
})
test('page wiring uses real authority, per-read generations, frozen targets and no fake header values', async () => {
  const page = await readFile('src/pages/cashier/CashOut.jsx', 'utf8'), layout = await readFile('src/components/layout/MainLayout.jsx', 'utf8'), apiSource = await readFile('src/api/cashOutApi.js', 'utf8')
  assert.doesNotMatch(page, /2083-03-04|useBusinessStatus|safeLogAuditEvent|window.print|Math.trunc/)
  assert.match(page, /scope\?\.date \|\| 'Unavailable'/); assert.match(page, /postingAllowed\(role, scope\)/)
  for (const guard of ['searchGuard','selectionGuard','quoteGuard','scopeGuard']) assert.match(page, new RegExp(`${guard}\\.current\\.next\\(`))
  assert.match(page, /setQuantities\(\{\}\); setForm\(emptyForm\(\)\); setReturnRemarks\(''\)/)
  assert.match(page, /setSelection\(\(old\) => \(\{ \.\.\.old, eligibility: null \}\)\)/)
  assert.match(page, /createCashOut\(target.payload\)/); assert.match(page, /createLosingReturn\(target.payload\)/)
  assert.match(page, /aria-label=\{`Return quantity/); assert.match(page, /aria-live="polite"/)
  assert.match(layout, /isCashOut \?/); assert.match(layout, /!isCashOut &&/)
  assert.doesNotMatch(apiSource, /MOCK|mock|2083/); assert.match(apiSource, /history\/customer/)
})
