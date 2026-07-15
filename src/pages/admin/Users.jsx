import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import PageHeader from '../../components/layout/PageHeader'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import Badge from '../../components/ui/Badge'
import ConfirmDialog from '../../components/ui/ConfirmDialog'
import EmptyState from '../../components/ui/EmptyState'
import TableToolbar from '../../components/ui/TableToolbar'
import useAuth from '../../hooks/useAuth'
import useToast from '../../hooks/useToast'
import { createUser, getDepartments, getUsers, toggleUserStatus, updateUser } from '../../api/adminApi'
import { ROLES } from '../../constants/roles'
import { USER_STATUSES } from '../../constants/adminConstants'
import { getUserStatusBadgeVariant } from '../../utils/adminUtils'
import { formatDateTime } from '../../utils/customerUtils'
import { safeLogAuditEvent } from '../../services/auditService'
import { AUDIT_ACTIONS, AUDIT_MODULES, AUDIT_SEVERITY } from '../../constants/auditConstants'
import { getErrorMessage } from '../../utils/errorUtils'

const roles = Object.values(ROLES)
const statuses = Object.values(USER_STATUSES)

const Users = () => {
  const { user } = useAuth()
  const { showToast } = useToast()
  const [users, setUsers] = useState([])
  const [departments, setDepartments] = useState([])
  const [filters, setFilters] = useState({ role: '', department: '', status: '', search: '' })
  const [editingUser, setEditingUser] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [pendingStatusUser, setPendingStatusUser] = useState(null)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    defaultValues: {
      fullName: '',
      username: '',
      email: '',
      phone: '',
      role: ROLES.CASHIER,
      department: '',
      status: USER_STATUSES.ACTIVE,
    },
  })

  const loadData = async () => {
    setIsLoading(true)
    setError('')
    try {
      const [userData, departmentData] = await Promise.all([
        getUsers(filters),
        getDepartments(),
      ])
      setUsers(userData)
      setDepartments(departmentData)
    } catch (err) {
      const message = getErrorMessage(err)
      setError(message)
      showToast({ type: 'error', title: 'Users Failed to Load', message })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [filters])

  const updateFilter = (key, value) => {
    setFilters((current) => ({ ...current, [key]: value }))
  }

  const resetFilters = () => {
    setFilters({ role: '', department: '', status: '', search: '' })
  }

  const openCreateForm = () => {
    setEditingUser(null)
    reset({
      fullName: '',
      username: '',
      email: '',
      phone: '',
      role: ROLES.CASHIER,
      department: departments[0]?.name || '',
      status: USER_STATUSES.ACTIVE,
    })
    setShowForm(true)
  }

  const openEditForm = (adminUser) => {
    setEditingUser(adminUser)
    reset({
      fullName: adminUser.fullName || '',
      username: adminUser.username || '',
      email: adminUser.email || '',
      phone: adminUser.phone || '',
      role: adminUser.role || ROLES.CASHIER,
      department: adminUser.department || '',
      status: adminUser.status || USER_STATUSES.ACTIVE,
    })
    setShowForm(true)
  }

  const onSubmit = async (data) => {
    setIsSaving(true)
    setMessage('')
    setError('')

    try {
      if (editingUser) {
        await updateUser(editingUser.id, data)
        setMessage('User updated successfully.')
        showToast({ type: 'success', title: 'User Updated', message: data.username })
      } else {
        const created = await createUser(data)
        safeLogAuditEvent({
          module: AUDIT_MODULES.ADMIN,
          action: AUDIT_ACTIONS.CREATE,
          severity: AUDIT_SEVERITY.HIGH,
          description: `Admin user ${created.username} created.`,
          performedBy: user?.fullName || user?.username,
          performedByRole: user?.role,
          entityType: 'ADMIN_USER',
          entityId: created.id,
          newValue: created,
        })
        setMessage('User created successfully.')
        showToast({ type: 'success', title: 'User Created', message: created.username })
      }
      setShowForm(false)
      setEditingUser(null)
      await loadData()
    } catch (err) {
      const message = getErrorMessage(err)
      setError(message)
      showToast({ type: 'error', title: 'Save User Failed', message })
    } finally {
      setIsSaving(false)
    }
  }

  const handleToggleStatus = async (adminUser) => {
    const nextStatus =
      adminUser.status === USER_STATUSES.ACTIVE ? USER_STATUSES.INACTIVE : USER_STATUSES.ACTIVE
    setIsSaving(true)
    setMessage('')
    setError('')

    try {
      const updated = await toggleUserStatus(adminUser.id, { status: nextStatus })
      safeLogAuditEvent({
        module: AUDIT_MODULES.ADMIN,
        action: AUDIT_ACTIONS.UPDATE,
        severity: AUDIT_SEVERITY.HIGH,
        description: `Admin user ${adminUser.username} status changed to ${nextStatus}.`,
        performedBy: user?.fullName || user?.username,
        performedByRole: user?.role,
        entityType: 'ADMIN_USER',
        entityId: adminUser.id,
        oldValue: { status: adminUser.status },
        newValue: updated,
      })
      setMessage(`User ${nextStatus === USER_STATUSES.ACTIVE ? 'activated' : 'deactivated'}.`)
      showToast({
        type: 'success',
        title: nextStatus === USER_STATUSES.ACTIVE ? 'User Activated' : 'User Deactivated',
        message: adminUser.username,
      })
      setPendingStatusUser(null)
      await loadData()
    } catch (err) {
      const message = getErrorMessage(err)
      setError(message)
      showToast({ type: 'error', title: 'User Status Failed', message })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Users"
        description="Manage frontend mock users for role and module testing."
        actions={<Button onClick={openCreateForm}>Create User</Button>}
      />

      <Card className="border-blue-200 bg-blue-50">
        <p className="text-sm text-blue-900">
          Password management will be connected to backend authentication later.
        </p>
      </Card>

      <TableToolbar
        title="User Filters"
        description="Filter mock users by role, department, status, or username."
        onReset={resetFilters}
      >
        <div className="grid gap-4 md:grid-cols-4">
          <div>
            <label htmlFor="roleFilter" className="mb-2 block text-sm font-medium text-gray-700">Role</label>
            <select id="roleFilter" value={filters.role} onChange={(event) => updateFilter('role', event.target.value)} className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">All roles</option>
              {roles.map((role) => <option key={role} value={role}>{role}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="departmentFilter" className="mb-2 block text-sm font-medium text-gray-700">Department</label>
            <select id="departmentFilter" value={filters.department} onChange={(event) => updateFilter('department', event.target.value)} className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">All departments</option>
              {departments.map((department) => <option key={department.id} value={department.name}>{department.name}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="statusFilter" className="mb-2 block text-sm font-medium text-gray-700">Status</label>
            <select id="statusFilter" value={filters.status} onChange={(event) => updateFilter('status', event.target.value)} className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">All statuses</option>
              {statuses.map((status) => <option key={status} value={status}>{status}</option>)}
            </select>
          </div>
          <Input label="Search" value={filters.search} onChange={(event) => updateFilter('search', event.target.value)} placeholder="Full name or username" />
        </div>
      </TableToolbar>

      {showForm && (
        <Card>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-900">{editingUser ? 'Edit User' : 'Create User'}</h2>
            <div className="grid gap-4 md:grid-cols-3">
              <Input label="Full Name" required {...register('fullName', { required: 'Full name is required' })} error={errors.fullName?.message} disabled={isSaving} />
              <Input label="Username" required {...register('username', { required: 'Username is required' })} error={errors.username?.message} disabled={isSaving} />
              <Input label="Email" type="email" {...register('email')} disabled={isSaving} />
              <Input label="Phone" {...register('phone')} disabled={isSaving} />
              <div>
                <label htmlFor="role" className="mb-2 block text-sm font-medium text-gray-700">Role <span className="text-red-500">*</span></label>
                <select id="role" {...register('role', { required: 'Role is required' })} disabled={isSaving} className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500">
                  {roles.map((role) => <option key={role} value={role}>{role}</option>)}
                </select>
              </div>
              <div>
                <label htmlFor="department" className="mb-2 block text-sm font-medium text-gray-700">Department <span className="text-red-500">*</span></label>
                <select id="department" {...register('department', { required: 'Department is required' })} disabled={isSaving} className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">Select department</option>
                  {departments.map((department) => <option key={department.id} value={department.name}>{department.name}</option>)}
                </select>
                {errors.department && <p className="mt-1 text-sm text-red-500">{errors.department.message}</p>}
              </div>
              <div>
                <label htmlFor="status" className="mb-2 block text-sm font-medium text-gray-700">Status</label>
                <select id="status" {...register('status')} disabled={isSaving} className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500">
                  {statuses.map((status) => <option key={status} value={status}>{status}</option>)}
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <Button type="button" variant="secondary" onClick={() => setShowForm(false)} disabled={isSaving}>Cancel</Button>
              <Button type="submit" disabled={isSaving}>{isSaving ? 'Saving...' : 'Save User'}</Button>
            </div>
          </form>
        </Card>
      )}

      {message && <Card className="border-green-200 bg-green-50"><p className="text-sm text-green-700">{message}</p></Card>}
      {error && <Card className="border-red-200 bg-red-50"><p className="text-sm text-red-700">{error}</p></Card>}

      <Card className="overflow-hidden p-0">
        {isLoading && <p className="p-6 text-sm text-gray-600">Loading users...</p>}
        {!isLoading && users.length === 0 && (
          <div className="p-6">
            <EmptyState
              title="No users found"
              description="No mock users match the selected filters."
              action={<Button variant="secondary" onClick={resetFilters}>Reset Filters</Button>}
            />
          </div>
        )}
        {users.length > 0 && (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {['Full Name', 'Username', 'Role', 'Department', 'Email', 'Phone', 'Status', 'Created At', 'Actions'].map((header) => (
                    <th key={header} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">{header}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {users.map((adminUser) => (
                  <tr key={adminUser.id} className="hover:bg-gray-50">
                    <td className="whitespace-nowrap px-4 py-3 text-sm font-semibold text-gray-900">{adminUser.fullName}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-700">{adminUser.username}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-700">{adminUser.role}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-700">{adminUser.department}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-700">{adminUser.email || 'Not available'}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-700">{adminUser.phone || 'Not available'}</td>
                    <td className="whitespace-nowrap px-4 py-3"><Badge variant={getUserStatusBadgeVariant(adminUser.status)}>{adminUser.status}</Badge></td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-700">{formatDateTime(adminUser.createdAt)}</td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <div className="flex flex-wrap gap-2">
                        <Button size="sm" variant="outline" onClick={() => openEditForm(adminUser)}>Edit User</Button>
                        <Button size="sm" variant={adminUser.status === USER_STATUSES.ACTIVE ? 'danger' : 'success'} onClick={() => adminUser.status === USER_STATUSES.ACTIVE ? setPendingStatusUser(adminUser) : handleToggleStatus(adminUser)} disabled={isSaving}>
                          {adminUser.status === USER_STATUSES.ACTIVE ? 'Deactivate' : 'Activate'}
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <ConfirmDialog
        isOpen={Boolean(pendingStatusUser)}
        title="Confirm User Deactivation"
        description={`Deactivate ${pendingStatusUser?.username || 'this user'}? They should not be able to use assigned modules while inactive.`}
        confirmLabel="Deactivate User"
        variant="danger"
        isLoading={isSaving}
        onConfirm={() => handleToggleStatus(pendingStatusUser)}
        onCancel={() => setPendingStatusUser(null)}
      />
    </div>
  )
}

export default Users
