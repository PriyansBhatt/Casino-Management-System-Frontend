// Explicit opt-out restores legacy/demo routes; normal runs are authoritative.
export const authoritativeTestMode = import.meta.env?.VITE_AUTHORITATIVE_TEST_MODE !== 'false'
export const mockFlags = ['VITE_USE_MOCK_AUTH', 'VITE_USE_MOCK_BUSINESS_STATUS', 'VITE_USE_MOCK_CUSTOMERS', 'VITE_USE_MOCK_CASHIER', 'VITE_USE_MOCK_REPORTS', 'VITE_USE_MOCK_PIT', 'VITE_USE_MOCK_DIRECTOR', 'VITE_USE_MOCK_STORE', 'VITE_USE_MOCK_ACCOUNTS', 'VITE_USE_MOCK_AUDIT', 'VITE_USE_MOCK_ADMIN', 'VITE_USE_MOCK_NOTIFICATIONS', 'VITE_USE_MOCK_ANALYTICS']
export function testEnvironmentDefines(env) {
  const enabled = env.VITE_AUTHORITATIVE_TEST_MODE !== 'false'
  return { 'import.meta.env.VITE_AUTHORITATIVE_TEST_MODE': JSON.stringify(String(enabled)),
    ...(enabled ? Object.fromEntries(mockFlags.map(flag => [`import.meta.env.${flag}`, JSON.stringify('false')])) : {}) }
}
export function isDeferredTestRoute(path) {
  let decoded
  try { decoded = decodeURIComponent(path) } catch { return true }
  const root = decoded.toLowerCase().replace(/\/+$/, '') || '/'
  return ['/store','/procurement','/accounts','/analytics','/notifications','/demo','/testing','/audit-logs','/director'].some(prefix => root === prefix || root.startsWith(prefix + '/'))
    || root === '/settings'
    || (root.startsWith('/admin/') && !['/admin/business-date','/admin/system-lock'].includes(root))
    || (root.startsWith('/reports/') && root !== '/reports/running-funds')
}
