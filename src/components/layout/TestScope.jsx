import { useLocation } from 'react-router-dom'
import { authoritativeTestMode, isDeferredTestRoute } from '../../utils/testEnvironment'
export function TestScopeContent({ path, children }) {
  if (authoritativeTestMode && isDeferredTestRoute(path)) return <section role="status" className="rounded-xl border bg-white p-6"><h1 className="text-xl font-bold">Deferred / Not available in current test scope</h1><p className="mt-2">This workflow is excluded from authoritative system testing. No prototype records are loaded or saved.</p></section>
  return children
}
export default function TestScope({ children }) {
  return <TestScopeContent path={useLocation().pathname}>{children}</TestScopeContent>
}
