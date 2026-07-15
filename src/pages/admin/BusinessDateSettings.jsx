import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import PageHeader from '../../components/layout/PageHeader'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import useAuth from '../../hooks/useAuth'
import { getSystemSettings, updateSystemSettings } from '../../api/adminApi'
import { SETTING_KEYS } from '../../constants/adminConstants'
import { safeLogAuditEvent } from '../../services/auditService'
import { AUDIT_ACTIONS, AUDIT_MODULES, AUDIT_SEVERITY } from '../../constants/auditConstants'

const BusinessDateSettings = () => {
  const { user } = useAuth()
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const { register, handleSubmit, reset } = useForm({
    defaultValues: {
      [SETTING_KEYS.BUSINESS_DAY_START_TIME]: '09:00',
      [SETTING_KEYS.BUSINESS_DAY_END_TIME]: '08:59',
      [SETTING_KEYS.CASINO_OPERATION_START_TIME]: '12:30',
      [SETTING_KEYS.CASINO_OPERATION_END_TIME]: '06:00',
      [SETTING_KEYS.SETTLEMENT_GRACE_UNTIL]: '06:30',
    },
  })

  useEffect(() => {
    const loadSettings = async () => {
      setIsLoading(true)
      setError('')
      try {
        const settings = await getSystemSettings()
        reset({
          [SETTING_KEYS.BUSINESS_DAY_START_TIME]: settings[SETTING_KEYS.BUSINESS_DAY_START_TIME] || '09:00',
          [SETTING_KEYS.BUSINESS_DAY_END_TIME]: settings[SETTING_KEYS.BUSINESS_DAY_END_TIME] || '08:59',
          [SETTING_KEYS.CASINO_OPERATION_START_TIME]: settings[SETTING_KEYS.CASINO_OPERATION_START_TIME] || '12:30',
          [SETTING_KEYS.CASINO_OPERATION_END_TIME]: settings[SETTING_KEYS.CASINO_OPERATION_END_TIME] || '06:00',
          [SETTING_KEYS.SETTLEMENT_GRACE_UNTIL]: settings[SETTING_KEYS.SETTLEMENT_GRACE_UNTIL] || '06:30',
        })
      } catch (err) {
        setError(err.message || 'Failed to load business date settings.')
      } finally {
        setIsLoading(false)
      }
    }

    loadSettings()
  }, [reset])

  const onSubmit = async (data) => {
    setIsSaving(true)
    setMessage('')
    setError('')
    try {
      const updated = await updateSystemSettings(data)
      safeLogAuditEvent({
        module: AUDIT_MODULES.ADMIN,
        action: AUDIT_ACTIONS.UPDATE,
        severity: AUDIT_SEVERITY.HIGH,
        description: 'Business date settings updated.',
        performedBy: user?.fullName || user?.username,
        performedByRole: user?.role,
        entityType: 'SYSTEM_SETTINGS',
        entityId: 'BUSINESS_DATE',
        newValue: data,
      })
      reset(updated)
      setMessage('Business date settings saved successfully.')
    } catch (err) {
      setError(err.message || 'Failed to save business date settings.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Business Date Settings" description="Configure casino Business Date timing rules." />

      <Card className="border-blue-200 bg-blue-50">
        <p className="text-sm text-blue-900">
          Business Date is separate from calendar date. Transactions after midnight may still belong
          to the same casino business date depending on the configured boundary.
        </p>
      </Card>

      {isLoading && <Card><p className="text-sm text-gray-600">Loading settings...</p></Card>}
      {message && <Card className="border-green-200 bg-green-50"><p className="text-sm text-green-700">{message}</p></Card>}
      {error && <Card className="border-red-200 bg-red-50"><p className="text-sm text-red-700">{error}</p></Card>}

      {!isLoading && (
        <Card>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div className="grid gap-4 md:grid-cols-2">
              <Input label="Business Date Start Time" type="time" {...register(SETTING_KEYS.BUSINESS_DAY_START_TIME)} disabled={isSaving} />
              <Input label="Business Date End Time" type="time" {...register(SETTING_KEYS.BUSINESS_DAY_END_TIME)} disabled={isSaving} />
              <Input label="Casino Operation Start Time" type="time" {...register(SETTING_KEYS.CASINO_OPERATION_START_TIME)} disabled={isSaving} />
              <Input label="Casino Operation End Time" type="time" {...register(SETTING_KEYS.CASINO_OPERATION_END_TIME)} disabled={isSaving} />
              <Input label="Settlement Grace Until" type="time" {...register(SETTING_KEYS.SETTLEMENT_GRACE_UNTIL)} disabled={isSaving} />
            </div>
            <div className="flex justify-end border-t border-gray-200 pt-5">
              <Button type="submit" disabled={isSaving}>{isSaving ? 'Saving...' : 'Save Settings'}</Button>
            </div>
          </form>
        </Card>
      )}
    </div>
  )
}

export default BusinessDateSettings
