import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useFieldArray, useForm } from 'react-hook-form'
import PageHeader from '../../components/layout/PageHeader'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import useAuth from '../../hooks/useAuth'
import useBusinessStatus from '../../hooks/useBusinessStatus'
import { createDepartmentRequest } from '../../api/storeApi'
import { REQUEST_TYPES, REQUEST_STATUSES } from '../../constants/storeConstants'
import { ROLES } from '../../constants/roles'
import { safeLogAuditEvent } from '../../services/auditService'
import { AUDIT_ACTIONS, AUDIT_MODULES, AUDIT_SEVERITY } from '../../constants/auditConstants'

const requestTypes = Object.values(REQUEST_TYPES)

const CreateDepartmentRequest = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { businessStatus } = useBusinessStatus()
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const requestsPath =
    user?.role === ROLES.DEPARTMENT_HEAD ? '/department/my-requests' : '/store/department-requests'

  const {
    control,
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    defaultValues: {
      departmentName: '',
      requestedBy: user?.fullName || user?.username || '',
      requestType: REQUEST_TYPES.NORMAL,
      reason: '',
      items: [{ itemName: '', quantity: '', unit: '', remarks: '' }],
    },
  })

  const { fields, append, remove } = useFieldArray({ control, name: 'items' })

  const onSubmit = async (data) => {
    setMessage('')
    setError('')
    setIsSubmitting(true)

    try {
      const request = await createDepartmentRequest({
        ...data,
        items: data.items.map((item) => ({
          ...item,
          quantity: Number(item.quantity),
        })),
        businessDate: businessStatus?.businessDate,
        status: REQUEST_STATUSES.PENDING_STORE_REVIEW,
        createdBy: user?.username || user?.fullName,
      })
      safeLogAuditEvent({
        module: AUDIT_MODULES.STORE,
        action: AUDIT_ACTIONS.CREATE,
        severity: AUDIT_SEVERITY.MEDIUM,
        description: `Department request ${request.reference} created.`,
        businessDate: businessStatus?.businessDate,
        performedBy: user?.fullName || user?.username,
        performedByRole: user?.role,
        entityType: 'DEPARTMENT_REQUEST',
        entityId: request.id,
        newValue: request,
        reason: data.reason,
      })
      setMessage(`Request ${request.reference} created successfully.`)
      setTimeout(() => navigate(requestsPath), 600)
    } catch (err) {
      setError(err.message || 'Failed to create department request.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Create Department Request"
        description="Create a Business Date based item request for store review."
        actions={<Button variant="outline" onClick={() => navigate(requestsPath)}>Back to Requests</Button>}
      />

      <Card className="border-amber-200 bg-amber-50">
        <p className="text-sm text-amber-900">
          Next-day and urgent requests may require approval depending on amount and casino policy.
          Business Date is assigned automatically: <span className="font-semibold">{businessStatus?.businessDate || 'Not available'}</span>.
        </p>
      </Card>

      <Card>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <Input label="Department Name" required {...register('departmentName', { required: 'Department name is required' })} error={errors.departmentName?.message} disabled={isSubmitting} />
            <Input label="Requested By" required {...register('requestedBy', { required: 'Requested by is required' })} error={errors.requestedBy?.message} disabled={isSubmitting} />
            <div>
              <label htmlFor="requestType" className="mb-2 block text-sm font-medium text-gray-700">Request Type <span className="text-red-500">*</span></label>
              <select id="requestType" disabled={isSubmitting} {...register('requestType', { required: 'Request type is required' })} className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500">
                {requestTypes.map((type) => <option key={type} value={type}>{type}</option>)}
              </select>
              {errors.requestType && <p className="mt-1 text-sm text-red-500">{errors.requestType.message}</p>}
            </div>
            <Input label="Business Date" value={businessStatus?.businessDate || 'Not available'} disabled />
            <div className="md:col-span-2">
              <label htmlFor="reason" className="mb-2 block text-sm font-medium text-gray-700">Reason <span className="text-red-500">*</span></label>
              <textarea id="reason" rows={3} disabled={isSubmitting} {...register('reason', { required: 'Reason is required' })} className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500" />
              {errors.reason && <p className="mt-1 text-sm text-red-500">{errors.reason.message}</p>}
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Request Items</h2>
              <Button type="button" variant="secondary" size="sm" onClick={() => append({ itemName: '', quantity: '', unit: '', remarks: '' })} disabled={isSubmitting}>
                Add Item
              </Button>
            </div>

            {fields.map((field, index) => (
              <div key={field.id} className="rounded-lg border border-gray-200 p-4">
                <div className="grid gap-4 md:grid-cols-4">
                  <Input label="Item Name" required {...register(`items.${index}.itemName`, { required: 'Item name is required' })} error={errors.items?.[index]?.itemName?.message} disabled={isSubmitting} />
                  <Input label="Quantity" type="number" min="1" required {...register(`items.${index}.quantity`, { required: 'Quantity is required', min: { value: 1, message: 'Quantity must be greater than 0' } })} error={errors.items?.[index]?.quantity?.message} disabled={isSubmitting} />
                  <Input label="Unit" required {...register(`items.${index}.unit`, { required: 'Unit is required' })} error={errors.items?.[index]?.unit?.message} disabled={isSubmitting} />
                  <Input label="Remarks" {...register(`items.${index}.remarks`)} disabled={isSubmitting} />
                </div>
                {fields.length > 1 && (
                  <div className="mt-3 flex justify-end">
                    <Button type="button" variant="danger" size="sm" onClick={() => remove(index)} disabled={isSubmitting}>Remove</Button>
                  </div>
                )}
              </div>
            ))}
          </div>

          {message && <div className="rounded-lg border border-green-200 bg-green-50 p-4 text-sm font-medium text-green-700">{message}</div>}
          {error && <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">{error}</div>}

          <div className="flex justify-end gap-3 border-t border-gray-200 pt-6">
            <Button type="button" variant="secondary" onClick={() => navigate(requestsPath)} disabled={isSubmitting}>Cancel</Button>
            <Button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Creating...' : 'Create Request'}</Button>
          </div>
        </form>
      </Card>
    </div>
  )
}

export default CreateDepartmentRequest
