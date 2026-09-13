import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { build } from 'esbuild'
import {
  UNAVAILABLE, canManageCustomers, isCustomersRoute, lastVisitLabel, mapCustomerDirectory,
  directorySummary, filterCustomerDirectory, csvCell, customerDirectoryCsv,
  createCustomerRequestGuard, fetchCustomerProfile,
} from '../src/utils/customersKyc.js'

const row = (overrides = {}) => ({ id: 'customer-a', customerCode: 'CUS-1001', fullName: 'Alice Example',
  nationality: 'Nepali', phone: '+9779800000000', totalVisits: 2, hasActiveSession: true,
  lastVisitBusinessDate: '2026-09-02', ...overrides })
const deferred = () => { let resolve; const promise = new Promise((done) => { resolve = done }); return { promise, resolve } }

test('canonical customer UI access excludes generic Admin and unrelated operational roles', async () => {
  const bundle = await build({ entryPoints: ['src/utils/accessControl.js'], bundle: true, write: false, format: 'esm', platform: 'node' })
  const { canAccessRoute } = await import(`data:text/javascript;base64,${Buffer.from(bundle.outputFiles[0].text).toString('base64')}`)
  for (const role of ['RECEPTIONIST', 'DIRECTOR', 'SUPER_ADMIN']) assert.equal(canAccessRoute({ role }, '/customers'), true)
  for (const role of ['ADMIN', 'CASHIER', 'PIT_SUPERVISOR', 'DEALER', 'AUDITOR', 'STORE_KEEPER']) assert.equal(canAccessRoute({ role }, '/customers'), false)
  assert.equal(canAccessRoute({ role: 'CASHIER' }, '/cashier/buy-in'), true)
})

test('registration aliases redirect to the single real customer flow; mock component is not routed', async () => {
  const routes = await readFile('src/routes/AppRoutes.jsx', 'utf8')
  assert.doesNotMatch(routes, /CustomerRegistration/)
  assert.equal((routes.match(/path="\/customers"/g) || []).length, 1)
  for (const path of ['/customers/register', '/reception/register']) {
    assert.ok(routes.includes(`path="${path}"\n  element={<Navigate to="/customers" replace />}`)
      || routes.includes(`path="${path}"\n        element={<Navigate to="/customers" replace />}`))
  }
})

test('management presentation only uses canonical privileged roles', () => {
  for (const role of ['DIRECTOR', 'SUPER_ADMIN']) assert.equal(canManageCustomers(role), true)
  for (const role of ['RECEPTIONIST', 'ADMIN', 'CASHIER', undefined]) assert.equal(canManageCustomers(role), false)
})

test('failed and malformed directory data never becomes authoritative zero', () => {
  for (const input of [null, {}, [row({ totalVisits: null })], [row({ totalVisits: -1 })], [row({ hasActiveSession: undefined })]]) {
    assert.throws(() => mapCustomerDirectory(input), /unavailable/)
  }
  assert.equal(directorySummary([], false).totalCustomers, UNAVAILABLE)
  assert.equal(directorySummary([], false).totalVisits, UNAVAILABLE)
  assert.equal(directorySummary(mapCustomerDirectory([]), true).totalCustomers, 0)
})

test('unsupported fields and finances remain explicitly unavailable', () => {
  const mapped = mapCustomerDirectory([row({ category: 'VIP', idNumber: 'private-number', lifetimeBuyIn: 999 })])
  for (const key of ['idType', 'idNumber', 'category']) assert.equal(mapped[0][key], UNAVAILABLE)
  for (const key of ['vipCustomers', 'totalBuyIn', 'totalCashOut']) assert.equal(directorySummary(mapped, true)[key], UNAVAILABLE)
  assert.equal(directorySummary(mapped, true).totalVisits, 2)
})

test('missing historical date is distinct from no visits', () => {
  assert.equal(lastVisitLabel(2, null), 'Historical date unavailable')
  assert.equal(lastVisitLabel(0, null), 'No visits')
  assert.equal(mapCustomerDirectory([row({ lastVisitBusinessDate: null })])[0].lastVisit, 'Historical date unavailable')
})

test('only supported directory fields drive filtering', () => {
  const rows = mapCustomerDirectory([row(), row({ id: 'b', customerCode: 'CUS-1002', fullName: 'Bob', nationality: 'Indian' })])
  for (const query of ['alice', 'CUS-1001']) assert.equal(filterCustomerDirectory(rows, query, 'ALL').length, 1)
  assert.equal(filterCustomerDirectory(rows, '', 'Indian')[0].id, 'b')
  assert.equal(filterCustomerDirectory(rows, 'Unavailable', 'ALL').length, 0)
})

