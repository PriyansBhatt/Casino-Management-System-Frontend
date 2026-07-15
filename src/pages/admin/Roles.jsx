import { useEffect, useState } from 'react'
import PageHeader from '../../components/layout/PageHeader'
import Card from '../../components/ui/Card'
import Badge from '../../components/ui/Badge'
import { getRoles, getUsers } from '../../api/adminApi'
import { ROLES } from '../../constants/roles'

const roleDetails = {
  [ROLES.SUPER_ADMIN]: ['Full system access', 'All modules'],
  [ROLES.DIRECTOR]: ['Management approvals, alerts, reports', 'Director, Reports, Audit'],
  [ROLES.ADMIN]: ['Admin and operational configuration', 'Admin, configuration, oversight'],
  [ROLES.RECEPTIONIST]: ['Customer registration and search', 'Reception'],
  [ROLES.CASHIER]: ['Buy-in, cash-out, wallet transactions', 'Cashier'],
  [ROLES.PIT_BOSS]: ['Table/session operations', 'Pit/Table'],
  [ROLES.STORE_KEEPER]: ['Store requests, stock, delivery', 'Store'],
  [ROLES.PROCUREMENT]: ['Procurement list, quotations, purchase orders', 'Procurement'],
  [ROLES.ACCOUNTS]: ['Bills, expenses, payments, accounts reports', 'Accounts'],
  [ROLES.DEPARTMENT_HEAD]: ['Department requests and received confirmation', 'Department'],
  [ROLES.AUDITOR]: ['Audit logs and reports', 'Audit'],
}

const Roles = () => {
  const [roles, setRoles] = useState([])
  const [users, setUsers] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const loadRoles = async () => {
      setIsLoading(true)
      setError('')
      try {
        const [roleData, userData] = await Promise.all([getRoles(), getUsers()])
        setRoles(roleData)
        setUsers(userData)
      } catch (err) {
        setError(err.message || 'Failed to load roles.')
      } finally {
        setIsLoading(false)
      }
    }

    loadRoles()
  }, [])

  const countUsers = (role) => users.filter((user) => user.role === role).length

  return (
    <div className="space-y-6">
      <PageHeader title="Roles" description="View system roles and module access." />

      <Card className="border-blue-200 bg-blue-50">
        <p className="text-sm text-blue-900">This page is view-only for now.</p>
      </Card>

      {error && <Card className="border-red-200 bg-red-50"><p className="text-sm text-red-700">{error}</p></Card>}

      <Card className="overflow-hidden p-0">
        {isLoading && <p className="p-6 text-sm text-gray-600">Loading roles...</p>}
        {!isLoading && roles.length > 0 && (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {['Role Name', 'Description', 'Main Module Access', 'User Count'].map((header) => (
                    <th key={header} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">{header}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {roles.map((role) => (
                  <tr key={role.role} className="hover:bg-gray-50">
                    <td className="whitespace-nowrap px-4 py-3"><Badge variant="info">{role.role}</Badge></td>
                    <td className="px-4 py-3 text-sm text-gray-700">{roleDetails[role.role]?.[0] || role.description}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">{roleDetails[role.role]?.[1] || 'General access'}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm font-semibold text-gray-900">{countUsers(role.role)}</td>
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

export default Roles
