import { useCallback, useEffect, useState } from 'react'
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
import { ROLES } from '../../constants/roles'
import systemLockApi from '../../api/systemLockApi'
import { getErrorMessage } from '../../utils/errorUtils'

const SystemSettings = ({ lockOnly = false }) => {
  const { user } = useAuth()
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [lockStatus, setLockStatus] = useState(null)
  const [lockLoading, setLockLoading] = useState(true)
  const [lockSubmitting, setLockSubmitting] = useState(false)
  const [lockMessage, setLockMessage] = useState('')
  const [lockError, setLockError] = useState('')
  const [unlockReason, setUnlockReason] = useState('')
  const canManageSystemLock = user?.role === ROLES.SUPER_ADMIN

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

    if (!lockOnly) loadSettings()
  }, [reset, lockOnly])

  const loadLockStatus = useCallback(async () => {
    if (!canManageSystemLock) {
      setLockLoading(false)
      return
    }
    setLockLoading(true)
    setLockError('')
    setLockStatus(null)
    try {
      setLockStatus(await systemLockApi.getStatus())
    } catch (err) {
      setLockError(getErrorMessage(err) || 'System Lock status could not be loaded.')
    } finally {
      setLockLoading(false)
    }
  }, [canManageSystemLock])

  useEffect(() => { loadLockStatus() }, [loadLockStatus])

  const handleEmergencyUnlock = async () => {
    const reason = unlockReason.trim()
    setLockMessage('')
    setLockError('')
    if (!reason) {
      setLockError('Emergency unlock reason is required.')
      return
    }
    if (!window.confirm('Emergency unlock temporarily allows protected casino operations. This action will be audited.')) return
    setLockSubmitting(true)
    try {
      await systemLockApi.emergencyUnlock(reason)
      setUnlockReason('')
      setLockMessage('Emergency unlock completed successfully.')
      await loadLockStatus()
    } catch (err) {
      setLockError(getErrorMessage(err) || 'Emergency unlock failed.')
    } finally {
      setLockSubmitting(false)
    }
  }

  const handleRelock = async () => {
    setLockMessage('')
    setLockError('')
    if (!window.confirm('Restore the System Lock now? Protected casino operations will be blocked.')) return
    setLockSubmitting(true)
    try {
      await systemLockApi.lock()
      setLockMessage('System Lock restored successfully.')
      await loadLockStatus()
    } catch (err) {
      setLockError(getErrorMessage(err) || 'System Lock could not be restored.')
    } finally {
      setLockSubmitting(false)
    }
  }

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
      <PageHeader title={lockOnly ? "System Lock" : "System Settings"} description={lockOnly ? "Authoritative System Lock and emergency access." : "Configure global casino operating thresholds and feature flags."} />

      {!lockOnly && <Card className="border-amber-200 bg-amber-50">
        <p className="text-sm font-semibold text-amber-900">Losing return review rule</p>
        <p className="mt-1 text-sm text-amber-900">
          Losing return eligibility must be reviewed using net verified customer loss, not gross buy-in or recycled winnings.
        </p>
        <p className="mt-2 text-sm text-amber-900">
          Example: If customer buys NPR 100,000, cashes out NPR 150,000, then buys in NPR 150,000 again and loses it,
          eligible net loss is NPR 100,000, not NPR 150,000.
        </p>
      </Card>}

      <Card>
        <div className="flex flex-col gap-3 border-b border-gray-200 pb-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-bold text-gray-900">System Lock &amp; Emergency Access</h2>
            <p className="mt-1 text-sm text-gray-600">Live backend status for protected casino operations.</p>
          </div>
          {lockStatus && <span className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${lockStatus.locked ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>{lockStatus.locked ? 'LOCKED' : 'UNLOCKED'}</span>}
        </div>

        {lockLoading && <p className="mt-5 text-sm text-gray-600">Loading System Lock status...</p>}
        {lockError && <div className="mt-5 rounded-lg border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">{lockError}</div>}
        {lockMessage && <div className="mt-5 rounded-lg border border-green-200 bg-green-50 p-4 text-sm font-medium text-green-700">{lockMessage}</div>}

        {!canManageSystemLock && !lockLoading && <div className="mt-5 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">System Lock management is restricted to SUPER_ADMIN.</div>}

        {lockStatus && <>
          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <LockDetail label="Business Date" value={lockStatus.businessDate}/>
            <LockDetail label="Lock Reason" value={lockStatus.lockReason}/>
            <LockDetail label="Scheduled Lock" value={`${lockStatus.lockStart || 'Unavailable'} – ${lockStatus.lockEnd || 'Unavailable'}`}/>
            <LockDetail label="Emergency Access" value={lockStatus.emergencyUnlockActive ? 'ACTIVE' : 'Inactive'}/>
            <LockDetail label="Emergency Expiry" value={formatDateTime(lockStatus.emergencyUnlockExpiry)}/>
            <LockDetail label="Emergency Actor" value={lockStatus.emergencyUnlockedBy}/>
            <LockDetail label="Emergency Reason" value={lockStatus.emergencyUnlockReason}/>
          </div>

          {canManageSystemLock && <div className="mt-6 border-t border-gray-200 pt-5">
            {lockStatus.locked ? <div className="space-y-4">
              <div><label htmlFor="emergencyUnlockReason" className="mb-2 block text-sm font-semibold text-gray-700">Emergency unlock reason</label><textarea id="emergencyUnlockReason" rows={3} maxLength={500} value={unlockReason} onChange={(event) => setUnlockReason(event.target.value)} disabled={lockSubmitting} className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100" placeholder="Explain why protected casino operations must be temporarily enabled"/></div>
              <Button type="button" variant="danger" onClick={handleEmergencyUnlock} disabled={lockSubmitting || !unlockReason.trim()}>{lockSubmitting ? 'Unlocking...' : 'Emergency Unlock'}</Button>
            </div> : <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><p className="text-sm text-gray-600">Protected operations are currently enabled.</p><Button type="button" variant="outline" onClick={handleRelock} disabled={lockSubmitting}>{lockSubmitting ? 'Restoring...' : 'Restore System Lock'}</Button></div>}
          </div>}
        </>}
      </Card>

      {!lockOnly && <>{isLoading && <Card><p className="text-sm text-gray-600">Loading settings...</p></Card>}
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
      )}</>}
    </div>
  )
}

const LockDetail = ({ label, value }) => <div className="rounded-lg border border-gray-200 bg-gray-50 p-4"><p className="text-xs font-bold uppercase tracking-wide text-gray-500">{label}</p><p className="mt-1 break-words text-sm font-semibold text-gray-900">{value || 'Unavailable'}</p></div>
const formatDateTime = (value) => value ? new Date(value).toLocaleString() : 'Unavailable'

export default SystemSettings
