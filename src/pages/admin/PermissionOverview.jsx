import { useEffect, useState } from 'react'
import PageHeader from '../../components/layout/PageHeader'
import Card from '../../components/ui/Card'
import Badge from '../../components/ui/Badge'
import { getPermissionOverview } from '../../api/adminApi'
import MENU_ITEMS from '../../constants/menuItems'

const PermissionOverview = () => {
  const [permissions, setPermissions] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const loadPermissions = async () => {
      setIsLoading(true)
      setError('')
      try {
        setPermissions(await getPermissionOverview())
      } catch (err) {
        setError(err.message || 'Failed to load permission overview.')
      } finally {
        setIsLoading(false)
      }
    }

    loadPermissions()
  }, [])

  const getPageLabel = (path) => {
    const menuItem = MENU_ITEMS.find((item) => item.path === path)
    if (menuItem) return menuItem.label

    return path
      .split('/')
      .filter(Boolean)
      .join(' ')
      .split('-')
      .join(' ')
      .replace(/\b\w/g, (letter) => letter.toUpperCase())
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Permission Overview" description="Review frontend route permissions by role." />

      <Card className="border-amber-200 bg-amber-50">
        <p className="text-sm text-amber-900">
          This is a frontend permission overview. Final enforcement must also be done in backend APIs.
        </p>
      </Card>

      {error && <Card className="border-red-200 bg-red-50"><p className="text-sm text-red-700">{error}</p></Card>}

      <Card className="overflow-hidden p-0">
        {isLoading && <p className="p-6 text-sm text-gray-600">Loading permission overview...</p>}
        {!isLoading && permissions.length === 0 && <p className="p-6 text-sm text-gray-600">No permissions found.</p>}
        {permissions.length > 0 && (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {['Module/Page', 'Route', 'Allowed Roles'].map((header) => (
                    <th key={header} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">{header}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {permissions.map((permission) => (
                  <tr key={permission.path} className="hover:bg-gray-50">
                    <td className="whitespace-nowrap px-4 py-3 text-sm font-semibold text-gray-900">{getPageLabel(permission.path)}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-700">{permission.path}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-2">
                        {(permission.allowedRoles || []).map((role) => (
                          <Badge key={role} variant="info">{role}</Badge>
                        ))}
                      </div>
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

export default PermissionOverview
