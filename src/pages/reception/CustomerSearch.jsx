import { useCallback, useEffect, useMemo, useState } from 'react'
import receptionApi from '../../api/receptionApi'
import { getErrorMessage } from '../../utils/errorUtils'

const ReceptionDashboard = () => {
  const [customers, setCustomers] = useState([])
  const [sessions, setSessions] = useState([])
  const [businessDate, setBusinessDate] = useState(null)
  const [isPageLoading, setIsPageLoading] = useState(true)
  const [pageError, setPageError] = useState('')

  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [showCustomerModal, setShowCustomerModal] = useState(false)
  const [customerQuery, setCustomerQuery] = useState('')
  const [customerResults, setCustomerResults] = useState([])
  const [selectedCustomer, setSelectedCustomer] = useState(null)
  const [activeSession, setActiveSession] = useState(null)
  const [selectedSession, setSelectedSession] = useState(null)
  const [sessionToClose, setSessionToClose] = useState(null)
  const [modalError, setModalError] = useState('')
  const [isSearching, setIsSearching] = useState(false)
  const [isCheckingSession, setIsCheckingSession] = useState(false)
  const [isMutating, setIsMutating] = useState(false)
  const [toast, setToast] = useState(null)

  const customerById = useMemo(
    () => new Map(customers.map((customer) => [customer.id, customer])),
    [customers],
  )

  const loadPageData = useCallback(async () => {
    setIsPageLoading(true)
    setPageError('')
    try {
      const [customerData, sessionData, openBusinessDate] = await Promise.all([
        receptionApi.getCustomers(),
        receptionApi.getSessions(),
        receptionApi.getCurrentOpenBusinessDate(),
      ])
      setCustomers(Array.isArray(customerData) ? customerData : [])
      setSessions(Array.isArray(sessionData) ? sessionData : [])
      setBusinessDate(openBusinessDate)
    } catch (error) {
      setPageError(getErrorMessage(error))
    } finally {
      setIsPageLoading(false)
    }
  }, [])

  useEffect(() => {
    loadPageData()
  }, [loadPageData])

  const showToast = (message, type = 'success') => {
    setToast({ message, type })
    window.setTimeout(() => setToast(null), 3500)
  }

  const summary = useMemo(() => {
    const sessionsForBusinessDate = businessDate
      ? sessions.filter((session) => session.businessDate === businessDate.businessDate)
      : sessions

    return {
      total: sessionsForBusinessDate.length,
      open: sessionsForBusinessDate.filter((session) => session.status === 'OPEN').length,
      closed: sessionsForBusinessDate.filter((session) => session.status === 'CLOSED').length,
    }
  }, [businessDate, sessions])

  const displaySessions = useMemo(() => {
    const query = searchTerm.trim().toLowerCase()

    return sessions.filter((session) => {
      const customer = customerById.get(session.customerId)
      const matchesQuery =
        !query ||
        session.sessionCode?.toLowerCase().includes(query) ||
        customer?.customerCode?.toLowerCase().includes(query) ||
        customer?.fullName?.toLowerCase().includes(query) ||
        customer?.phone?.toLowerCase().includes(query)
      const matchesStatus = statusFilter === 'ALL' || session.status === statusFilter
      return matchesQuery && matchesStatus
    })
  }, [customerById, searchTerm, sessions, statusFilter])

  const openCustomerModal = () => {
    setCustomerQuery('')
    setCustomerResults([])
    setSelectedCustomer(null)
    setActiveSession(null)
    setModalError('')
    setShowCustomerModal(true)
  }

  const searchCustomers = async () => {
    const query = customerQuery.trim()
    setIsSearching(true)
    setModalError('')
    setSelectedCustomer(null)
    setActiveSession(null)
    try {
      const results = query
        ? await receptionApi.searchCustomers(query)
        : await receptionApi.getCustomers()
      setCustomerResults(Array.isArray(results) ? results : [])
      if (!results?.length) {
        setModalError('No matching customer was found.')
      }
    } catch (error) {
      setCustomerResults([])
      setModalError(getErrorMessage(error))
    } finally {
      setIsSearching(false)
    }
  }

  const selectCustomer = async (customer) => {
    setSelectedCustomer(customer)
    setActiveSession(null)
    setModalError('')
    setIsCheckingSession(true)
    try {
      setActiveSession(await receptionApi.getActiveSession(customer.id))
    } catch (error) {
      setModalError(getErrorMessage(error))
    } finally {
      setIsCheckingSession(false)
    }
  }

  const openSession = async () => {
    if (!selectedCustomer || isMutating || !businessDate) return

    setIsMutating(true)
    setModalError('')
    try {
      const session = await receptionApi.openSession(selectedCustomer.id)
      const refreshedActiveSession = await receptionApi.getActiveSession(selectedCustomer.id)
      setActiveSession(refreshedActiveSession || session)
      setSessions((current) => [session, ...current.filter((item) => item.id !== session.id)])
      showToast(`Session ${session.sessionCode} opened for ${selectedCustomer.fullName}.`)
    } catch (error) {
      const message = getErrorMessage(error)
      setModalError(message)
      showToast(message, 'error')

      if (message.includes('already has an active session')) {
        try {
          setActiveSession(await receptionApi.getActiveSession(selectedCustomer.id))
        } catch {
          // Keep the backend error visible if the follow-up lookup also fails.
        }
      }
    } finally {
      setIsMutating(false)
    }
  }

  const closeSession = async () => {
    if (!sessionToClose || isMutating || !businessDate) return

    setIsMutating(true)
    setModalError('')
    try {
      const closedSession = await receptionApi.closeSession(sessionToClose.id)
      setSessions((current) =>
        current.map((session) => (session.id === closedSession.id ? closedSession : session)),
      )
      setSelectedSession((current) =>
        current?.id === closedSession.id ? closedSession : current,
      )
      const refreshedActiveSession = await receptionApi.getActiveSession(closedSession.customerId)
      if (selectedCustomer?.id === closedSession.customerId) {
        setActiveSession(refreshedActiveSession)
      }
      setSessionToClose(null)
      showToast(`Session ${closedSession.sessionCode} closed successfully.`)
    } catch (error) {
      const message = getErrorMessage(error)
      setModalError(message)
      showToast(message, 'error')
    } finally {
      setIsMutating(false)
    }
  }

  const exportSessions = () => {
    const rows = displaySessions.map((session) => {
      const customer = customerById.get(session.customerId)
      return [
        session.sessionCode,
        customer?.customerCode || session.customerId,
        customer?.fullName || 'Unknown customer',
        customer?.phone || '',
        session.businessDate,
        session.entryTime,
        session.exitTime || '',
        session.status,
      ]
    })
    const csv = [
      ['Session', 'Customer Code', 'Customer', 'Phone', 'Business Date', 'Entry', 'Exit', 'Status'],
      ...rows,
    ]
      .map((row) => row.map((value) => `"${String(value ?? '').replaceAll('"', '""')}"`).join(','))
      .join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = `reception-sessions-${businessDate?.businessDate || 'no-open-date'}.csv`
    anchor.click()
    URL.revokeObjectURL(url)
  }

  const noOpenBusinessDate = !isPageLoading && !businessDate

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <main className="space-y-5 p-4 sm:p-5 lg:p-6">
        <section className="flex flex-col gap-4 border-b border-slate-200 pb-5 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <span className="h-3 w-3 rotate-45 bg-amber-400" />
              <h1 className="font-serif text-3xl font-black tracking-tight text-slate-950">Reception / Gate</h1>
            </div>
            <p className="mt-2 text-sm text-slate-500">
              Look up registered customers, open Reception visits and record exits.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" disabled title="Badge Allocation Board is deferred" className="h-11 cursor-not-allowed rounded-xl border border-slate-200 bg-slate-100 px-5 text-sm font-black text-slate-400">
              Badge Allocation Board
            </button>
            <button type="button" disabled title="Customer registration will be integrated in a later phase" className="h-11 cursor-not-allowed rounded-xl border border-slate-200 bg-slate-100 px-5 text-sm font-black text-slate-400">
              ＋ New Customer
            </button>
            <button type="button" onClick={openCustomerModal} className="h-11 rounded-xl bg-amber-400 px-5 text-sm font-black text-slate-950 shadow-sm transition hover:bg-amber-300">
              ↪ Existing Customer Entry
            </button>
          </div>
        </section>

        {noOpenBusinessDate && (
          <div className="rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm font-bold text-amber-800">
            No business date is currently open. Check-in and check-out actions are disabled.
          </div>
        )}
        {pageError && (
          <div className="flex items-center justify-between gap-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
            <span>{pageError}</span>
            <button type="button" onClick={loadPageData} className="rounded-lg border border-red-200 bg-white px-3 py-1.5 font-bold">Retry</button>
          </div>
        )}

        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <SummaryCard label="Business Date" value={businessDate?.businessDate || 'Not open'} description="Backend current-open date" icon="BD" tone="blue" />
          <SummaryCard label="Sessions" value={summary.total} description="Sessions for displayed business date" icon="↪" tone="blue" />
          <SummaryCard label="Currently Inside" value={summary.open} description="OPEN customer sessions" icon="👥" tone="green" />
          <SummaryCard label="Completed Visits" value={summary.closed} description="CLOSED customer sessions" icon="✓" tone="amber" />
        </section>

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-5 py-4">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
              <div>
                <h2 className="text-sm font-black uppercase tracking-[0.17em] text-slate-700">Customer Sessions</h2>
                <p className="mt-1 text-xs text-slate-500">Session identifiers, dates and timestamps are supplied by the backend.</p>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                <input type="search" value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} placeholder="Search session, customer code, name or phone..." className="h-10 min-w-0 rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm outline-none focus:border-amber-400 sm:min-w-[300px]" />
                <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="h-10 rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm font-semibold text-slate-700 outline-none focus:border-amber-400">
                  <option value="ALL">All Sessions</option>
                  <option value="OPEN">Currently Inside</option>
                  <option value="CLOSED">Completed</option>
                </select>
                <button type="button" onClick={exportSessions} className="h-10 rounded-lg border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 hover:border-emerald-300 hover:bg-emerald-50">Excel / CSV</button>
                <button type="button" onClick={() => window.print()} className="h-10 rounded-lg border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 hover:border-amber-300 hover:bg-amber-50">Print</button>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[1100px] border-collapse">
              <thead className="bg-slate-50">
                <tr className="border-b border-slate-200 text-left">
                  {['Session', 'Customer Code', 'Customer', 'Nationality', 'Contact', 'Business Date', 'Entry', 'Exit', 'Status', 'Action'].map((heading) => (
                    <th key={heading} className="px-4 py-3 text-[10px] font-black uppercase tracking-[0.16em] text-slate-500">{heading}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {displaySessions.map((session) => {
                  const customer = customerById.get(session.customerId)
                  return (
                    <tr key={session.id} className="border-b border-slate-100 transition hover:bg-slate-50">
                      <td className="px-4 py-4"><button type="button" onClick={() => setSelectedSession(session)} className="font-mono text-xs font-black text-sky-700 hover:underline">{session.sessionCode}</button></td>
                      <td className="px-4 py-4 text-sm font-bold text-slate-700">{customer?.customerCode || 'Unknown'}</td>
                      <td className="px-4 py-4"><div className="flex items-center gap-3"><span className="flex h-9 w-9 items-center justify-center rounded-full bg-amber-100 text-xs font-black text-amber-700">{getInitials(customer?.fullName)}</span><p className="text-sm font-black text-slate-900">{customer?.fullName || 'Unknown customer'}</p></div></td>
                      <td className="px-4 py-4 text-sm text-slate-700">{customer?.nationality || '—'}</td>
                      <td className="px-4 py-4 text-sm text-slate-700">{customer?.phone || '—'}</td>
                      <td className="px-4 py-4 text-sm font-semibold text-slate-700">{session.businessDate}</td>
                      <td className="px-4 py-4 text-sm font-semibold text-slate-700">{formatDateTime(session.entryTime)}</td>
                      <td className="px-4 py-4 text-sm font-semibold text-slate-700">{formatDateTime(session.exitTime)}</td>
                      <td className="px-4 py-4"><SessionStatusBadge status={session.status} /></td>
                      <td className="px-4 py-4"><div className="flex gap-2"><button type="button" onClick={() => setSelectedSession(session)} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-black text-slate-700">View</button>{session.status === 'OPEN' && <button type="button" disabled={!businessDate || isMutating} onClick={() => { setModalError(''); setSessionToClose(session) }} className="rounded-lg bg-slate-900 px-3 py-2 text-xs font-black text-white disabled:cursor-not-allowed disabled:bg-slate-300">Close Session</button>}</div></td>
                    </tr>
                  )
                })}
                {!isPageLoading && displaySessions.length === 0 && <tr><td colSpan={10} className="px-5 py-16 text-center text-sm text-slate-500">No customer sessions match the current search or filter.</td></tr>}
                {isPageLoading && <tr><td colSpan={10} className="px-5 py-16 text-center text-sm text-slate-500">Loading Reception data...</td></tr>}
              </tbody>
            </table>
          </div>
          <div className="flex flex-col gap-2 border-t border-slate-200 bg-slate-50 px-5 py-3 text-xs text-slate-500 sm:flex-row sm:justify-between">
            <span>Showing {displaySessions.length} of {sessions.length} sessions</span>
            <span>Business Date: <strong>{businessDate?.businessDate || 'No open business date'}</strong></span>
          </div>
        </section>
      </main>

      {showCustomerModal && (
        <ModalOverlay onClose={() => !isMutating && setShowCustomerModal(false)}>
          <div className="w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-2xl">
            <ModalHeader title="Existing Customer Entry" description="Search by customer code, name or phone, then check the current session state." onClose={() => !isMutating && setShowCustomerModal(false)} />
            <div className="max-h-[72vh] space-y-4 overflow-y-auto p-5">
              <div className="flex flex-col gap-2 sm:flex-row">
                <input type="search" value={customerQuery} onChange={(event) => setCustomerQuery(event.target.value)} onKeyDown={(event) => event.key === 'Enter' && !isSearching && searchCustomers()} placeholder="Enter customer code, name or phone" className="h-11 min-w-0 flex-1 rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-amber-400" />
                <button type="button" disabled={isSearching} onClick={searchCustomers} className="h-11 rounded-lg border border-amber-300 bg-amber-50 px-5 text-sm font-black text-amber-700 disabled:opacity-60">{isSearching ? 'Searching...' : 'Search Customer'}</button>
              </div>
              {modalError && <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{modalError}</div>}
              {customerResults.length > 0 && !selectedCustomer && (
                <div className="space-y-2">
                  {customerResults.map((customer) => (
                    <button key={customer.id} type="button" onClick={() => selectCustomer(customer)} className="flex w-full items-center gap-4 rounded-xl border border-slate-200 bg-slate-50 p-4 text-left hover:border-amber-300 hover:bg-amber-50">
                      <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-100 text-sm font-black text-amber-700">{getInitials(customer.fullName)}</span>
                      <span className="min-w-0 flex-1"><span className="block text-sm font-black text-slate-950">{customer.fullName}</span><span className="mt-1 block text-xs text-slate-500">{customer.customerCode} · {customer.phone}</span></span>
                      <SessionStatusBadge status={customer.status} />
                    </button>
                  ))}
                </div>
              )}
              {selectedCustomer && (
                <div className="space-y-4">
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <div className="flex items-start gap-4"><span className="flex h-14 w-14 items-center justify-center rounded-xl bg-amber-100 text-lg font-black text-amber-700">{getInitials(selectedCustomer.fullName)}</span><div className="min-w-0 flex-1"><h3 className="text-xl font-black text-slate-950">{selectedCustomer.fullName}</h3><p className="mt-1 text-sm text-slate-500">{selectedCustomer.customerCode} · {selectedCustomer.nationality}</p></div><SessionStatusBadge status={selectedCustomer.status} /></div>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2"><DetailCard label="Phone" value={selectedCustomer.phone || 'Not available'} /><DetailCard label="Customer UUID" value={selectedCustomer.id} /></div>
                  {isCheckingSession && <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-600">Checking active session...</div>}
                  {!isCheckingSession && activeSession && <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3"><p className="text-sm font-black text-amber-800">Customer is currently checked in.</p><p className="mt-1 text-xs text-amber-700">{activeSession.sessionCode} · Business Date {activeSession.businessDate} · Entry {formatDateTime(activeSession.entryTime)}</p></div>}
                  {!isCheckingSession && !activeSession && <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-black text-emerald-700">Customer is not currently checked in.</div>}
                </div>
              )}
            </div>
            <div className="flex justify-end gap-2 border-t border-slate-200 bg-slate-50 p-4">
              <button type="button" disabled={isMutating} onClick={() => setShowCustomerModal(false)} className="rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 disabled:opacity-60">Cancel</button>
              <button type="button" disabled={!selectedCustomer || Boolean(activeSession) || isCheckingSession || isMutating || !businessDate} onClick={openSession} className="rounded-lg bg-amber-400 px-4 py-2.5 text-sm font-black text-slate-950 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400">{isMutating ? 'Opening...' : 'Open Visit'}</button>
            </div>
          </div>
        </ModalOverlay>
      )}

      {selectedSession && (
        <ModalOverlay onClose={() => setSelectedSession(null)}>
          <div className="w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-2xl">
            <ModalHeader title="Customer Session Details" description="Backend-authoritative Reception visit information." onClose={() => setSelectedSession(null)} />
            <div className="grid gap-3 p-5 sm:grid-cols-2">
              <DetailCard label="Session Code" value={selectedSession.sessionCode} />
              <DetailCard label="Status" value={selectedSession.status} />
              <DetailCard label="Business Date" value={selectedSession.businessDate} />
              <DetailCard label="Customer" value={customerById.get(selectedSession.customerId)?.fullName || selectedSession.customerId} />
              <DetailCard label="Entry Time" value={formatDateTime(selectedSession.entryTime)} />
              <DetailCard label="Exit Time" value={formatDateTime(selectedSession.exitTime)} />
            </div>
            <div className="flex justify-end gap-2 border-t border-slate-200 bg-slate-50 p-4"><button type="button" onClick={() => setSelectedSession(null)} className="rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700">Close</button>{selectedSession.status === 'OPEN' && <button type="button" disabled={!businessDate || isMutating} onClick={() => { setSelectedSession(null); setModalError(''); setSessionToClose(selectedSession) }} className="rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-black text-white disabled:bg-slate-300">Complete Exit</button>}</div>
          </div>
        </ModalOverlay>
      )}

      {sessionToClose && (
        <ModalOverlay onClose={() => !isMutating && setSessionToClose(null)}>
          <div className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl">
            <ModalHeader title="Complete Customer Exit" description="The backend will record the exit timestamp and operator." onClose={() => !isMutating && setSessionToClose(null)} />
            <div className="space-y-4 p-5"><DetailCard label="Session" value={sessionToClose.sessionCode} /><DetailCard label="Customer" value={customerById.get(sessionToClose.customerId)?.fullName || sessionToClose.customerId} /><DetailCard label="Entered" value={formatDateTime(sessionToClose.entryTime)} />{modalError && <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{modalError}</div>}</div>
            <div className="flex justify-end gap-2 border-t border-slate-200 bg-slate-50 p-4"><button type="button" disabled={isMutating} onClick={() => setSessionToClose(null)} className="rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 disabled:opacity-60">Cancel</button><button type="button" disabled={isMutating || !businessDate} onClick={closeSession} className="rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-black text-white disabled:bg-slate-300">{isMutating ? 'Closing...' : 'Confirm Exit'}</button></div>
          </div>
        </ModalOverlay>
      )}

      {toast && <div className={`fixed bottom-5 right-5 z-[200] max-w-sm rounded-xl border px-4 py-3 text-sm font-bold shadow-xl ${toast.type === 'success' ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-red-200 bg-red-50 text-red-700'}`}>{toast.message}</div>}
    </div>
  )
}

const SummaryCard = ({ label, value, description, icon, tone }) => {
  const tones = { blue: 'border-sky-200 from-white to-sky-50', green: 'border-emerald-200 from-white to-emerald-50', amber: 'border-amber-200 from-white to-amber-50' }
  return <div className={`min-h-[130px] rounded-2xl border bg-gradient-to-br p-4 shadow-sm ${tones[tone] || tones.blue}`}><div className="flex items-start justify-between gap-4"><div><p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">{label}</p><p className="mt-4 font-serif text-3xl font-black text-slate-950">{value}</p></div><span className="flex h-10 min-w-10 items-center justify-center rounded-xl bg-white px-2 text-sm font-black shadow-sm">{icon}</span></div><p className="mt-3 text-xs text-slate-500">{description}</p></div>
}

const SessionStatusBadge = ({ status }) => {
  const active = status === 'OPEN' || status === 'ACTIVE'
  const blocked = status === 'BLOCKED' || status === 'INACTIVE'
  const classes = active ? 'border-sky-200 bg-sky-50 text-sky-700' : blocked ? 'border-red-200 bg-red-50 text-red-700' : 'border-emerald-200 bg-emerald-50 text-emerald-700'
  return <span className={`inline-flex rounded-full border px-2.5 py-1 text-[10px] font-black ${classes}`}>{status || 'UNKNOWN'}</span>
}

const ModalHeader = ({ title, description, onClose }) => <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-5 py-4"><div><div className="flex items-center gap-3"><span className="h-2.5 w-2.5 rotate-45 bg-amber-400" /><h2 className="font-serif text-2xl font-black text-slate-950">{title}</h2></div><p className="mt-2 text-sm text-slate-500">{description}</p></div><button type="button" onClick={onClose} className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-lg text-slate-500 hover:bg-slate-100">×</button></div>
const ModalOverlay = ({ children, onClose }) => <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>{children}</div>
const DetailCard = ({ label, value }) => <div className="rounded-xl border border-slate-200 bg-slate-50 p-4"><p className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-500">{label}</p><p className="mt-2 break-words text-sm font-black text-slate-900">{value || 'Not available'}</p></div>
const getInitials = (name = '') => name.trim().split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part.charAt(0).toUpperCase()).join('') || '—'
const formatDateTime = (value) => value ? value.replace('T', ' ').slice(0, 19) : '—'

export default ReceptionDashboard
