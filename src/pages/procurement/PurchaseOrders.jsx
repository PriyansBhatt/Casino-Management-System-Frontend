import { useEffect, useState } from 'react'
import PageHeader from '../../components/layout/PageHeader'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Badge from '../../components/ui/Badge'
import useAuth from '../../hooks/useAuth'
import { getProcurementList, markProcurementOrdered } from '../../api/storeApi'
import { getRequestStatusBadgeVariant } from '../../utils/storeUtils'
import { safeLogAuditEvent } from '../../services/auditService'
import { AUDIT_ACTIONS, AUDIT_MODULES, AUDIT_SEVERITY } from '../../constants/auditConstants'

const formatMoney = (value) => `NPR ${Number(value || 0).toLocaleString()}`

const PurchaseOrders = () => {
  const { user } = useAuth()
  const [items, setItems] = useState([])
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  const loadItems = async () => {
    setIsLoading(true)
    setError('')
    try {
      const data = await getProcurementList()
      setItems(data.filter((item) => item.selectedQuotation))
    } catch (err) {
      setError(err.message || 'Failed to load purchase order items.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadItems()
  }, [])

  const markOrdered = async (item) => {
    setIsSaving(true)
    setMessage('')
    setError('')
    try {
      const updated = await markProcurementOrdered(item.id, { orderedBy: user?.username || user?.fullName })
      safeLogAuditEvent({
        module: AUDIT_MODULES.PROCUREMENT,
        action: AUDIT_ACTIONS.UPDATE,
        severity: AUDIT_SEVERITY.MEDIUM,
        description: `Purchase order marked ordered for ${item.reference}.`,
        businessDate: item.businessDate,
        performedBy: user?.fullName || user?.username,
        performedByRole: user?.role,
        entityType: 'PURCHASE_ORDER',
        entityId: item.id,
        newValue: updated,
      })
      setMessage(`${item.reference} marked ordered.`)
      await loadItems()
    } catch (err) {
      setError(err.message || 'Failed to mark ordered.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Purchase Orders" description="Prepare purchase orders from selected vendor quotations." />

      {message && <Card className="border-green-200 bg-green-50"><p className="text-sm text-green-700">{message}</p></Card>}
      {error && <Card className="border-red-200 bg-red-50"><p className="text-sm text-red-700">{error}</p></Card>}

      <Card className="overflow-hidden p-0">
        {isLoading && <p className="p-6 text-sm text-gray-600">Loading purchase order items...</p>}
        {!isLoading && items.length === 0 && (
          <div className="p-6 text-center">
            <p className="font-semibold text-gray-900">No selected quotations found.</p>
            <p className="mt-1 text-sm text-gray-600">Select a quotation before preparing purchase orders.</p>
          </div>
        )}
        {items.length > 0 && (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {['Procurement Reference', 'Vendor', 'Quoted Amount', 'Status', 'Business Date', 'Actions'].map((header) => (
                    <th key={header} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">{header}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {items.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="whitespace-nowrap px-4 py-3 text-sm font-semibold text-gray-900">{item.reference}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-700">{item.selectedQuotation.vendorName}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-700">{formatMoney(item.selectedQuotation.quotedAmount)}</td>
                    <td className="whitespace-nowrap px-4 py-3"><Badge variant={getRequestStatusBadgeVariant(item.status)}>{item.status}</Badge></td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-700">{item.businessDate}</td>
                    <td className="whitespace-nowrap px-4 py-3"><Button size="sm" onClick={() => markOrdered(item)} disabled={isSaving}>Mark Ordered</Button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  )
}

export default PurchaseOrders