test('CSV neutralizes formula prefixes and preserves quotes', () => {
  for (const prefix of ['=', '+', '-', '@', '  =', '\t+']) assert.equal(csvCell(prefix + 'SUM(A1)'), `"'${prefix}SUM(A1)"`)
  assert.equal(csvCell('A "quoted" name'), '"A ""quoted"" name"')
})

test('CSV exports only the filtered safe directory fields, never privileged profile data', () => {
  const rows = mapCustomerDirectory([row(), row({ id: 'b', fullName: 'Bob' })])
  rows[0].internalNotes = 'SECRET'
  rows[0].riskLevel = 'HIGH'
  rows[0].identityDocuments = [{ documentNumber: 'PRIVATE' }]
  const csv = customerDirectoryCsv(filterCustomerDirectory(rows, 'Alice', 'ALL'))
  assert.match(csv, /Alice Example/)
  assert.doesNotMatch(csv, /Bob|SECRET|HIGH|PRIVATE|Net Win|Lifetime Buy/)
  assert.match(csv, /"'\+9779800000000"/)
})

test('old directory/profile responses and close/mode invalidation cannot replace current state', async () => {
  const guard = createCustomerRequestGuard()
  const old = deferred()
  let profile
  const oldCurrent = guard.next()
  const pending = old.promise.then((value) => { if (oldCurrent()) profile = value })
  const newCurrent = guard.next()
  if (newCurrent()) profile = { id: 'new' }
  old.resolve({ id: 'old' })
  await pending
  assert.equal(profile.id, 'new')
  guard.invalidate()
  assert.equal(newCurrent(), false)
})

test('Reception profile never requests privileged data; management reuses included history', async () => {
  let privilegedCalls = 0
  const documents = [{ id: 'doc' }]
  const api = {
    getCustomerKyc: async (id) => ({ id }),
    getPrivilegedCustomerKyc: async (id) => { privilegedCalls++; return { id, identityDocuments: documents } },
    getCustomerIdentityDocuments: () => { throw new Error('Duplicate history request') },
  }
  assert.deepEqual((await fetchCustomerProfile(api, 'a', false)).documents, [])
  assert.equal(privilegedCalls, 0)
  assert.equal((await fetchCustomerProfile(api, 'a', true)).documents, documents)
  assert.equal(privilegedCalls, 1)
  await assert.rejects(fetchCustomerProfile({ ...api, getCustomerKyc: async () => ({ id: 'wrong' }) }, 'a', false), /selected customer/)
})

test('customer header scope is specific, and page print cannot print a privileged modal', async () => {
  for (const path of ['/customers', '/customers/kyc', '/customers/register']) assert.equal(isCustomersRoute(path), true)
  for (const path of ['/cashier', '/customers-other', '/dashboard']) assert.equal(isCustomersRoute(path), false)
  const page = await readFile('src/pages/reception/CustomersKyc.jsx', 'utf8')
  const header = await readFile('src/components/layout/MainLayout.jsx', 'utf8')
  assert.doesNotMatch(page, /window\.print|Director \/ Admin|Buy-in minus cash-out|idTypeFilter|categoryFilter/)
  assert.match(page, /disabled title="Directory print is unavailable/)
  assert.equal((header.match(/!isCustomerDirectory/g) || []).length, 2)
})

test('directory and registration use real APIs even when legacy mock flag is enabled; registration opens no session', async () => {
  const calls = []
  globalThis.__customerC1aHttp = {
    get: async (path) => { calls.push(['GET', path]); return { data: [row()] } },
    post: async (path, payload) => { calls.push(['POST', path, payload]); return { data: row() } },
  }
  globalThis.localStorage = { getItem: () => null }
  const bundle = await build({
    entryPoints: ['src/api/customerApi.js'], bundle: true, write: false, format: 'esm', platform: 'node',
    define: { 'import.meta.env': '{"VITE_USE_MOCK_CUSTOMERS":"true"}' },
    plugins: [{ name: 'http', setup(builder) {
      builder.onResolve({ filter: /axiosInstance$/ }, () => ({ path: 'http', namespace: 'test' }))
      builder.onLoad({ filter: /.*/, namespace: 'test' }, () => ({ contents: 'export default globalThis.__customerC1aHttp' }))
    } }],
  })
  const api = await import(`data:text/javascript;base64,${Buffer.from(bundle.outputFiles[0].text).toString('base64')}`)
  assert.equal((await api.getCustomerDirectory())[0].id, 'customer-a')
  const payload = { fullName: 'Alice Example', phone: '9800000000', nationality: 'Nepali' }
  await api.registerCustomer(payload)
  assert.deepEqual(calls, [['GET', '/customers'], ['POST', '/customers', payload]])
  delete globalThis.__customerC1aHttp
  delete globalThis.localStorage
})
