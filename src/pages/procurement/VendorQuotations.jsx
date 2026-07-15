import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import PageHeader from '../../components/layout/PageHeader'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import Badge from '../../components/ui/Badge'
import useAuth from '../../hooks/useAuth'
import useToast from '../../hooks/useToast'
import {
  addVendorQuotation,
  getProcurementList,
  getVendorQuotations,
  selectVendorQuotation,
} from '../../api/storeApi'
import { getRequestStatusBadgeVariant } from '../../utils/storeUtils'
import { formatDateTime } from '../../utils/customerUtils'
import { safeLogAuditEvent } from '../../services/auditService'
import { AUDIT_ACTIONS, AUDIT_MODULES, AUDIT_SEVERITY } from '../../constants/auditConstants'
import { getErrorMessage } from '../../utils/errorUtils'

const formatMoney = (value) => `NPR ${Number(value || 0).toLocaleString()}`

const VendorQuotations = () => {
  const { user } = useAuth()
  const { showToast } = useToast()
  const [searchParams] = useSearchParams()
  const [items, setItems] = useState([])
  const [selectedId, setSelectedId] = useState(searchParams.get('procurementId') || '')
  const [quotations, setQuotations] = useState([])
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    defaultValues: {
      vendorName: '',
      vendorContact: '',
      quotedAmount: '',
      estimatedDeliveryDate: '',
      remarks: '',
    },
  })

  const selectedItem = items.find((item) => item.id === selectedId)

  const loadItems = async () => {
    setIsLoading(true)
    setError('')
    try {
      const data = await getProcurementList()
      setItems(data)
      if (!selectedId && data[0]?.id) setSelectedId(data[0].id)
    } catch (err) {
      const message = getErrorMessage(err)
      setError(message)
      showToast({ type: 'error', title: 'Procurement Load Failed', message })
    } finally {
      setIsLoading(false)
    }
  }

  const loadQuotations = async () => {
    if (!selectedId) {
      setQuotations([])
      return
    }
    try {
      setQuotations(await getVendorQuotations(selectedId))
    } catch (err) {
      const message = getErrorMessage(err)
      setError(message)
      showToast({ type: 'error', title: 'Quotation Load Failed', message })
    }
  }

  useEffect(() => {
    loadItems()
  }, [])

  useEffect(() => {
    loadQuotations()
  }, [selectedId])

  const onSubmit = async (data) => {
    if (!selectedId) return
    setIsSubmitting(true)
    setMessage('')
    setError('')
    try {
      const quotation = await addVendorQuotation(selectedId, {
        ...data,
        quotedAmount: Number(data.quotedAmount || 0),
      })
      safeLogAuditEvent({
        module: AUDIT_MODULES.PROCUREMENT,
        action: AUDIT_ACTIONS.CREATE,
        severity: AUDIT_SEVERITY.MEDIUM,
        description: `Vendor quotation added for ${selectedItem?.reference || selectedId}.`,
        businessDate: selectedItem?.businessDate,
        performedBy: user?.fullName || user?.username,
        performedByRole: user?.role,
        entityType: 'VENDOR_QUOTATION',
        entityId: quotation.id,
        newValue: quotation,
        reason: data.remarks,
      })
      setMessage('Vendor quotation added.')
      showToast({ type: 'success', title: 'Quotation Added', message: quotation.vendorName })
      reset()
      await loadQuotations()
    } catch (err) {
      const message = getErrorMessage(err)
      setError(message)
      showToast({ type: 'error', title: 'Add Quotation Failed', message })
    } finally {
      setIsSubmitting(false)
    }
  }

  const selectQuotation = async (quotation) => {
    setMessage('')
    setError('')
    try {
      await selectVendorQuotation(selectedId, quotation.id)
      setMessage(`${quotation.vendorName} quotation selected.`)
      showToast({ type: 'success', title: 'Quotation Selected', message: quotation.vendorName })
      await loadItems()
      await loadQuotations()
    } catch (err) {
      const message = getErrorMessage(err)
      setError(message)
      showToast({ type: 'error', title: 'Select Quotation Failed', message })
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Vendor Quotations" description="Collect and compare multiple vendor quotations for procurement items." />

      <Card>
        <label htmlFor="procurementItem" className="mb-2 block text-sm font-medium text-gray-700">Procurement Item</label>
        <select id="procurementItem" value={selectedId} onChange={(event) => setSelectedId(event.target.value)} className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="">Select procurement item</option>
          {items.map((item) => <option key={item.id} value={item.id}>{item.reference} - {item.itemName}</option>)}
        </select>
      </Card>

      {selectedItem && (
        <Card>
          <div className="grid gap-4 md:grid-cols-4">
            <div><p className="text-xs font-semibold uppercase text-gray-500">Reference</p><p className="mt-1 text-sm text-gray-900">{selectedItem.reference}</p></div>
            <div><p className="text-xs font-semibold uppercase text-gray-500">Source Request</p><p className="mt-1 text-sm text-gray-900">{selectedItem.requestReference}</p></div>
            <div><p className="text-xs font-semibold uppercase text-gray-500">Department</p><p className="mt-1 text-sm text-gray-900">{selectedItem.departmentName}</p></div>
            <div><p className="text-xs font-semibold uppercase text-gray-500">Status</p><Badge variant={getRequestStatusBadgeVariant(selectedItem.status)}>{selectedItem.status}</Badge></div>
          </div>
          <p className="mt-4 text-sm text-gray-600">{selectedItem.itemName} - {selectedItem.quantity} {selectedItem.unit}</p>
        </Card>
      )}

      {message && <Card className="border-green-200 bg-green-50"><p className="text-sm text-green-700">{message}</p></Card>}
      {error && <Card className="border-red-200 bg-red-50"><p className="text-sm text-red-700">{error}</p></Card>}

      <Card>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">Add Vendor Quotation</h2>
          <div className="grid gap-4 md:grid-cols-3">
            <Input label="Vendor Name" required {...register('vendorName', { required: 'Vendor name is required' })} error={errors.vendorName?.message} disabled={isSubmitting || !selectedId} />
            <Input label="Vendor Contact" {...register('vendorContact')} disabled={isSubmitting || !selectedId} />
            <Input label="Quoted Amount" type="number" min="1" required {...register('quotedAmount', { required: 'Quoted amount is required', min: { value: 1, message: 'Amount must be greater than 0' } })} error={errors.quotedAmount?.message} disabled={isSubmitting || !selectedId} />
            <Input label="Estimated Delivery Date" type="date" {...register('estimatedDeliveryDate')} disabled={isSubmitting || !selectedId} />
            <div className="md:col-span-2">
              <label htmlFor="remarks" className="mb-2 block text-sm font-medium text-gray-700">Remarks</label>
              <textarea id="remarks" rows={2} {...register('remarks')} disabled={isSubmitting || !selectedId} className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>
          <div className="flex justify-end">
            <Button type="submit" disabled={isSubmitting || !selectedId}>{isSubmitting ? 'Adding...' : 'Add Quotation'}</Button>
          </div>
        </form>
      </Card>

      <Card className="overflow-hidden p-0">
        {isLoading && <p className="p-6 text-sm text-gray-600">Loading procurement items...</p>}
        {!isLoading && quotations.length === 0 && <p className="p-6 text-sm text-gray-600">No quotations added for this procurement item.</p>}
        {quotations.length > 0 && (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {['Vendor Name', 'Contact', 'Quoted Amount', 'Estimated Delivery', 'Remarks', 'Created At', 'Actions'].map((header) => (
                    <th key={header} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">{header}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {quotations.map((quotation) => (
                  <tr key={quotation.id} className="hover:bg-gray-50">
                    <td className="whitespace-nowrap px-4 py-3 text-sm font-semibold text-gray-900">{quotation.vendorName} {quotation.isSelected && <Badge variant="success">Selected</Badge>}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-700">{quotation.vendorContact || 'Not available'}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-700">{formatMoney(quotation.quotedAmount)}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-700">{quotation.estimatedDeliveryDate || 'Not available'}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">{quotation.remarks || 'Not available'}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-700">{formatDateTime(quotation.createdAt)}</td>
                    <td className="whitespace-nowrap px-4 py-3"><Button size="sm" variant="secondary" onClick={() => selectQuotation(quotation)}>Select Quotation</Button></td>
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

export default VendorQuotations
