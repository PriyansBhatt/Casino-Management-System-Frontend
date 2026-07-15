import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import PageHeader from '../../components/layout/PageHeader'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import { getCustomerById, updateCustomer } from '../../api/customerApi'
import useAuth from '../../hooks/useAuth'
import useBusinessStatus from '../../hooks/useBusinessStatus'
import useToast from '../../hooks/useToast'
import { safeLogAuditEvent } from '../../services/auditService'
import { AUDIT_ACTIONS, AUDIT_MODULES, AUDIT_SEVERITY } from '../../constants/auditConstants'
import { getErrorMessage } from '../../utils/errorUtils'

const documentTypes = ['Passport', 'Citizenship', 'Driving License', 'Other']
const genderOptions = ['Male', 'Female', 'Other']
const statuses = ['ACTIVE', 'INACTIVE', 'WATCHLIST']
const riskLevels = ['LOW', 'MEDIUM', 'HIGH']

const CustomerEdit = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { businessStatus } = useBusinessStatus()
  const { showToast } = useToast()
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm()

  useEffect(() => {
    const loadCustomer = async () => {
      setIsLoading(true)
      setErrorMessage('')

      try {
        const customer = await getCustomerById(id)
        reset({
          fullName: customer.fullName || '',
          phone: customer.phone || '',
          email: customer.email || '',
          nationality: customer.nationality || '',
          documentType: customer.documentType || '',
          documentNumber: customer.documentNumber || '',
          dateOfBirth: customer.dateOfBirth || '',
          gender: customer.gender || '',
          address: customer.address || '',
          status: customer.status || 'ACTIVE',
          riskLevel: customer.riskLevel || 'LOW',
          remarks: customer.remarks || '',
        })
      } catch (error) {
        const message = getErrorMessage(error)
        setErrorMessage(message)
        showToast({ type: 'error', title: 'Customer Load Failed', message })
      } finally {
        setIsLoading(false)
      }
    }

    loadCustomer()
  }, [id, reset])

  const onSubmit = async (data) => {
    setSuccessMessage('')
    setErrorMessage('')
    setIsSubmitting(true)

    try {
      const customer = await updateCustomer(id, data)
      safeLogAuditEvent({
        module: AUDIT_MODULES.RECEPTION,
        action: AUDIT_ACTIONS.UPDATE,
        severity:
          data.riskLevel === 'HIGH' || data.status === 'WATCHLIST'
            ? AUDIT_SEVERITY.HIGH
            : AUDIT_SEVERITY.MEDIUM,
        description: `Customer ${customer.fullName || id} updated.`,
        businessDate: businessStatus?.businessDate,
        performedBy: user?.fullName || user?.username,
        performedByRole: user?.role,
        entityType: 'CUSTOMER',
        entityId: id,
        newValue: customer,
      })
      setSuccessMessage('Customer updated successfully.')
      showToast({ type: 'success', title: 'Customer Updated', message: customer.fullName || id })
      setTimeout(() => navigate(`/reception/customers/${id}`), 600)
    } catch (error) {
      const message = getErrorMessage(error)
      setErrorMessage(message)
      showToast({ type: 'error', title: 'Customer Update Failed', message })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return <Card>Loading customer...</Card>
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Edit Customer"
        description="Update reception customer information."
        actions={
          <Button variant="outline" onClick={() => navigate(`/reception/customers/${id}`)}>
            Back to Profile
          </Button>
        }
      />

      <Card>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <Input
              label="Full Name"
              required
              {...register('fullName', { required: 'Full name is required' })}
              error={errors.fullName?.message}
              disabled={isSubmitting}
            />
            <Input
              label="Phone"
              required
              {...register('phone', { required: 'Phone is required' })}
              error={errors.phone?.message}
              disabled={isSubmitting}
            />
            <Input label="Email" type="email" {...register('email')} disabled={isSubmitting} />
            <Input
              label="Nationality"
              required
              {...register('nationality', { required: 'Nationality is required' })}
              error={errors.nationality?.message}
              disabled={isSubmitting}
            />

            <div>
              <label htmlFor="documentType" className="mb-2 block text-sm font-medium text-gray-700">
                Document Type <span className="text-red-500">*</span>
              </label>
              <select
                id="documentType"
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={isSubmitting}
                {...register('documentType', { required: 'Document type is required' })}
              >
                {documentTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
              {errors.documentType && (
                <p className="mt-1 text-sm text-red-500">{errors.documentType.message}</p>
              )}
            </div>

            <Input
              label="Document Number"
              required
              {...register('documentNumber', { required: 'Document number is required' })}
              error={errors.documentNumber?.message}
              disabled={isSubmitting}
            />
            <Input label="Date of Birth" type="date" {...register('dateOfBirth')} disabled={isSubmitting} />

            <div>
              <label htmlFor="gender" className="mb-2 block text-sm font-medium text-gray-700">
                Gender
              </label>
              <select
                id="gender"
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={isSubmitting}
                {...register('gender')}
              >
                <option value="">Select gender</option>
                {genderOptions.map((gender) => (
                  <option key={gender} value={gender}>
                    {gender}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="status" className="mb-2 block text-sm font-medium text-gray-700">
                Status
              </label>
              <select
                id="status"
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={isSubmitting}
                {...register('status')}
              >
                {statuses.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="riskLevel" className="mb-2 block text-sm font-medium text-gray-700">
                Risk Level
              </label>
              <select
                id="riskLevel"
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={isSubmitting}
                {...register('riskLevel')}
              >
                {riskLevels.map((level) => (
                  <option key={level} value={level}>
                    {level}
                  </option>
                ))}
              </select>
            </div>

            <div className="md:col-span-2">
              <label htmlFor="address" className="mb-2 block text-sm font-medium text-gray-700">
                Address
              </label>
              <textarea
                id="address"
                rows={3}
                disabled={isSubmitting}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
                {...register('address')}
              />
            </div>

            <div className="md:col-span-2">
              <label htmlFor="remarks" className="mb-2 block text-sm font-medium text-gray-700">
                Remarks
              </label>
              <textarea
                id="remarks"
                rows={3}
                disabled={isSubmitting}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
                {...register('remarks')}
              />
            </div>
          </div>

          {successMessage && (
            <div className="rounded-lg border border-green-200 bg-green-50 p-4 text-sm font-medium text-green-700">
              {successMessage}
            </div>
          )}
          {errorMessage && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">
              {errorMessage}
            </div>
          )}

          <div className="flex justify-end gap-3 border-t border-gray-200 pt-6">
            <Button type="button" variant="secondary" onClick={() => navigate(`/reception/customers/${id}`)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  )
}

export default CustomerEdit
