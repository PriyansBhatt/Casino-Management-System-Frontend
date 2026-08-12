import { useMemo, useState } from 'react'

const money = (value) => `NPR ${Number(value || 0).toLocaleString('en-IN')}`

const initialRequests = [
  { id: 'REQ-2026-07-21-028', department: 'F&B / Kitchen / Bar', item: 'Food & Beverage Supplies', quantity: 12, requestedBy: 'Ramesh K.', type: 'Urgent', requiredDate: '2026-07-21', storeStatus: 'Pending Review', approval: 'Pending', remarks: 'Required for tonight operations.' },
  { id: 'REQ-2026-07-21-027', department: 'Housekeeping', item: 'Cleaning Material', quantity: 6, requestedBy: 'Sita M.', type: 'Normal', requiredDate: '2026-07-22', storeStatus: 'Pending Review', approval: 'Pending', remarks: '' },
  { id: 'REQ-2026-07-21-026', department: 'Gaming Floor / Pit', item: 'Table Supplies', quantity: 6, requestedBy: 'Deepak L.', type: 'Next-Day', requiredDate: '2026-07-22', storeStatus: 'Procurement Needed', approval: 'Pending', remarks: '' },
  { id: 'REQ-2026-07-21-025', department: 'Reception / Gate', item: 'Guest Supplies', quantity: 4, requestedBy: 'Anita P.', type: 'Normal', requiredDate: '2026-07-22', storeStatus: 'Approved', approval: 'Approved', remarks: '' },
]

const initialGoodsReceipts = [
  { grn: 'GRN-260721-015', requestId: 'REQ-2026-07-21-025', vendor: 'Fresh & Green Suppliers', department: 'F&B / Kitchen / Bar', invoice: 'INV-22015', receivedQuantity: 12, deliveryStatus: 'Received', verifiedBy: 'Ramesh K.', billStatus: 'Bill Received', deliveryDate: '2026-07-21' },
  { grn: 'GRN-260721-014', requestId: 'REQ-2026-07-21-022', vendor: 'Shree Clean Solutions', department: 'Housekeeping', invoice: 'INV-22014', receivedQuantity: 6, deliveryStatus: 'Received', verifiedBy: 'Sita M.', billStatus: 'Bill Pending', deliveryDate: '2026-07-21' },
]

const initialBills = [
  { billNo: 'BILL-260721-007', vendor: 'Fresh & Green Suppliers', amount: 24850, forwardedDate: '21 Jul 2026', accountsStatus: 'Under Verification', paymentMethod: 'Bank Transfer' },
  { billNo: 'BILL-260721-006', vendor: 'Ace Cards Pvt. Ltd.', amount: 18600, forwardedDate: '21 Jul 2026', accountsStatus: 'Verified', paymentMethod: 'NEFT' },
]

const lowStockItems = [
  { item: 'Playing Cards (Standard)', department: 'Gaming Floor / Pit', stock: 6, reorder: 20, level: 'Critical' },
  { item: 'House Cleaning Liquid', department: 'Housekeeping', stock: 2, reorder: 10, level: 'Low' },
  { item: 'Whisky 750ml', department: 'F&B / Kitchen / Bar', stock: 4, reorder: 15, level: 'Low' },
  { item: 'Frozen Chicken', department: 'F&B / Kitchen / Bar', stock: 5, reorder: 20, level: 'Critical' },
]

const emptyRequestForm = { department: 'F&B / Kitchen / Bar', type: 'Normal', item: '', quantity: 1, requiredDate: '2026-07-22', requestedBy: 'Current User', remarks: '' }
const emptyReceiptForm = { requestId: '', vendor: '', invoice: '', deliveryDate: '2026-07-21', receivedQuantity: '', verifiedBy: 'Current Store User', deliveryStatus: 'Full Delivery', billStatus: 'Bill Received' }

