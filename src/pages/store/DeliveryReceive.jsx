import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import PageHeader from '../../components/layout/PageHeader'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import Badge from '../../components/ui/Badge'
import LockedActionNotice from '../../components/business/LockedActionNotice'
import useAuth from '../../hooks/useAuth'
import useBusinessStatus from '../../hooks/useBusinessStatus'
import { getProcurementList, receiveDelivery } from '../../api/storeApi'
import { DELIVERY_STATUSES, REQUEST_STATUSES } from '../../constants/storeConstants'
import { getRequestStatusBadgeVariant } from '../../utils/storeUtils'
import { safeLogAuditEvent } from '../../services/auditService'
import { AUDIT_ACTIONS, AUDIT_MODULES, AUDIT_SEVERITY } from '../../constants/auditConstants'

const DeliveryReceive = () => {
  const { user } = useAuth()
  const { isSystemLocked } = useBusinessStatus()
  const [items, setItems] = useState([])
  const [selectedItem, setSelectedItem] = useState(null)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    defaultValues: {
      receivedItems: '',
      receivedQuantity: '',
      deliveryStatus: DELIVERY_STATUSES.PARTIAL,
      billNumber: '',
      billAmount: '',
      remarks: '',
    },
  })

  const loadItems = async () => {
    setIsLoading(true)
    setError('')
    try {
      const data = await getProcurementList()
      setItems(data.filter((item) =>
        [REQUEST_STATUSES.ORDERED, REQUEST_STATUSES.PARTIALLY_DELIVERED].includes(item.status)
      ))
    } catch (err) {
      setError(err.message || 'Failed to load ordered procurement items.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadItems()
  }, [])

  const startReceive = (item, status) => {
    setSelectedItem(item)
    reset({
      receivedItems: item.itemName,
      receivedQuantity: status === DELIVERY_STATUSES.FULL ? item.quantity : '',
      deliveryStatus: status,
      billNumber: '',
      billAmount: '',
      remarks: '',
    })
  }

  const onSubmit = async (data) => {
    if (!selectedItem) return
    if (isSystemLocked) {
      setError('System is locked. Delivery receive is disabled during settlement period.')
      return
    }
    setIsSubmitting(true)
    setMessage('')
    setError('')
    try {
      const updated = await receiveDelivery(selectedItem.id, {
        ...data,
        receivedQuantity: Number(data.receivedQuantity || 0),
        receivedBy: user?.username || user?.fullName,
      })
      safeLogAuditEvent({
        module: AUDIT_MODULES.STORE,
        action: AUDIT_ACTIONS.UPDATE,
        severity: AUDIT_SEVERITY.MEDIUM,
        description: `Delivery received for procurement ${selectedItem.reference}.`,
        businessDate: selectedItem.businessDate,
        performedBy: user?.fullName || user?.username,
        performedByRole: user?.role,
        entityType: 'DELIVERY_RECEIVE',
        entityId: selectedItem.id,
        newValue: updated,
        reason: data.remarks,
      })
      setMessage(`${selectedItem.reference} delivery received.`)
      setSelectedItem(null)
      reset()
      await loadItems()
    } catch (err) {
      setError(err.message || 'Failed to receive delivery.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Delivery Receive" description="Receive partial or full deliveries for ordered procurement items." />

      <Card className="border-blue-200 bg-blue-50">
        <p className="text-sm text-blue-900">
          Bill information is captured here but final payment will be handled by Accounts module later.
        </p>
      </Card>

      {isSystemLocked && <LockedActionNotice />}

      {message && <Card className="border-green-200 bg-green-50"><p className="text-sm text-green-700">{message}</p></Card>}
      {error && <Card className="border-red-200 bg-red-50"><p className="text-sm text-red-700">{error}</p></Card>}

      <Card className="overflow-hidden p-0">
        {isLoading && <p className="p-6 text-sm text-gray-600">Loading ordered items...</p>}
        {!isLoading && items.length === 0 && (
          <div className="p-6 text-center">
            <p className="font-semibold text-gray-900">No ordered procurement items found.</p>
            <p className="mt-1 text-sm text-gray-600">Mark a selected quotation as ordered before receiving delivery.</p>
          </div>
        )}
        {items.length > 0 && (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {['Reference', 'Request', 'Department', 'Item', 'Quantity', 'Status', 'Business Date', 'Actions'].map((header) => (
                    <th key={header} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">{header}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {items.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="whitespace-nowrap px-4 py-3 text-sm font-semibold text-gray-900">{item.reference}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-700">{item.requestReference}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-700">{item.departmentName}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-700">{item.itemName}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-700">{item.quantity} {item.unit}</td>
                    <td className="whitespace-nowrap px-4 py-3"><Badge variant={getRequestStatusBadgeVariant(item.status)}>{item.status}</Badge></td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-700">{item.businessDate}</td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <div className="flex flex-wrap gap-2">
                        <Button size="sm" variant="secondary" onClick={() => startReceive(item, DELIVERY_STATUSES.PARTIAL)} disabled={isSystemLocked}>Partial Delivery</Button>
                        <Button size="sm" onClick={() => startReceive(item, DELIVERY_STATUSES.FULL)} disabled={isSystemLocked}>Full Delivery</Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {selectedItem && (
        <Card>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-900">Receive {selectedItem.reference}</h2>
            <div className="grid gap-4 md:grid-cols-3">
              <Input label="Received Items" required {...register('receivedItems', { required: 'Received items are required' })} error={errors.receivedItems?.message} disabled={isSubmitting || isSystemLocked} />
              <Input label="Received Quantity" type="number" min="1" required {...register('receivedQuantity', { required: 'Received quantity is required', min: { value: 1, message: 'Quantity must be greater than 0' } })} error={errors.receivedQuantity?.message} disabled={isSubmitting || isSystemLocked} />
              <div>
                <label htmlFor="deliveryStatus" className="mb-2 block text-sm font-medium text-gray-700">Delivery Status</label>
                <select id="deliveryStatus" {...register('deliveryStatus')} disabled={isSubmitting || isSystemLocked} className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value={DELIVERY_STATUSES.PARTIAL}>PARTIAL</option>
                  <option value={DELIVERY_STATUSES.FULL}>FULL</option>
                </select>
              </div>
              <Input label="Bill Number" {...register('billNumber')} disabled={isSubmitting || isSystemLocked} />
              <Input label="Bill Amount" type="number" min="0" {...register('billAmount', { min: { value: 0, message: 'Bill amount cannot be negative' } })} error={errors.billAmount?.message} disabled={isSubmitting || isSystemLocked} />
              <div className="md:col-span-3">
                <label htmlFor="remarks" className="mb-2 block text-sm font-medium text-gray-700">Delivery Remarks</label>
                <textarea id="remarks" rows={3} {...register('remarks')} disabled={isSubmitting || isSystemLocked} className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <Button type="button" variant="secondary" onClick={() => setSelectedItem(null)} disabled={isSubmitting}>Cancel</Button>
              <Button type="submit" disabled={isSubmitting || isSystemLocked}>{isSubmitting ? 'Receiving...' : 'Receive Delivery'}</Button>
            </div>
          </form>
        </Card>
      )}
    </div>
  )
}

export default DeliveryReceive
