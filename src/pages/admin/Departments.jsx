import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import PageHeader from '../../components/layout/PageHeader'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import Badge from '../../components/ui/Badge'
import useAuth from '../../hooks/useAuth'
import { createDepartment, getDepartments, updateDepartment } from '../../api/adminApi'
import { DEPARTMENT_TYPES, USER_STATUSES } from '../../constants/adminConstants'
import { getDepartmentTypeBadgeVariant, getUserStatusBadgeVariant } from '../../utils/adminUtils'
import { formatDateTime } from '../../utils/customerUtils'
import { safeLogAuditEvent } from '../../services/auditService'
import { AUDIT_ACTIONS, AUDIT_MODULES, AUDIT_SEVERITY } from '../../constants/auditConstants'

const departmentTypes = Object.values(DEPARTMENT_TYPES)
const statuses = [USER_STATUSES.ACTIVE, USER_STATUSES.INACTIVE]

const Departments = () => {
  const { user } = useAuth()
  const [departments, setDepartments] = useState([])
  const [editingDepartment, setEditingDepartment] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    defaultValues: {
      name: '',
      type: DEPARTMENT_TYPES.OTHER,
      headName: '',
      status: USER_STATUSES.ACTIVE,
      remarks: '',
    },
  })

  const loadDepartments = async () => {
    setIsLoading(true)
    setError('')
    try {
      setDepartments(await getDepartments())
    } catch (err) {
      setError(err.message || 'Failed to load departments.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadDepartments()
  }, [])

  const openCreateForm = () => {
    setEditingDepartment(null)
    reset({ name: '', type: DEPARTMENT_TYPES.OTHER, headName: '', status: USER_STATUSES.ACTIVE, remarks: '' })
    setShowForm(true)
  }

  const openEditForm = (department) => {
    setEditingDepartment(department)
    reset({
      name: department.name || '',
      type: department.type || DEPARTMENT_TYPES.OTHER,
      headName: department.headName || '',
      status: department.status || USER_STATUSES.ACTIVE,
      remarks: department.remarks || '',
    })
    setShowForm(true)
  }

  const onSubmit = async (data) => {
    setIsSaving(true)
    setMessage('')
    setError('')

    try {
      if (editingDepartment) {
        const updated = await updateDepartment(editingDepartment.id, data)
        safeLogAuditEvent({
          module: AUDIT_MODULES.ADMIN,
          action: AUDIT_ACTIONS.UPDATE,
          severity: AUDIT_SEVERITY.MEDIUM,
          description: `Department ${updated.name} updated.`,
          performedBy: user?.fullName || user?.username,
          performedByRole: user?.role,
          entityType: 'DEPARTMENT',
          entityId: updated.id,
          oldValue: editingDepartment,
          newValue: updated,
        })
        setMessage('Department updated successfully.')
      } else {
        const created = await createDepartment(data)
        safeLogAuditEvent({
          module: AUDIT_MODULES.ADMIN,
          action: AUDIT_ACTIONS.CREATE,
          severity: AUDIT_SEVERITY.MEDIUM,
          description: `Department ${created.name} created.`,
          performedBy: user?.fullName || user?.username,
          performedByRole: user?.role,
          entityType: 'DEPARTMENT',
          entityId: created.id,
          newValue: created,
        })
        setMessage('Department created successfully.')
      }
      setShowForm(false)
      setEditingDepartment(null)
      await loadDepartments()
    } catch (err) {
      setError(err.message || 'Failed to save department.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Departments"
        description="Manage casino department configuration."
        actions={<Button onClick={openCreateForm}>Create Department</Button>}
      />

      {showForm && (
        <Card>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-900">{editingDepartment ? 'Edit Department' : 'Create Department'}</h2>
            <div className="grid gap-4 md:grid-cols-3">
              <Input label="Department Name" required {...register('name', { required: 'Department name is required' })} error={errors.name?.message} disabled={isSaving} />
              <div>
                <label htmlFor="type" className="mb-2 block text-sm font-medium text-gray-700">Department Type <span className="text-red-500">*</span></label>
                <select id="type" {...register('type', { required: 'Department type is required' })} disabled={isSaving} className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500">
                  {departmentTypes.map((type) => <option key={type} value={type}>{type}</option>)}
                </select>
              </div>
              <Input label="Head Name" {...register('headName')} disabled={isSaving} />
              <div>
                <label htmlFor="status" className="mb-2 block text-sm font-medium text-gray-700">Status</label>
                <select id="status" {...register('status')} disabled={isSaving} className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500">
                  {statuses.map((status) => <option key={status} value={status}>{status}</option>)}
                </select>
              </div>
              <div className="md:col-span-2">
                <label htmlFor="remarks" className="mb-2 block text-sm font-medium text-gray-700">Remarks</label>
                <textarea id="remarks" rows={3} {...register('remarks')} disabled={isSaving} className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <Button type="button" variant="secondary" onClick={() => setShowForm(false)} disabled={isSaving}>Cancel</Button>
              <Button type="submit" disabled={isSaving}>{isSaving ? 'Saving...' : 'Save Department'}</Button>
            </div>
          </form>
        </Card>
      )}

      {message && <Card className="border-green-200 bg-green-50"><p className="text-sm text-green-700">{message}</p></Card>}
      {error && <Card className="border-red-200 bg-red-50"><p className="text-sm text-red-700">{error}</p></Card>}

      <Card className="overflow-hidden p-0">
        {isLoading && <p className="p-6 text-sm text-gray-600">Loading departments...</p>}
        {!isLoading && departments.length === 0 && <p className="p-6 text-sm text-gray-600">No departments found.</p>}
        {departments.length > 0 && (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {['Department Name', 'Department Type', 'Head Name', 'Status', 'Remarks', 'Created At', 'Actions'].map((header) => (
                    <th key={header} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">{header}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {departments.map((department) => (
                  <tr key={department.id} className="hover:bg-gray-50">
                    <td className="whitespace-nowrap px-4 py-3 text-sm font-semibold text-gray-900">{department.name}</td>
                    <td className="whitespace-nowrap px-4 py-3"><Badge variant={getDepartmentTypeBadgeVariant(department.type)}>{department.type}</Badge></td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-700">{department.headName || 'Not assigned'}</td>
                    <td className="whitespace-nowrap px-4 py-3"><Badge variant={getUserStatusBadgeVariant(department.status)}>{department.status}</Badge></td>
                    <td className="px-4 py-3 text-sm text-gray-700">{department.remarks || 'Not available'}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-700">{formatDateTime(department.createdAt)}</td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <Button size="sm" variant="outline" onClick={() => openEditForm(department)}>Edit Department</Button>
                    </td>
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

export default Departments
