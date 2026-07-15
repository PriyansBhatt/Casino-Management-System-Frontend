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

const SystemSettings = () => {
  const { user } = useAuth()
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const { register, handleSubmit, reset } = useForm({
    defaultValues: {
      [SETTING_KEYS.URGENT_CASH_LIMIT]: 5000,
      [SETTING_KEYS.HIGH_VALUE_TRANSACTION_THRESHOLD]: 100000,
      [SETTING_KEYS.LOSING_RETURN_REVIEW_REQUIRED]: true,
      [SETTING_KEYS.DEFAULT_CURRENCY]: 'NPR',
      [SETTING_KEYS.EXPORT_ENABLED]: false,
      [SETTING_KEYS.NOTIFICATIONS_ENABLED]: false,
    },
  })

  useEffect(() => {
    const loadSettings = async () => {
      setIsLoading(true)
      setError('')
      try {
        const settings = await getSystemSettings()
        reset({
          [SETTING_KEYS.URGENT_CASH_LIMIT]: settings[SETTING_KEYS.URGENT_CASH_LIMIT] ?? 5000,
          [SETTING_KEYS.HIGH_VALUE_TRANSACTION_THRESHOLD]: settings[SETTING_KEYS.HIGH_VALUE_TRANSACTION_THRESHOLD] ?? 100000,
          [SETTING_KEYS.LOSING_RETURN_REVIEW_REQUIRED]: Boolean(settings[SETTING_KEYS.LOSING_RETURN_REVIEW_REQUIRED]),
          [SETTING_KEYS.DEFAULT_CURRENCY]: settings[SETTING_KEYS.DEFAULT_CURRENCY] || 'NPR',
          [SETTING_KEYS.EXPORT_ENABLED]: Boolean(settings[SETTING_KEYS.EXPORT_ENABLED]),
          [SETTING_KEYS.NOTIFICATIONS_ENABLED]: Boolean(settings[SETTING_KEYS.NOTIFICATIONS_ENABLED]),
        })
      } catch (err) {
        setError(err.message || 'Failed to load system settings.')
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
      const payload = {
        ...data,
        [SETTING_KEYS.URGENT_CASH_LIMIT]: Number(data[SETTING_KEYS.URGENT_CASH_LIMIT] || 0),
        [SETTING_KEYS.HIGH_VALUE_TRANSACTION_THRESHOLD]: Number(data[SETTING_KEYS.HIGH_VALUE_TRANSACTION_THRESHOLD] || 0),
        [SETTING_KEYS.LOSING_RETURN_REVIEW_REQUIRED]: Boolean(data[SETTING_KEYS.LOSING_RETURN_REVIEW_REQUIRED]),
        [SETTING_KEYS.EXPORT_ENABLED]: Boolean(data[SETTING_KEYS.EXPORT_ENABLED]),
        [SETTING_KEYS.NOTIFICATIONS_ENABLED]: Boolean(data[SETTING_KEYS.NOTIFICATIONS_ENABLED]),
      }
      const updated = await updateSystemSettings(payload)
      safeLogAuditEvent({
        module: AUDIT_MODULES.ADMIN,
        action: AUDIT_ACTIONS.UPDATE,
        severity: AUDIT_SEVERITY.HIGH,
        description: 'System settings updated.',
        performedBy: user?.fullName || user?.username,
        performedByRole: user?.role,
        entityType: 'SYSTEM_SETTINGS',
        entityId: 'GENERAL',
        newValue: payload,
      })
      reset(updated)
      setMessage('System settings saved successfully.')
    } catch (err) {
      setError(err.message || 'Failed to save system settings.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader title="System Settings" description="Configure global casino operating thresholds and feature flags." />

      <Card className="border-amber-200 bg-amber-50">
        <p className="text-sm font-semibold text-amber-900">Losing return review rule</p>
        <p className="mt-1 text-sm text-amber-900">
          Losing return eligibility must be reviewed using net verified customer loss, not gross buy-in or recycled winnings.
        </p>
        <p className="mt-2 text-sm text-amber-900">
          Example: If customer buys NPR 100,000, cashes out NPR 150,000, then buys in NPR 150,000 again and loses it,
          eligible net loss is NPR 100,000, not NPR 150,000.
        </p>
      </Card>

      {isLoading && <Card><p className="text-sm text-gray-600">Loading settings...</p></Card>}
      {message && <Card className="border-green-200 bg-green-50"><p className="text-sm text-green-700">{message}</p></Card>}
      {error && <Card className="border-red-200 bg-red-50"><p className="text-sm text-red-700">{error}</p></Card>}

      {!isLoading && (
        <Card>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div className="grid gap-4 md:grid-cols-2">
              <Input label="Urgent Cash Limit" type="number" min="0" {...register(SETTING_KEYS.URGENT_CASH_LIMIT)} disabled={isSaving} />
              <Input label="High Value Transaction Threshold" type="number" min="0" {...register(SETTING_KEYS.HIGH_VALUE_TRANSACTION_THRESHOLD)} disabled={isSaving} />
              <Input label="Default Currency" {...register(SETTING_KEYS.DEFAULT_CURRENCY)} disabled={isSaving} />
              <label className="flex items-center gap-3 rounded-lg border border-gray-200 bg-gray-50 p-4 text-sm font-medium text-gray-700">
                <input type="checkbox" className="h-4 w-4 rounded border-gray-300" {...register(SETTING_KEYS.LOSING_RETURN_REVIEW_REQUIRED)} disabled={isSaving} />
                Losing Return Review Required
              </label>
              <label className="flex items-center gap-3 rounded-lg border border-gray-200 bg-gray-50 p-4 text-sm font-medium text-gray-700">
                <input type="checkbox" className="h-4 w-4 rounded border-gray-300" {...register(SETTING_KEYS.EXPORT_ENABLED)} disabled={isSaving} />
                Export Enabled Placeholder
              </label>
              <label className="flex items-center gap-3 rounded-lg border border-gray-200 bg-gray-50 p-4 text-sm font-medium text-gray-700">
                <input type="checkbox" className="h-4 w-4 rounded border-gray-300" {...register(SETTING_KEYS.NOTIFICATIONS_ENABLED)} disabled={isSaving} />
                Notifications Enabled Placeholder
              </label>
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

export default SystemSettings
