import test from 'node:test'
import assert from 'node:assert/strict'
import { validateDashboard, formatDashboardMetric, formatDashboardTimestamp } from '../src/utils/managementDashboard.js'

const keys = ['activeCustomers', 'buyInTotal', 'cashOutTotal', 'losingReturnPaidTotal', 'activeTables', 'cashierVariance']
const response = () => ({ success: true, data: {
  businessDate: '2026-09-01', businessDateStatus: 'OPEN', timeZone: 'Asia/Kathmandu',
  lastUpdated: '2026-09-02T08:59:00+05:45', windowStart: '2026-09-01T09:00:00+05:45', windowEndExclusive: '2026-09-02T09:00:00+05:45',
  summary: Object.fromEntries(keys.map((key) => [key, { available: true, value: 0, description: 'Persisted aggregate' }])),
} })

test('available zero remains zero; unavailable and malformed values never become zero', () => {
  assert.equal(formatDashboardMetric({ available: true, value: 0 }, true), 'NPR 0')
  for (const value of [null, undefined, '', ' ', true, false, NaN, Infinity, {}, 'invalid']) {
    assert.equal(formatDashboardMetric({ available: true, value }, true), 'Not available')
  }
  assert.equal(formatDashboardMetric({ available: false, value: 0 }, true), 'Not available')
  assert.equal(formatDashboardMetric({ available: true, value: '-1250.25' }, true), 'NPR -1,250.25')
})

test('valid response preserves backend Business Date and rejects a mismatched selected date', () => {
  const envelope = response()
  assert.equal(validateDashboard(envelope, '2026-09-01'), envelope.data)
  assert.throws(() => validateDashboard(envelope, '2026-09-02'), /Business Date/)
})

test('incomplete, failed and malformed responses cannot silently render financial data', () => {
  assert.throws(() => validateDashboard({ success: false, message: 'Denied' }), /Denied/)
  assert.throws(() => validateDashboard({ success: true, message: 'Loaded' }), /Invalid dashboard/)
  const missing = response()
  delete missing.data.summary.buyInTotal
  assert.throws(() => validateDashboard(missing), /incomplete/)
  const invalid = response()
  invalid.data.summary.cashierVariance.value = null
  assert.throws(() => validateDashboard(invalid), /invalid metric/)
})

test('unsupported metrics require null values and an explanation', () => {
  const envelope = response()
  envelope.data.summary.activeMachines = { available: false, value: null, description: 'Not implemented' }
  assert.equal(validateDashboard(envelope).summary.activeMachines.value, null)
  envelope.data.summary.activeMachines.value = 0
  assert.throws(() => validateDashboard(envelope), /invalid metric/)
  envelope.data.summary.activeMachines.value = null
  envelope.data.summary.activeMachines.description = ''
  assert.throws(() => validateDashboard(envelope), /invalid metric/)
})

test('no-open-date response remains unavailable', () => {
  const envelope = response()
  Object.assign(envelope.data, { businessDate: null, businessDateStatus: 'NOT_OPEN', windowStart: null, windowEndExclusive: null })
  for (const key of keys) envelope.data.summary[key] = { available: false, value: null, description: 'No open Business Date' }
  assert.equal(validateDashboard(envelope).businessDate, null)
  envelope.data.summary.buyInTotal = { available: true, value: 0, description: 'Wrong' }
  assert.throws(() => validateDashboard(envelope), /invalid metric/)
})

test('timestamps render in Kathmandu across midnight regardless of browser timezone', () => {
  assert.match(formatDashboardTimestamp('2026-09-01T20:15:00Z'), /02 Sept? 2026, 02:00:00/)
  assert.equal(formatDashboardTimestamp(null), 'Not available')
  assert.equal(formatDashboardTimestamp('invalid'), 'Not available')
})
