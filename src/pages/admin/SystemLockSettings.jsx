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

const SystemLockSettings = () => {
  const { user } = useAuth()
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const { register, handleSubmit, reset } = useForm({
    defaultValues: {
      [SETTING_KEYS.SYSTEM_LOCK_START_TIME]: '06:30',
      [SETTING_KEYS.SYSTEM_LOCK_END_TIME]: '12:30',
      [SETTING_KEYS.SYSTEM_LOCK_REASON]: 'Settlement Period',
      [SETTING_KEYS.DIRECTOR_ADMIN_UNLOCK_REQUIRED]: true,
    },
  })

  useEffect(() => {
    const loadSettings = async () => {
      setIsLoading(true)
      setError('')
      try {
        const settings = await getSystemSettings()
        reset({
          [SETTING_KEYS.SYSTEM_LOCK_START_TIME]: settings[SETTING_KEYS.SYSTEM_LOCK_START_TIME] || '06:30',
          [SETTING_KEYS.SYSTEM_LOCK_END_TIME]: settings[SETTING_KEYS.SYSTEM_LOCK_END_TIME] || '12:30',
          [SETTING_KEYS.SYSTEM_LOCK_REASON]: settings[SETTING_KEYS.SYSTEM_LOCK_REASON] || 'Settlement Period',
          [SETTING_KEYS.DIRECTOR_ADMIN_UNLOCK_REQUIRED]: Boolean(settings[SETTING_KEYS.DIRECTOR_ADMIN_UNLOCK_REQUIRED]),
        })
      } catch (err) {
        setError(err.message || 'Failed to load system lock settings.')
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
        [SETTING_KEYS.DIRECTOR_ADMIN_UNLOCK_REQUIRED]: Boolean(data[SETTING_KEYS.DIRECTOR_ADMIN_UNLOCK_REQUIRED]),
      }
      const updated = await updateSystemSettings(payload)
      safeLogAuditEvent({
        module: AUDIT_MODULES.SYSTEM_LOCK,
        action: AUDIT_ACTIONS.UPDATE,
        severity: AUDIT_SEVERITY.HIGH,
        description: 'System lock settings updated.',
        performedBy: user?.fullName || user?.username,
        performedByRole: user?.role,
        entityType: 'SYSTEM_SETTINGS',
        entityId: 'SYSTEM_LOCK',
        newValue: payload,
      })
      reset(updated)
      setMessage('System lock settings saved successfully.')
    } catch (err) {
      setError(err.message || 'Failed to save system lock settings.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader title="System Lock Settings" description="Configure settlement lock timing and unlock rules." />

      <Card className="border-amber-200 bg-amber-50">
        <p className="text-sm text-amber-900">
          During system lock, sensitive transactions such as buy-in, cash-out, table open/close,
          delivery receive, and payments should be blocked unless an authorized unlock is approved.
        </p>
      </Card>

      {isLoading && <Card><p className="text-sm text-gray-600">Loading settings...</p></Card>}
      {message && <Card className="border-green-200 bg-green-50"><p className="text-sm text-green-700">{message}</p></Card>}
      {error && <Card className="border-red-200 bg-red-50"><p className="text-sm text-red-700">{error}</p></Card>}

      {!isLoading && (
        <Card>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div className="grid gap-4 md:grid-cols-2">
              <Input label="System Lock Start Time" type="time" {...register(SETTING_KEYS.SYSTEM_LOCK_START_TIME)} disabled={isSaving} />
              <Input label="System Lock End Time" type="time" {...register(SETTING_KEYS.SYSTEM_LOCK_END_TIME)} disabled={isSaving} />
              <Input label="Lock Reason" {...register(SETTING_KEYS.SYSTEM_LOCK_REASON)} disabled={isSaving} />
              <label className="flex items-center gap-3 rounded-lg border border-gray-200 bg-gray-50 p-4 text-sm font-medium text-gray-700">
                <input type="checkbox" className="h-4 w-4 rounded border-gray-300" {...register(SETTING_KEYS.DIRECTOR_ADMIN_UNLOCK_REQUIRED)} disabled={isSaving} />
                Director/Admin Unlock Required
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

export default SystemLockSettings