const StorePurchaseDashboard = () => {
  const [activeTab, setActiveTab] = useState('Dashboard')
  const [requests, setRequests] = useState(initialRequests)
  const [goodsReceipts, setGoodsReceipts] = useState(initialGoodsReceipts)
  const [bills] = useState(initialBills)
  const [selectedRequest, setSelectedRequest] = useState(initialRequests[0])
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('All')
  const [statusFilter, setStatusFilter] = useState('All')
  const [showRequestModal, setShowRequestModal] = useState(false)
  const [showReceiptModal, setShowReceiptModal] = useState(false)
  const [requestForm, setRequestForm] = useState(emptyRequestForm)
  const [receiptForm, setReceiptForm] = useState(emptyReceiptForm)
  const [errors, setErrors] = useState({})
  const [toast, setToast] = useState(null)

  const tabs = ['Dashboard', 'Department Requests', 'Procurement', 'Goods Receiving', 'Bills & Accounts']

  const filteredRequests = useMemo(() => {
    const query = search.trim().toLowerCase()
    return requests.filter((request) => {
      const matchesSearch = !query || request.id.toLowerCase().includes(query) || request.department.toLowerCase().includes(query) || request.item.toLowerCase().includes(query) || request.requestedBy.toLowerCase().includes(query)
      const matchesType = typeFilter === 'All' || request.type === typeFilter
      const matchesStatus = statusFilter === 'All' || request.storeStatus === statusFilter
      return matchesSearch && matchesType && matchesStatus
    })
  }, [requests, search, typeFilter, statusFilter])

  const summary = useMemo(() => ({
    totalRequests: requests.length,
    urgent: requests.filter((r) => r.type === 'Urgent').length,
    nextDay: requests.filter((r) => r.type === 'Next-Day').length,
    pendingApproval: requests.filter((r) => r.approval === 'Pending').length,
    receivingPending: goodsReceipts.filter((g) => g.deliveryStatus !== 'Received').length,
    billsToAccounts: bills.length,
    cashPurchases: 24560,
  }), [requests, goodsReceipts, bills])

  const showToast = (message) => {
    setToast(message)
    window.setTimeout(() => setToast(null), 3000)
  }

  const createRequest = () => {
    const nextErrors = {}
    if (!requestForm.item.trim()) nextErrors.item = 'Item or requirement is required.'
    if (Number(requestForm.quantity) < 1) nextErrors.quantity = 'Quantity must be at least 1.'
    if (!requestForm.requiredDate) nextErrors.requiredDate = 'Required date is required.'
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length) return

    const record = {
      id: `REQ-2026-07-21-${String(requests.length + 29).padStart(3, '0')}`,
      ...requestForm,
      quantity: Number(requestForm.quantity),
      storeStatus: 'Pending Review',
      approval: requestForm.type === 'Next-Day' ? 'Pending' : 'Not Required',
    }
    setRequests((current) => [record, ...current])
    setSelectedRequest(record)
    setRequestForm(emptyRequestForm)
    setShowRequestModal(false)
    setActiveTab('Department Requests')
    showToast(`${record.id} created successfully.`)
  }

  const createGoodsReceipt = () => {
    const nextErrors = {}
    if (!receiptForm.requestId.trim()) nextErrors.requestId = 'Request or PO ID is required.'
    if (!receiptForm.vendor.trim()) nextErrors.vendor = 'Vendor is required.'
    if (!receiptForm.invoice.trim()) nextErrors.invoice = 'Invoice number is required.'
    if (!receiptForm.receivedQuantity || Number(receiptForm.receivedQuantity) < 1) nextErrors.receivedQuantity = 'Enter a valid received quantity.'
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length) return

    const matched = requests.find((r) => r.id === receiptForm.requestId.trim())
    const record = {
      grn: `GRN-260721-${String(goodsReceipts.length + 16).padStart(3, '0')}`,
      requestId: receiptForm.requestId.trim(),
      vendor: receiptForm.vendor.trim(),
      department: matched?.department || 'General',
      invoice: receiptForm.invoice.trim(),
      receivedQuantity: Number(receiptForm.receivedQuantity),
      deliveryStatus: receiptForm.deliveryStatus === 'Full Delivery' ? 'Received' : 'Partial',
      verifiedBy: receiptForm.verifiedBy,
      billStatus: receiptForm.billStatus,
      deliveryDate: receiptForm.deliveryDate,
    }
    setGoodsReceipts((current) => [record, ...current])
    if (matched) {
      const storeStatus = record.deliveryStatus === 'Received' ? 'Received' : 'Partially Received'
      setRequests((current) => current.map((r) => r.id === matched.id ? { ...r, storeStatus } : r))
      setSelectedRequest((current) => current?.id === matched.id ? { ...current, storeStatus } : current)
    }
    setReceiptForm(emptyReceiptForm)
    setShowReceiptModal(false)
    setActiveTab('Goods Receiving')
    showToast(`${record.grn} saved successfully.`)
  }

  const updateRequest = (id, updates, message) => {
    setRequests((current) => current.map((r) => r.id === id ? { ...r, ...updates } : r))
    setSelectedRequest((current) => current?.id === id ? { ...current, ...updates } : current)
    showToast(message)
  }

  const exportRequests = () => {
    const headers = ['Request ID','Department','Item','Quantity','Requested By','Type','Required Date','Store Status','Approval','Remarks']
    const rows = filteredRequests.map((r) => [r.id,r.department,r.item,r.quantity,r.requestedBy,r.type,r.requiredDate,r.storeStatus,r.approval,r.remarks])
    const csv = [headers, ...rows].map((row) => row.map((v) => `"${String(v ?? '').replaceAll('"','""')}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'store-purchase-requests.csv'
    a.click()
    URL.revokeObjectURL(url)
    showToast('Store/Purchase records exported.')
  }

  return (
    <div className="space-y-5 text-slate-900">
      <section className="flex flex-col gap-4 border-b border-slate-200 pb-5 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <p className="text-[11px] font-black uppercase tracking-[0.22em] text-amber-600">Back Office</p>
          <h1 className="mt-1 font-serif text-3xl font-black tracking-tight text-slate-950">Store / Purchase Dashboard</h1>
          <p className="mt-2 text-sm text-slate-500">Department requests, stock review, procurement, receiving and bill forwarding.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => setShowRequestModal(true)} className={primaryButton}>+ New Department Request</button>
          <button type="button" onClick={() => setActiveTab('Department Requests')} className={secondaryButton}>Review Requests</button>
          <button type="button" onClick={() => setShowReceiptModal(true)} className={secondaryButton}>Goods Receiving</button>
          <button type="button" onClick={exportRequests} className={secondaryButton}>Export</button>
        </div>
      </section>

      <nav className="flex gap-2 overflow-x-auto">
        {tabs.map((tab) => <button key={tab} type="button" onClick={() => setActiveTab(tab)} className={`shrink-0 rounded-xl px-4 py-2.5 text-sm font-black ${activeTab === tab ? 'bg-slate-900 text-white' : 'border border-slate-200 bg-white text-slate-600'}`}>{tab}</button>)}
      </nav>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 2xl:grid-cols-8">
        <SummaryCard label="Total Requests Today" value={summary.totalRequests} icon="📋" />
        <SummaryCard label="Urgent Requests" value={summary.urgent} icon="⚠" />
        <SummaryCard label="Next-Day Requests" value={summary.nextDay} icon="◷" />
        <SummaryCard label="Low Stock Alerts" value={lowStockItems.length} icon="📦" />
        <SummaryCard label="Pending Director Approval" value={summary.pendingApproval} icon="👤" />
        <SummaryCard label="Goods Receiving Pending" value={summary.receivingPending} icon="🚚" />
        <SummaryCard label="Bills to Accounts" value={summary.billsToAccounts} icon="🧾" />
        <SummaryCard label="Cash Purchases Today" value={money(summary.cashPurchases)} icon="Rs" />
      </section>

      {activeTab === 'Dashboard' && <Dashboard requests={filteredRequests} receipts={goodsReceipts} bills={bills} lowStockItems={lowStockItems} setActiveTab={setActiveTab} setSelectedRequest={setSelectedRequest} />}
      {activeTab === 'Department Requests' && <Requests requests={filteredRequests} search={search} setSearch={setSearch} typeFilter={typeFilter} setTypeFilter={setTypeFilter} statusFilter={statusFilter} setStatusFilter={setStatusFilter} selectedRequest={selectedRequest} setSelectedRequest={setSelectedRequest} updateRequest={updateRequest} />}
      {activeTab === 'Procurement' && <Procurement requests={requests} updateRequest={updateRequest} />}
      {activeTab === 'Goods Receiving' && <GoodsReceiving receipts={goodsReceipts} onNew={() => setShowReceiptModal(true)} />}
      {activeTab === 'Bills & Accounts' && <Bills bills={bills} />}

      {showRequestModal && <Modal onClose={() => setShowRequestModal(false)} title="New Department Request" description="Record a normal, urgent or next-day requirement.">
        <div className="grid gap-4 p-5 sm:grid-cols-2">
          <SelectField label="Department" value={requestForm.department} options={['F&B / Kitchen / Bar','Housekeeping','Gaming Floor / Pit','Reception / Gate','Maintenance','Security','IT Department','HR']} onChange={(value) => setRequestForm((c) => ({ ...c, department: value }))} />
          <SelectField label="Request Type" value={requestForm.type} options={['Normal','Urgent','Next-Day']} onChange={(value) => setRequestForm((c) => ({ ...c, type: value }))} />
          <div className="sm:col-span-2"><InputField label="Item / Requirement" value={requestForm.item} error={errors.item} placeholder="Enter required item or service" onChange={(value) => setRequestForm((c) => ({ ...c, item: value }))} /></div>
          <InputField label="Quantity" type="number" value={requestForm.quantity} error={errors.quantity} onChange={(value) => setRequestForm((c) => ({ ...c, quantity: value }))} />
          <InputField label="Required Date" type="date" value={requestForm.requiredDate} error={errors.requiredDate} onChange={(value) => setRequestForm((c) => ({ ...c, requiredDate: value }))} />
          <InputField label="Requested By" value={requestForm.requestedBy} onChange={(value) => setRequestForm((c) => ({ ...c, requestedBy: value }))} />
          <div className="sm:col-span-2"><TextAreaField label="Remarks" value={requestForm.remarks} placeholder="Add reason, urgency details or specifications" onChange={(value) => setRequestForm((c) => ({ ...c, remarks: value }))} /></div>
        </div>
        <ModalFooter onCancel={() => setShowRequestModal(false)} onConfirm={createRequest} confirmText="Submit Request" />
      </Modal>}

      {showReceiptModal && <Modal onClose={() => setShowReceiptModal(false)} title="Record Goods Receiving" description="Support complete and partial deliveries with bill verification.">
        <div className="grid gap-4 p-5 sm:grid-cols-2">
          <InputField label="Purchase Order / Request ID" value={receiptForm.requestId} error={errors.requestId} placeholder="REQ-2026-..." onChange={(value) => setReceiptForm((c) => ({ ...c, requestId: value }))} />
          <InputField label="Vendor" value={receiptForm.vendor} error={errors.vendor} placeholder="Enter vendor name" onChange={(value) => setReceiptForm((c) => ({ ...c, vendor: value }))} />
          <InputField label="Invoice / Bill Number" value={receiptForm.invoice} error={errors.invoice} placeholder="Enter invoice number" onChange={(value) => setReceiptForm((c) => ({ ...c, invoice: value }))} />
          <InputField label="Delivery Date" type="date" value={receiptForm.deliveryDate} onChange={(value) => setReceiptForm((c) => ({ ...c, deliveryDate: value }))} />
          <InputField label="Received Quantity" type="number" value={receiptForm.receivedQuantity} error={errors.receivedQuantity} onChange={(value) => setReceiptForm((c) => ({ ...c, receivedQuantity: value }))} />
          <InputField label="Verified By" value={receiptForm.verifiedBy} onChange={(value) => setReceiptForm((c) => ({ ...c, verifiedBy: value }))} />
          <SelectField label="Delivery Status" value={receiptForm.deliveryStatus} options={['Full Delivery','Partial Delivery']} onChange={(value) => setReceiptForm((c) => ({ ...c, deliveryStatus: value }))} />
          <SelectField label="Bill Status" value={receiptForm.billStatus} options={['Bill Received','Bill Pending']} onChange={(value) => setReceiptForm((c) => ({ ...c, billStatus: value }))} />
        </div>
        <ModalFooter onCancel={() => setShowReceiptModal(false)} onConfirm={createGoodsReceipt} confirmText="Save Goods Receipt" />
      </Modal>}

      {toast && <div className="fixed bottom-5 right-5 z-[200] rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-700 shadow-xl">{toast}</div>}
    </div>
  )
}

const Dashboard = ({ requests, receipts, bills, lowStockItems, setActiveTab, setSelectedRequest }) => (
  <section className="grid gap-5 xl:grid-cols-[minmax(0,2fr)_420px]">
    <div className="space-y-5">
      <Panel title="Department Requests Queue" action="View all requests" onAction={() => setActiveTab('Department Requests')}>
        <RequestTable requests={requests.slice(0,6)} setSelectedRequest={setSelectedRequest} />
      </Panel>
      <div className="grid gap-5 lg:grid-cols-2">
        <Panel title="Recent Goods Receiving"><ReceiptList receipts={receipts.slice(0,4)} /></Panel>
        <Panel title="Bills Forwarded to Accounts"><BillList bills={bills.slice(0,4)} /></Panel>
      </div>
    </div>
    <aside className="space-y-5">
      <Panel title="Procurement Workflow Snapshot"><Workflow /></Panel>
      <Panel title="Low Stock & Reorder Alerts"><div className="divide-y divide-slate-100">{lowStockItems.map((item) => <div key={item.item} className="flex items-center justify-between gap-4 py-3"><div><p className="text-sm font-black">{item.item}</p><p className="text-xs text-slate-500">{item.department}</p><p className="mt-1 text-xs text-slate-500">Stock: {item.stock} · Reorder: {item.reorder}</p></div><StatusPill value={item.level} /></div>)}</div></Panel>
      <Panel title="Vehicle / Fuel / Maintenance"><div className="grid gap-3 sm:grid-cols-2"><MiniStat label="Fuel Issued Today" value={money(12450)} icon="⛽" /><MiniStat label="Vehicles in Service" value="12" icon="🚗" /><MiniStat label="Maintenance Pending" value="4" icon="🔧" /><MiniStat label="Oil Expenses MTD" value={money(18750)} icon="🛢️" /></div></Panel>
    </aside>
  </section>
)

const Requests = ({ requests, search, setSearch, typeFilter, setTypeFilter, statusFilter, setStatusFilter, selectedRequest, setSelectedRequest, updateRequest }) => (
  <section className="grid gap-5 xl:grid-cols-[minmax(0,2fr)_320px]">
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="grid gap-3 border-b border-slate-200 p-4 md:grid-cols-3"><input className={inputClass} value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search request, department, item..." /><select className={inputClass} value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}><option>All</option><option>Normal</option><option>Urgent</option><option>Next-Day</option></select><select className={inputClass} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}><option>All</option><option>Pending Review</option><option>Procurement Needed</option><option>Approved</option><option>Received</option><option>Partially Received</option></select></div>
      <RequestTable requests={requests} setSelectedRequest={setSelectedRequest} action />
    </div>
    <aside>{selectedRequest ? <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex items-start justify-between gap-3"><div><p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-500">Selected Request</p><h3 className="mt-3 text-lg font-black">{selectedRequest.item}</h3><p className="mt-1 font-mono text-xs text-slate-500">{selectedRequest.id}</p></div><StatusPill value={selectedRequest.type} /></div><div className="mt-5 space-y-3"><DetailLine label="Department" value={selectedRequest.department} /><DetailLine label="Quantity" value={selectedRequest.quantity} /><DetailLine label="Requested By" value={selectedRequest.requestedBy} /><DetailLine label="Required Date" value={selectedRequest.requiredDate} /><DetailLine label="Store Status" value={selectedRequest.storeStatus} /><DetailLine label="Approval" value={selectedRequest.approval} /><DetailLine label="Remarks" value={selectedRequest.remarks || '—'} /></div><div className="mt-5 grid gap-2"><button type="button" onClick={() => updateRequest(selectedRequest.id, { storeStatus:'Approved', approval:'Approved' }, `${selectedRequest.id} approved for store issue.`)} className={greenButton}>Issue from Store / Approve</button><button type="button" onClick={() => updateRequest(selectedRequest.id, { storeStatus:'Procurement Needed' }, `${selectedRequest.id} sent to procurement.`)} className={blueButton}>Send to Procurement</button><button type="button" onClick={() => updateRequest(selectedRequest.id, { approval:'Approved' }, `${selectedRequest.id} approved by director.`)} className={amberOutlineButton}>Director Approve</button></div></div> : <EmptyCard text="Select a request to review it." />}</aside>
  </section>
)

const Procurement = ({ requests, updateRequest }) => {
  const list = requests.filter((r) => ['Procurement Needed','Purchase Ordered','Vendor Selected'].includes(r.storeStatus))
  return <Panel title="Procurement Workflow"><div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">{list.map((r) => <div key={r.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-5"><p className="font-mono text-xs font-black text-sky-700">{r.id}</p><h3 className="mt-3 font-black">{r.item}</h3><p className="mt-1 text-sm text-slate-500">{r.department}</p><div className="mt-4 space-y-2"><DetailLine label="Quantity" value={r.quantity} /><DetailLine label="Type" value={r.type} /><DetailLine label="Approval" value={r.approval} /></div><div className="mt-5 grid gap-2"><button type="button" onClick={() => updateRequest(r.id,{storeStatus:'Vendor Selected'},`${r.id} vendor selected.`)} className={secondaryButton}>Select Vendor</button><button type="button" onClick={() => updateRequest(r.id,{storeStatus:'Purchase Ordered'},`${r.id} purchase order created.`)} className={primaryButton}>Create Purchase Order</button></div></div>)}{list.length === 0 && <div className="md:col-span-2 xl:col-span-4"><EmptyCard text="No requests currently require procurement." /></div>}</div></Panel>
}

const GoodsReceiving = ({ receipts, onNew }) => <Panel title="Goods Receiving Register" action="New Goods Receipt" onAction={onNew}><ReceiptTable receipts={receipts} /></Panel>
const Bills = ({ bills }) => <Panel title="Bills Forwarded to Accounts"><BillTable bills={bills} /></Panel>

const RequestTable = ({ requests, setSelectedRequest, action }) => <div className="overflow-x-auto"><table className="w-full min-w-[900px] text-left text-sm"><thead className={theadClass}><tr>{['Request ID','Department','Item','Qty','Requester','Store Status','Approval','Type',...(action?['Action']:[])].map((h)=><th key={h} className="px-4 py-3">{h}</th>)}</tr></thead><tbody className="divide-y divide-slate-100">{requests.map((r)=><tr key={r.id} className="hover:bg-slate-50"><td className="px-4 py-4 font-mono font-black">{r.id}</td><td className="px-4 py-4 font-bold">{r.department}</td><td className="px-4 py-4">{r.item}</td><td className="px-4 py-4 font-black">{r.quantity}</td><td className="px-4 py-4">{r.requestedBy}</td><td className="px-4 py-4"><StatusPill value={r.storeStatus} /></td><td className="px-4 py-4"><StatusPill value={r.approval} /></td><td className="px-4 py-4"><StatusPill value={r.type} /></td>{action && <td className="px-4 py-4"><button type="button" onClick={() => setSelectedRequest(r)} className={secondaryButton}>Review</button></td>}</tr>)}</tbody></table></div>
const ReceiptTable = ({ receipts }) => <div className="overflow-x-auto"><table className="w-full min-w-[900px] text-left text-sm"><thead className={theadClass}><tr>{['GRN No','Vendor','Department','Delivery Status','Verified By','Bill Status'].map((h)=><th key={h} className="px-4 py-3">{h}</th>)}</tr></thead><tbody className="divide-y divide-slate-100">{receipts.map((r)=><tr key={r.grn} className="hover:bg-slate-50"><td className="px-4 py-4 font-mono font-black">{r.grn}</td><td className="px-4 py-4 font-bold">{r.vendor}</td><td className="px-4 py-4">{r.department}</td><td className="px-4 py-4"><StatusPill value={r.deliveryStatus} /></td><td className="px-4 py-4">{r.verifiedBy}</td><td className="px-4 py-4"><StatusPill value={r.billStatus} /></td></tr>)}</tbody></table></div>
const BillTable = ({ bills }) => <div className="overflow-x-auto"><table className="w-full min-w-[900px] text-left text-sm"><thead className={theadClass}><tr>{['Bill No','Vendor','Amount','Forwarded Date','Accounts Status','Payment Method'].map((h)=><th key={h} className="px-4 py-3">{h}</th>)}</tr></thead><tbody className="divide-y divide-slate-100">{bills.map((b)=><tr key={b.billNo} className="hover:bg-slate-50"><td className="px-4 py-4 font-mono font-black">{b.billNo}</td><td className="px-4 py-4 font-bold">{b.vendor}</td><td className="px-4 py-4 font-black">{money(b.amount)}</td><td className="px-4 py-4">{b.forwardedDate}</td><td className="px-4 py-4"><StatusPill value={b.accountsStatus} /></td><td className="px-4 py-4">{b.paymentMethod}</td></tr>)}</tbody></table></div>
const ReceiptList = ({ receipts }) => <div className="divide-y divide-slate-100">{receipts.map((r)=><div key={r.grn} className="grid grid-cols-[1fr_auto] gap-4 px-4 py-3"><div><p className="font-mono text-xs font-black">{r.grn}</p><p className="mt-1 text-sm font-bold">{r.vendor}</p><p className="text-xs text-slate-500">{r.department}</p></div><div className="text-right"><StatusPill value={r.deliveryStatus} /><div className="mt-2"><StatusPill value={r.billStatus} /></div></div></div>)}</div>
const BillList = ({ bills }) => <div className="divide-y divide-slate-100">{bills.map((b)=><div key={b.billNo} className="grid grid-cols-[1fr_auto] gap-4 px-4 py-3"><div><p className="font-mono text-xs font-black">{b.billNo}</p><p className="mt-1 text-sm font-bold">{b.vendor}</p><p className="text-xs text-slate-500">{b.forwardedDate}</p></div><div className="text-right"><p className="font-black">{money(b.amount)}</p><div className="mt-2"><StatusPill value={b.accountsStatus} /></div></div></div>)}</div>
const Workflow = () => <div className="grid gap-3 sm:grid-cols-2">{[['1','Department Request','28','New Today'],['2','Store Review','13','Under Review'],['3','Procurement List','7','In Progress'],['4','Director Approval','4','Pending'],['5','Vendor','6','Orders Sent'],['6','Goods Received','11','Pending Verify'],['7','Department Mobilisation','8','In Progress'],['8','Bills to Accounts','7','Forwarded']].map(([s,t,v,n])=><div key={s} className="rounded-xl border border-slate-200 bg-slate-50 p-4"><span className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-400 text-sm font-black">{s}</span><p className="mt-3 text-sm font-black">{t}</p><p className="mt-2 font-serif text-2xl font-black">{v}</p><p className="text-xs text-slate-500">{n}</p></div>)}</div>

const Panel = ({ title, action, onAction, children }) => <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"><div className="flex items-center justify-between gap-4 border-b border-slate-200 px-5 py-4"><h2 className="text-sm font-black uppercase tracking-[0.16em] text-slate-700">{title}</h2>{action && <button type="button" onClick={onAction} className="text-xs font-black text-amber-700 hover:underline">{action} →</button>}</div>{children}</section>
const SummaryCard = ({ label, value, icon }) => <div className="min-h-[150px] rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"><div className="flex items-start justify-between gap-3"><p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">{label}</p><span className="text-lg">{icon}</span></div><p className="mt-5 font-serif text-2xl font-black text-slate-950">{value}</p></div>
const MiniStat = ({ label, value, icon }) => <div className="rounded-xl border border-slate-200 bg-slate-50 p-4"><p className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-500">{icon} {label}</p><p className="mt-2 font-serif text-xl font-black">{value}</p></div>
const StatusPill = ({ value }) => { const text=String(value||'—'), n=text.toLowerCase(); const cls=n.includes('critical')?'border-red-200 bg-red-50 text-red-700':(['approved','received','verified'].some(x=>n.includes(x))?'border-emerald-200 bg-emerald-50 text-emerald-700':(['procurement','partial','under verification'].some(x=>n.includes(x))?'border-sky-200 bg-sky-50 text-sky-700':(['pending','urgent','next-day','low'].some(x=>n.includes(x))?'border-amber-200 bg-amber-50 text-amber-700':'border-slate-200 bg-slate-50 text-slate-600'))); return <span className={`inline-flex rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-wide ${cls}`}>{text}</span> }
const Modal = ({ children, onClose, title, description }) => <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm" onMouseDown={(e)=>{if(e.target===e.currentTarget)onClose()}}><div className="w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-2xl"><div className="flex items-start justify-between gap-4 border-b border-slate-200 px-5 py-4"><div><h2 className="font-serif text-2xl font-black">{title}</h2><p className="mt-1 text-sm text-slate-500">{description}</p></div><button type="button" onClick={onClose} className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-lg text-slate-500 hover:bg-slate-50">×</button></div>{children}</div></div>
const ModalFooter = ({ onCancel, onConfirm, confirmText }) => <div className="flex justify-end gap-2 border-t border-slate-200 bg-slate-50 p-4"><button type="button" onClick={onCancel} className={secondaryButton}>Cancel</button><button type="button" onClick={onConfirm} className={primaryButton}>{confirmText}</button></div>
const InputField = ({ label, value, onChange, placeholder, type='text', error }) => <label className="block"><span className={labelClass}>{label}</span><input type={type} value={value} onChange={(e)=>onChange(e.target.value)} placeholder={placeholder} className={`${inputClass} ${error?'border-red-300':''}`} />{error && <span className="mt-1 block text-xs font-semibold text-red-600">{error}</span>}</label>
const SelectField = ({ label, value, options, onChange }) => <label className="block"><span className={labelClass}>{label}</span><select value={value} onChange={(e)=>onChange(e.target.value)} className={inputClass}>{options.map((o)=><option key={o} value={o}>{o}</option>)}</select></label>
const TextAreaField = ({ label, value, onChange, placeholder }) => <label className="block"><span className={labelClass}>{label}</span><textarea rows={4} value={value} onChange={(e)=>onChange(e.target.value)} placeholder={placeholder} className="w-full resize-none rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20" /></label>
const DetailLine = ({ label, value }) => <div className="flex items-start justify-between gap-4 text-sm"><span className="text-slate-500">{label}</span><span className="text-right font-black">{value}</span></div>
const EmptyCard = ({ text }) => <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-sm text-slate-500">{text}</div>

const inputClass='h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20'
const labelClass='mb-2 block text-[10px] font-black uppercase tracking-[0.15em] text-slate-500'
const theadClass='border-b border-slate-200 bg-slate-50 text-[10px] uppercase tracking-[0.14em] text-slate-500'
const primaryButton='rounded-xl bg-amber-400 px-5 py-3 text-sm font-black text-slate-950 shadow-sm hover:bg-amber-300'
const secondaryButton='rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-black text-slate-700 hover:bg-slate-50'
const greenButton='rounded-xl bg-emerald-600 px-4 py-3 text-sm font-black text-white hover:bg-emerald-500'
const blueButton='rounded-xl bg-sky-600 px-4 py-3 text-sm font-black text-white hover:bg-sky-500'
const amberOutlineButton='rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm font-black text-amber-800 hover:bg-amber-100'

export default StorePurchaseDashboard
