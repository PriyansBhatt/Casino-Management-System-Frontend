import test from 'node:test'
import assert from 'node:assert/strict'
import { loadReceptionScope, canMutateReception, sessionStatusLabel, createRequestGuard } from '../src/utils/receptionScope.js'

const date = '2026-09-02'
const openDate = { businessDate: date, status: 'OPEN' }

test('operational loader requests the persisted OPEN date and preserves anomalous timestamps', async () => {
  const sessions = [{ businessDate: date, entryTime: '2026-09-04T17:27:29', status: 'CLOSED', exitTime: null }]
  let requestedDate
  const result = await loadReceptionScope({
    getCurrentOpenBusinessDate: async () => openDate,
    getCustomers: async () => [],
    getSessions: async (value) => { requestedDate = value; return sessions },
  })
  assert.equal(requestedDate, date)
  assert.equal(result.sessions, sessions)
})

test('no OPEN date never requests historical sessions or represents them as current', async () => {
  const unexpected = () => { throw new Error('Must not request unscoped data') }
  assert.deepEqual(await loadReceptionScope({
    getCurrentOpenBusinessDate: async () => null,
    getCustomers: unexpected, getSessions: unexpected,
  }), { businessDate: null, customers: [], sessions: [] })
})

test('empty scoped result is valid; mixed dates and malformed responses fail visibly', async () => {
  const api = { getCurrentOpenBusinessDate: async () => openDate, getCustomers: async () => [], getSessions: async () => [] }
  assert.deepEqual((await loadReceptionScope(api)).sessions, [])
  for (const sessions of [null, {}, [{ businessDate: '2026-09-03' }]]) {
    await assert.rejects(loadReceptionScope({ ...api, getSessions: async () => sessions }), /scoped Reception/)
  }
  await assert.rejects(loadReceptionScope({ ...api, getCurrentOpenBusinessDate: async () => ({ ...openDate, status: 'CLOSED' }) }), /OPEN Business Date/)
})

test('only canonical Receptionist and Super Admin roles enable mutations', () => {
  for (const role of ['RECEPTIONIST', 'SUPER_ADMIN']) assert.equal(canMutateReception(role), true)
  for (const role of ['DIRECTOR', 'ADMIN', 'CASHIER', 'receptionist', null, undefined]) assert.equal(canMutateReception(role), false)
})

test('legacy states stay unknown rather than becoming OPEN or CLOSED', () => {
  assert.equal(sessionStatusLabel('OPEN'), 'OPEN')
  assert.equal(sessionStatusLabel('CLOSED'), 'CLOSED')
  for (const status of ['active', 'ACTIVE', 'open', 'closed', '', null]) assert.match(sessionStatusLabel(status), /^Unknown \/ legacy/)
})

test('older asynchronous results cannot replace a newer search or selection', async () => {
  const guard = createRequestGuard()
  let releaseOld
  const oldResponse = new Promise((resolve) => { releaseOld = resolve })
  let shown
  const oldCurrent = guard.next()
  const oldTask = oldResponse.then((value) => { if (oldCurrent()) shown = value })
  const newCurrent = guard.next()
  await Promise.resolve('new customer').then((value) => { if (newCurrent()) shown = value })
  releaseOld('old customer')
  await oldTask
  assert.equal(shown, 'new customer')
  guard.invalidate()
  assert.equal(newCurrent(), false)
})

// Bundle in memory using the existing Vite/esbuild dependency; no test framework installation.
async function importWithHttpStub(entry, http) {
  const { build } = await import('esbuild')
  globalThis.__receptionTestHttp = http
  const result = await build({
    entryPoints: [entry], bundle: true, write: false, format: 'esm', platform: 'node',
    plugins: [{ name: 'reception-http-stub', setup(builder) {
      builder.onResolve({ filter: /axiosInstance$/ }, () => ({ path: 'http', namespace: 'test' }))
      builder.onLoad({ filter: /.*/, namespace: 'test' }, () => ({ contents: 'export default globalThis.__receptionTestHttp' }))
    } }],
  })
  return import(`data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString('base64')}`)
}

test('Reception API sends Business Date as a query parameter and rejects failed date envelopes', async () => {
  const calls = []
  let payload = { success: true, data: null }
  const { receptionApi } = await importWithHttpStub('src/api/receptionApi.js', {
    get: async (...args) => { calls.push(args); return { data: payload } },
  })
  await receptionApi.getSessions(date)
  assert.deepEqual(calls.at(-1), ['/sessions', { params: { businessDate: date } }])
  await receptionApi.getSessions()
  assert.deepEqual(calls.at(-1), ['/sessions', { params: {} }])
  assert.equal(await receptionApi.getCurrentOpenBusinessDate(), null)
  for (const invalid of [{ success: false, data: null }, { success: true }, null]) {
    payload = invalid
    await assert.rejects(receptionApi.getCurrentOpenBusinessDate(), /unavailable/)
  }
})

test('canonical route guards exclude Admin from Gate without changing unrelated route roles', async () => {
  const { canAccessRoute } = await importWithHttpStub('src/utils/accessControl.js', {})
  for (const path of ['/reception', '/reception/gate']) {
    for (const role of ['RECEPTIONIST', 'DIRECTOR', 'SUPER_ADMIN']) assert.equal(canAccessRoute({ role }, path), true)
    for (const role of ['ADMIN', 'CASHIER', 'DEALER']) assert.equal(canAccessRoute({ role }, path), false)
  }
  assert.equal(canAccessRoute({ role: 'ADMIN' }, '/dashboard'), true)
})
