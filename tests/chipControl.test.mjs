import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { build } from 'esbuild'
import { MOVEMENT_LABELS, movementLabel, exposureLabel, money, difference, parseQuantities,
  inventoryPayload, directoryPayload, movementsPayload, tablesPayload, loadControlScope,
  requestGuard, sessionCsv, displayLocation, recordedTime, createCustodySubmission,
  canFloat, lifecycleAllows, isChipControlRoute } from '../src/utils/chipControl.js'
const date = '2026-09-02'
const open = { businessDate: date, status: 'OPEN' }
const inventory = (type = 'CAGE', id = null) => ({ locationType: type, referenceId: id, initialized: true,
  denominations: { 500: 0, 1000: 10, 5000: 0, 10000: 0, 25000: 0 }, totalValue: 10000 })
const session = (extra = {}) => ({ customerId: 'c', customerSessionId: 's', customerCode: 'CUS-1', customerName: 'Alice',
  sessionCode: 'SES-1', businessDate: date, sessionStatus: 'OPEN', totalBuyIn: 10000,
  verifiedGamingWin: 500, verifiedGamingLoss: 0, totalCashOut: 0, calculatedChipPosition: 10500,
  exposureStatus: 'OUTSTANDING', ...extra })
const movement = (extra = {}) => ({ id: 'm', businessDate: date, createdAt: '2026-09-04T17:27:29', movementType: 'BUY_IN_ISSUE',
  denominations: { 1000: 10 }, totalValue: 10000, createdBy: 'actor', ...extra })
const table = { operationId: 't', businessDate: date, status: 'OPEN', tableCode: 'T-1', tableName: 'Table One', openingFloat: 10000 }
const status = { businessDate: date, businessDateOpen: true, systemLocked: false, businessDateHealth: 'HEALTHY', continuationOverrideActive: false }
const api = (extra = {}) => ({ getCurrentOpenBusinessDate: async () => open, getCageInventory: async () => inventory(),
  getChipControlSessions: async () => ({ businessDate: date, sessions: [session()] }), getTables: async () => [table],
  getCurrentMovements: async () => [movement()], getOperationalStatus: async () => status, ...extra })
const deferred = () => { let resolve, reject; const promise = new Promise((yes, no) => { resolve = yes; reject = no }); return { promise, resolve, reject } }
const permissions = { tables: true, history: true }

test('route permissions remain cashier/director/super-admin/pit-supervisor; mutation permissions stay narrower', async () => {
  const bundle = await build({ entryPoints: ['src/utils/accessControl.js'], bundle: true, write: false, format: 'esm', platform: 'node' })
  const { canAccessRoute } = await import(`data:text/javascript;base64,${Buffer.from(bundle.outputFiles[0].text).toString('base64')}`)
  for (const role of ['CASHIER','DIRECTOR','SUPER_ADMIN','PIT_SUPERVISOR']) assert.equal(canAccessRoute({ role }, '/chip-control'), true)
  for (const role of ['DEALER','RECEPTIONIST','ADMIN','AUDITOR']) assert.equal(canAccessRoute({ role }, '/chip-control'), false)
  for (const role of ['DIRECTOR','CASHIER','DEALER','ADMIN']) assert.equal(canFloat(role, table, date, true, false), false)
  for (const role of ['PIT_SUPERVISOR','SUPER_ADMIN']) assert.equal(canFloat(role, table, date, true, false), true)
})

test('no OPEN date preserves independent cage but disables scoped data and controls', async () => {
  const forbidden = () => assert.fail('No scoped API may run without an OPEN date')
  const result = await loadControlScope(api({ getCurrentOpenBusinessDate: async () => null,
    getChipControlSessions: forbidden, getTables: forbidden, getCurrentMovements: forbidden, getOperationalStatus: forbidden }), permissions)
  assert.equal(result.date, null); assert.equal(result.cage.totalValue, 10000)
  assert.equal(result.directory, null); assert.equal(result.movements, null)
  assert.equal(canFloat('SUPER_ADMIN', table, null, true, false), false)
})

test('zero inventory is valid while missing, malformed or inconsistent totals remain unavailable', () => {
  const zero = { ...inventory(), denominations: { 500: 0, 1000: 0, 5000: 0, 10000: 0, 25000: 0 }, totalValue: 0 }
  assert.equal(inventoryPayload(zero, 'CAGE').totalValue, 0)
  assert.equal(money(0), 'NPR 0')
  for (const value of [null, undefined, '', NaN]) assert.equal(money(value), 'Unavailable')
  for (const bad of [null, { ...zero, totalValue: null }, { ...zero, denominations: {} }, { ...zero, totalValue: 1 }, { ...zero, locationType: 'PIT_TABLE' }]) {
    assert.throws(() => inventoryPayload(bad, 'CAGE'), /unavailable/)
  }
  assert.throws(() => inventoryPayload(inventory('CUSTOMER_SESSION','old'), 'CUSTOMER_SESSION', 'new'))
})

