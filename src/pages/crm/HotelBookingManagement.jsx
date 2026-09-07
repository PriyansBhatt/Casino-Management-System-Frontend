import { useEffect, useMemo, useRef, useState } from 'react'
import hotelBookingApi from '../../api/hotelBookingApi'
import receptionApi from '../../api/receptionApi'

const inputClass = 'h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-200'
const money = (value) => value == null ? 'Unavailable' : `NPR ${Number(value).toLocaleString('en-IN')}`
const makeKey = () => globalThis.crypto?.randomUUID?.() || `hotel-${Date.now()}-${Math.random().toString(36).slice(2)}`
const initialForm = { hotelName: '', roomType: '', checkInDate: '', checkOutDate: '', numberOfGuests: '1', estimatedCost: '', billingType: 'CASINO_COMPLIMENTARY', remarks: '' }

const HotelBookingManagement = ({ onBookingsChange }) => {
  const [businessDate, setBusinessDate] = useState('')
  const [customers, setCustomers] = useState([])
  const [bookings, setBookings] = useState([])
  const [selected, setSelected] = useState(null)
  const [selectedCustomer, setSelectedCustomer] = useState(null)
  const [activeSession, setActiveSession] = useState(null)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('ALL')
  const [form, setForm] = useState(initialForm)
  const [actualCost, setActualCost] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const submission = useRef({ signature: '', key: '' })

  const load = async () => {
    setLoading(true)
    setError('')
    try {
      const current = await receptionApi.getCurrentOpenBusinessDate()
      if (!current?.businessDate) throw new Error('Current business date is not opened.')
      const [customerRecords, bookingRecords] = await Promise.all([
        receptionApi.getCustomers({ skipUnauthorizedRedirect: true }),
        hotelBookingApi.getCurrent(),
      ])
      setBusinessDate(current.businessDate)
      setCustomers(Array.isArray(customerRecords) ? customerRecords : [])
      setBookings(Array.isArray(bookingRecords) ? bookingRecords : [])
    } catch (loadError) {
      setBookings([])
      setError(loadError.response?.data?.message || loadError.message || 'Unable to load hotel bookings.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])
  useEffect(() => { onBookingsChange?.(bookings) }, [bookings, onBookingsChange])

  const matches = useMemo(() => {
    const query = search.trim().toLowerCase()
    if (!query || selectedCustomer) return []
    return customers.filter((customer) => [customer.customerCode, customer.fullName, customer.phone]
      .some((value) => String(value || '').toLowerCase().includes(query))).slice(0, 8)
  }, [customers, search, selectedCustomer])

  const visible = useMemo(() => filter === 'ALL' ? bookings : bookings.filter((booking) => booking.status === filter), [bookings, filter])
  const summary = useMemo(() => ({
    total: bookings.length,
    requested: bookings.filter((item) => item.status === 'REQUESTED').length,
    active: bookings.filter((item) => ['APPROVED', 'BOOKED', 'CHECKED_IN'].includes(item.status)).length,
    completed: bookings.filter((item) => item.status === 'COMPLETED').length,
    estimated: bookings.reduce((sum, item) => sum + Number(item.estimatedCost || 0), 0),
  }), [bookings])

  const chooseCustomer = async (customer) => {
    setError('')
    setMessage('')
    if (String(customer.status).toUpperCase() !== 'ACTIVE') {
      setError('Customer must be ACTIVE.')
      return
    }
    try {
      const session = await receptionApi.getActiveSession(customer.id, { skipUnauthorizedRedirect: true })
      setSelectedCustomer(customer)
      setActiveSession(session?.businessDate === businessDate ? session : null)
      setSearch(`${customer.customerCode} · ${customer.fullName}`)
      setMessage(session?.businessDate === businessDate
        ? `Active session ${session.sessionCode || session.id} linked.`
        : 'Customer selected. No current OPEN session will be linked.')
    } catch (sessionError) {
      setSelectedCustomer(customer)
      setActiveSession(null)
      setSearch(`${customer.customerCode} · ${customer.fullName}`)
      setMessage('Customer selected. No current OPEN session will be linked.')
    }
  }

  const updateRecord = (record) => {
    setBookings((current) => [record, ...current.filter((item) => item.id !== record.id)])
    setSelected(record)
  }

  const createBooking = async (event) => {
    event.preventDefault()
    setError('')
    setMessage('')
    if (!selectedCustomer) return setError('Select an active customer.')
    if (!form.hotelName.trim() || !form.roomType.trim() || !form.checkInDate || !form.checkOutDate) return setError('Hotel, room type, check-in and check-out are required.')
    if (form.checkOutDate < form.checkInDate) return setError('Check-out cannot be before check-in.')
    if (!Number.isInteger(Number(form.numberOfGuests)) || Number(form.numberOfGuests) < 1) return setError('Guests must be a positive whole number.')
    if (form.estimatedCost === '' || Number(form.estimatedCost) < 0) return setError('Estimated cost must be zero or greater.')
    const signature = JSON.stringify({ customerId: selectedCustomer.id, sessionId: activeSession?.id, ...form })
    if (submission.current.signature !== signature) submission.current = { signature, key: makeKey() }
    setSubmitting(true)
    try {
      const record = await hotelBookingApi.create({
        customerId: selectedCustomer.id,
        customerSessionId: activeSession?.id || null,
        hotelName: form.hotelName.trim(), roomType: form.roomType.trim(),
        checkInDate: form.checkInDate, checkOutDate: form.checkOutDate,
        numberOfGuests: Number(form.numberOfGuests), estimatedCost: Number(form.estimatedCost),
        billingType: form.billingType, remarks: form.remarks.trim() || null,
        idempotencyKey: submission.current.key,
      })
      updateRecord(record)
      setForm(initialForm)
      setSelectedCustomer(null)
      setActiveSession(null)
      setSearch('')
      submission.current = { signature: '', key: '' }
      setMessage(`${record.bookingCode} created as REQUESTED.`)
    } catch (createError) {
      setError(createError.response?.data?.message || createError.message || 'Unable to create hotel booking.')
    } finally { setSubmitting(false) }
  }

  const action = async (operation, successMessage) => {
    if (!selected || submitting) return
    setSubmitting(true); setError(''); setMessage('')
    try {
      const record = await operation()
      updateRecord(record)
      setMessage(successMessage)
      setActualCost('')
    } catch (actionError) {
      setError(actionError.response?.data?.message || actionError.message || 'Unable to update hotel booking.')
    } finally { setSubmitting(false) }
  }

  const nextAction = selected?.status === 'APPROVED' ? ['Mark Booked', 'BOOKED']
    : selected?.status === 'BOOKED' ? ['Mark Checked In', 'CHECKED_IN']
      : selected?.status === 'CHECKED_IN' ? ['Complete Stay', 'COMPLETED'] : null

  if (loading) return <div className="rounded-2xl border border-slate-200 bg-white p-8 text-sm text-slate-500">Loading authoritative hotel bookings…</div>

  return (
    <section className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div><h2 className="font-serif text-2xl font-black">Hotel Booking Management</h2><p className="mt-1 text-sm text-slate-500">Persisted guest stays for Business Date {businessDate || 'Unavailable'}.</p></div>
        <button type="button" onClick={load} className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-bold">Refresh</button>
      </div>
      {error && <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm font-bold text-rose-700">{error}</div>}
      {message && <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm font-bold text-emerald-700">{message}</div>}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {[['Total', summary.total], ['Requested', summary.requested], ['Active Stays', summary.active], ['Completed', summary.completed], ['Estimated Cost', money(summary.estimated)]].map(([label, value]) => <div key={label} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"><p className="text-xs font-black uppercase tracking-wider text-slate-500">{label}</p><p className="mt-2 text-2xl font-black">{value}</p></div>)}
      </div>
      <div className="grid gap-5 xl:grid-cols-[380px_minmax(0,1fr)_330px]">
        <form onSubmit={createBooking} className="space-y-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="font-black">New Booking Request</h3>
          <label className="block text-xs font-bold text-slate-600">Customer search<input className={`${inputClass} mt-1`} value={search} onChange={(e) => { setSearch(e.target.value); setSelectedCustomer(null); setActiveSession(null) }} placeholder="Code, name or phone" /></label>
          {matches.length > 0 && <div className="max-h-40 overflow-auto rounded-xl border border-slate-200">{matches.map((customer) => <button key={customer.id} type="button" onClick={() => chooseCustomer(customer)} className="block w-full border-b border-slate-100 px-3 py-2 text-left text-sm hover:bg-amber-50"><b>{customer.customerCode}</b> · {customer.fullName}</button>)}</div>}
          {selectedCustomer && <div className="rounded-xl bg-slate-50 p-3 text-sm"><b>{selectedCustomer.fullName}</b><br />{selectedCustomer.customerCode} · Session: {activeSession?.sessionCode || 'Not linked'}</div>}
          <input className={inputClass} value={form.hotelName} onChange={(e) => setForm({ ...form, hotelName: e.target.value })} placeholder="Hotel name" />
          <input className={inputClass} value={form.roomType} onChange={(e) => setForm({ ...form, roomType: e.target.value })} placeholder="Room type" />
          <div className="grid grid-cols-2 gap-2"><label className="text-xs font-bold">Check-in<input type="date" className={`${inputClass} mt-1`} value={form.checkInDate} onChange={(e) => setForm({ ...form, checkInDate: e.target.value })} /></label><label className="text-xs font-bold">Check-out<input type="date" className={`${inputClass} mt-1`} value={form.checkOutDate} onChange={(e) => setForm({ ...form, checkOutDate: e.target.value })} /></label></div>
          <div className="grid grid-cols-2 gap-2"><input type="number" min="1" step="1" className={inputClass} value={form.numberOfGuests} onChange={(e) => setForm({ ...form, numberOfGuests: e.target.value })} placeholder="Guests" /><input type="number" min="0" step="0.01" className={inputClass} value={form.estimatedCost} onChange={(e) => setForm({ ...form, estimatedCost: e.target.value })} placeholder="Estimated cost" /></div>
          <select className={inputClass} value={form.billingType} onChange={(e) => setForm({ ...form, billingType: e.target.value })}><option value="CASINO_COMPLIMENTARY">Casino Complimentary</option><option value="CUSTOMER_DIRECT">Customer Direct</option></select>
          <textarea className="min-h-20 w-full rounded-xl border border-slate-200 p-3 text-sm" value={form.remarks} onChange={(e) => setForm({ ...form, remarks: e.target.value })} placeholder="Remarks (optional)" />
          <button disabled={submitting} className="w-full rounded-xl bg-amber-400 px-4 py-3 text-sm font-black disabled:opacity-50">{submitting ? 'Submitting…' : 'Create Booking Request'}</button>
        </form>

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex gap-2 border-b p-4"><select className={inputClass} value={filter} onChange={(e) => setFilter(e.target.value)}><option value="ALL">All statuses</option>{['REQUESTED','APPROVED','BOOKED','CHECKED_IN','COMPLETED','CANCELLED','REJECTED'].map((status) => <option key={status}>{status}</option>)}</select></div>
          <div className="overflow-x-auto"><table className="w-full min-w-[780px] text-left text-sm"><thead className="bg-slate-50 text-xs uppercase text-slate-500"><tr>{['Booking','Customer','Hotel / Room','Stay','Cost','Status'].map((h) => <th key={h} className="px-3 py-3">{h}</th>)}</tr></thead><tbody className="divide-y">{visible.map((booking) => <tr key={booking.id} onClick={() => setSelected(booking)} className="cursor-pointer hover:bg-amber-50"><td className="px-3 py-3 font-mono font-bold text-sky-700">{booking.bookingCode}</td><td className="px-3 py-3"><b>{booking.customerName || 'Unavailable'}</b><br />{booking.customerCode || 'Unavailable'}</td><td className="px-3 py-3">{booking.hotelName}<br /><span className="text-slate-500">{booking.roomType}</span></td><td className="px-3 py-3">{booking.checkInDate}<br />to {booking.checkOutDate}</td><td className="px-3 py-3 font-bold">{money(booking.estimatedCost)}</td><td className="px-3 py-3 font-black">{booking.status}</td></tr>)}{visible.length === 0 && <tr><td colSpan="6" className="p-8 text-center text-slate-500">No persisted bookings for this Business Date.</td></tr>}</tbody></table></div>
        </div>

        <aside className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          {!selected ? <p className="text-sm text-slate-500">Select a persisted booking to review and manage its lifecycle.</p> : <div className="space-y-3"><h3 className="font-mono font-black text-sky-700">{selected.bookingCode}</h3><p className="text-xl font-black">{selected.customerName || 'Unavailable'}</p>{[['Status',selected.status],['Business Date',selected.businessDate],['Session',selected.sessionCode || 'Not linked'],['Hotel',selected.hotelName],['Room',selected.roomType],['Guests',selected.numberOfGuests],['Billing',selected.billingType],['Estimated',money(selected.estimatedCost)],['Actual',money(selected.actualCost)],['Created by',selected.createdBy?.username || 'Unavailable'],['Approved by',selected.approvedBy?.username || 'Not approved']].map(([label,value]) => <div key={label} className="flex justify-between gap-3 border-b border-slate-100 py-1 text-sm"><span className="text-slate-500">{label}</span><b className="text-right">{value}</b></div>)}
            {selected.status === 'REQUESTED' && <div className="grid grid-cols-2 gap-2"><button disabled={submitting} onClick={() => action(() => hotelBookingApi.approve(selected.id), 'Booking approved.')} className="rounded-xl bg-emerald-600 px-3 py-2 text-sm font-bold text-white">Approve</button><button disabled={submitting} onClick={() => action(() => hotelBookingApi.reject(selected.id), 'Booking rejected.')} className="rounded-xl bg-rose-600 px-3 py-2 text-sm font-bold text-white">Reject</button></div>}
            {selected.status === 'CHECKED_IN' && <input type="number" min="0" step="0.01" className={inputClass} value={actualCost} onChange={(e) => setActualCost(e.target.value)} placeholder="Actual cost required" />}
            {nextAction && <button disabled={submitting || (nextAction[1] === 'COMPLETED' && actualCost === '')} onClick={() => action(() => hotelBookingApi.updateStatus(selected.id, { status: nextAction[1], actualCost: nextAction[1] === 'COMPLETED' ? Number(actualCost) : null }), `Booking updated to ${nextAction[1]}.`)} className="w-full rounded-xl bg-amber-400 px-3 py-2 text-sm font-black disabled:opacity-50">{nextAction[0]}</button>}
            {!['COMPLETED','REJECTED','CANCELLED'].includes(selected.status) && <button disabled={submitting} onClick={() => action(() => hotelBookingApi.updateStatus(selected.id, { status: 'CANCELLED', actualCost: null }), 'Booking cancelled.')} className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm font-bold">Cancel Booking</button>}
          </div>}
        </aside>
      </div>
    </section>
  )
}

export default HotelBookingManagement