test('financial payload must be complete, but future status is safely displayable', () => {
  assert.throws(() => directoryPayload({ businessDate: date, sessions: [session({ calculatedChipPosition: null })] }, date))
  assert.throws(() => directoryPayload({ businessDate: date, sessions: [session({ businessDate: '2026-09-01' })] }, date))
  assert.throws(() => directoryPayload({ businessDate: date, sessions: [session({ sessionStatus: 'CLOSED' })] }, date))
  assert.equal(directoryPayload({ businessDate: date, sessions: [session({ exposureStatus: 'FUTURE' })] }, date).sessions.length, 1)
  assert.equal(exposureLabel('FUTURE'), 'Unknown / Legacy')
  assert.equal(exposureLabel('NEGATIVE_POSITION'), 'Negative position')
})

test('each failed section is unavailable; successful current sections remain visible', async () => {
  const result = await loadControlScope(api({ getCurrentMovements: async () => { throw new Error('ledger failed') } }), permissions)
  assert.equal(result.date, date); assert.equal(result.directory.sessions.length, 1)
  assert.equal(result.cage.totalValue, 10000); assert.equal(result.movements, null)
  assert.equal(result.errors.movements, 'ledger failed')
})

test('date rollover rejects all scoped datasets even when history is empty', async () => {
  let reads = 0
  const result = await loadControlScope(api({ getCurrentOpenBusinessDate: async () => ++reads === 1 ? open : { ...open, businessDate: '2026-09-03' },
    getCurrentMovements: async () => [] }), permissions)
  assert.equal(result.date, null); assert.equal(result.movements, null); assert.equal(result.directory, null)
  assert.ok(result.errors.date); assert.ok(result.cage)
})

test('older Refresh All results cannot overwrite newer page generation', async () => {
  const guard = requestGuard(), first = deferred(), second = deferred(); let state
  async function refresh(read) { const current = guard.next(); const result = await loadControlScope(api({ getCageInventory: () => read }), permissions); if (current()) state = result }
  const old = refresh(first.promise), fresh = refresh(second.promise)
  second.resolve({ ...inventory(), totalValue: 0, denominations: { 500: 0,1000: 0,5000: 0,10000: 0,25000: 0 } }); await fresh
  first.resolve(inventory()); await old
  assert.equal(state.cage.totalValue, 0)
})

for (const label of ['customer-session','pit-table']) test(`late ${label} selection and refresh invalidation cannot overwrite current custody`, async () => {
  const guard = requestGuard(), first = deferred(), second = deferred(); let state
  async function select(read) { const current = guard.next(); const value = await read; if (current()) state = value }
  const old = select(first.promise), fresh = select(second.promise)
  second.resolve('new'); await fresh; first.resolve('old'); await old; assert.equal(state, 'new')
  const pending = deferred(), ignored = select(pending.promise); guard.invalidate(); state = null
  pending.resolve('old after refresh'); await ignored; assert.equal(state, null)
})

test('page refresh clears IDs and invalidates both selection requests; tables have guarded reads', async () => {
  const page = await readFile('src/pages/cashier/WalletTransactions.jsx', 'utf8')
  assert.match(page, /sessionGeneration.current.invalidate\(\); tableGeneration.current.invalidate\(\)/)
  assert.match(page, /setSelectedSessionId\(''\); setSelectedTableId\(''\)/)
  assert.match(page, /if \(current\(\)\) setTableCustody\(value\)/)
  assert.match(page, /if \(current\(\)\) setSessionCustody\(value\)/)
  assert.match(page, /setInterval\(checkDate, 30000\)/)
})

test('closed and unknown operations are read-only, and lifecycle locks prevent enabled float posting', () => {
  assert.equal(tablesPayload([{ ...table, status: 'CLOSED' }], date).length, 1)
  for (const state of ['CLOSED','UNKNOWN']) assert.equal(canFloat('SUPER_ADMIN', { ...table, status: state }, date, true, false), false)
  assert.equal(canFloat('SUPER_ADMIN', table, date, true, true), false)
  assert.equal(lifecycleAllows({ ...status, systemLocked: true }), false)
  const stale = { ...status, businessDateHealth: 'STALE', staleByDays: 2, serverTimestamp: '2026-09-04T17:00:00' }
  assert.equal(lifecycleAllows(stale), false); assert.equal(lifecycleAllows(stale, true), true)
  assert.equal(lifecycleAllows({ ...stale, continuationOverrideActive: true }), true)
})

test('all movement types have readable labels; unknown types remain read-only legacy records', () => {
  assert.equal(Object.keys(MOVEMENT_LABELS).length, 8)
  assert.equal(movementLabel('LEGACY_CUSTODY_CORRECTION'), 'Legacy Custody Correction')
  assert.match(movementLabel('FUTURE'), /Unknown \/ Legacy/)
  assert.equal(movementsPayload([movement({ movementType: 'FUTURE' })], date).length, 1)
})

test('recorded time never rewrites historical Business Date; ledger shows friendly references and secondary IDs', async () => {
  assert.equal(movementsPayload([movement()], date)[0].businessDate, date)
  assert.match(recordedTime(movement().createdAt), /2026-09-04 17:27:29/)
  assert.equal(displayLocation('CUSTOMER_SESSION', { customerCode: 'CUS-1', customerName: 'Alice', sessionCode: 'SES-1' }), 'CUS-1 · Alice · SES-1')
  const page = await readFile('src/pages/cashier/WalletTransactions.jsx', 'utf8')
  assert.match(page, /Business Date \/ Recorded Time \(Kathmandu\)/)
  assert.match(page, /movement.businessDate/); assert.match(page, /Audit IDs/)
  assert.doesNotMatch(page, /new Date\(movement.createdAt\)/)
})

test('financial/physical difference is informational and never forces equality', () => {
  assert.equal(difference(10500, 10000), 500)
  assert.equal(difference(5000, 10000), -5000)
  assert.equal(difference(null, 10000), null)
})

test('quantity confirmation uses exactly submitted whole quantities; invalid entries cannot be silently dropped', () => {
  assert.deepEqual(parseQuantities({ 500: '2', 1000: '', 5000: '1' }), { denominations: { 500: 2, 5000: 1 }, total: 6000 })
  for (const quantities of [{ 500: '1.5' }, { 500: '-1' }, { 500: null }, { 100: 1 }, { 1000: Number.MAX_SAFE_INTEGER }]) assert.throws(() => parseQuantities(quantities))
})

test('CSV uses authorized session fields, row date and formula protection', () => {
  for (const prefix of ['=','+','-','@']) {
    const csv = sessionCsv([session({ customerName: `${prefix}SUM(1,2)"`, passwordHash: 'secret' })], date)
    assert.ok(csv.includes(`"'${prefix}SUM(1,2)"""`)); assert.ok(csv.includes(`"${date}"`))
    assert.doesNotMatch(csv, /secret/)
  }
  assert.throws(() => sessionCsv([session({ calculatedChipPosition: null })], date))
})

test('submission lock covers preflight and prevents concurrent POSTs', async () => {
  const gate = deferred(); const submit = createCustodySubmission(() => 'k'); let calls = 0
  const handlers = { preflight: () => gate.promise, post: async () => { calls++; return movement() }, success() {}, refresh: async () => {}, warning() {} }
  const first = submit.run({ kind: 'FLOAT' }, handlers)
  assert.equal(submit.pending, true); assert.equal(await submit.run({ kind: 'FLOAT' }, handlers), null)
  gate.resolve(); await first; assert.equal(calls, 1); assert.equal(submit.pending, false)
})

test('uncertain retries reuse key and target; changed operation is blocked', async () => {
  let keys = 0; const posted = []; const submit = createCustodySubmission(() => `key-${++keys}`)
  const handlers = { preflight: async () => {}, post: async (operation, key) => { posted.push(key); throw new Error('network') }, success() {}, refresh: async () => {}, warning() {} }
  await assert.rejects(submit.run({ target: 'one' }, handlers), /unconfirmed/)
  await assert.rejects(submit.run({ target: 'two' }, handlers), /unchanged/)
  await assert.rejects(submit.run({ target: 'one' }, handlers), /unconfirmed/)
  assert.deepEqual(posted, ['key-1','key-1']); assert.equal(keys, 1)
})

test('successful mutation stays confirmed when refresh fails and uses returned record', async () => {
  const submit = createCustodySubmission(() => 'key'); const events = []; let confirmation
  await submit.run({ kind: 'OPENING' }, { preflight: async () => {}, post: async () => movement(),
    success: (value) => { confirmation = value; events.push('success') },
    refresh: async () => { events.push('refresh'); throw new Error('offline') },
    warning: (message) => { assert.match(message, /posted successfully.*Do not repost/); events.push('warning') } })
  assert.equal(confirmation.id, 'm'); assert.deepEqual(events, ['success','refresh','warning'])
})

test('Chip Control header placeholders hidden without widening shared page behavior', async () => {
  const layout = await readFile('src/components/layout/MainLayout.jsx', 'utf8')
  assert.equal(isChipControlRoute('/chip-control'), true); assert.equal(isChipControlRoute('/cashier/cash-out'), false)
  assert.match(layout, /\) : isChipControl \? <p/)
  assert.match(layout, /!isChipControl && !isManagementDashboard/)
})
