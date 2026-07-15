import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import PageHeader from '../../components/layout/PageHeader'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Badge from '../../components/ui/Badge'
import { getCustomerById } from '../../api/customerApi'
import {
  formatDateTime,
  getRiskBadgeVariant,
  getStatusBadgeVariant,
} from '../../utils/customerUtils'

const fieldGroups = [
  [
    ['Customer Code', 'customerCode'],
    ['Full Name', 'fullName'],
    ['Phone', 'phone'],
    ['Email', 'email'],
    ['Nationality', 'nationality'],
    ['Gender', 'gender'],
  ],
  [
    ['Document Type', 'documentType'],
    ['Document Number', 'documentNumber'],
    ['Date of Birth', 'dateOfBirth'],
    ['Address', 'address'],
    ['Remarks', 'remarks'],
  ],
]

const CustomerProfile = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [customer, setCustomer] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const loadCustomer = async () => {
      setIsLoading(true)
      setError('')

      try {
        const data = await getCustomerById(id)
        setCustomer(data)
      } catch (err) {
        setError(err.message || 'Failed to load customer.')
      } finally {
        setIsLoading(false)
      }
    }

    loadCustomer()
  }, [id])

  if (isLoading) {
    return <Card>Loading customer profile...</Card>
  }

  if (error) {
    return (
      <Card className="border-red-200 bg-red-50">
        <p className="text-sm font-medium text-red-700">{error}</p>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={customer.fullName}
        description={`Customer profile for ${customer.customerCode}`}
        actions={
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => navigate('/reception/customers/search')}>
              Back to Search
            </Button>
            <Button onClick={() => navigate(`/reception/customers/${customer.id}/edit`)}>
              Edit Customer
            </Button>
          </div>
        }
      />

      <Card>
        <div className="flex flex-wrap items-center gap-3">
          <Badge variant={getStatusBadgeVariant(customer.status)}>{customer.status}</Badge>
          <Badge variant={getRiskBadgeVariant(customer.riskLevel)}>{customer.riskLevel}</Badge>
          <Button disabled title="Cashier module will handle buy-in in later phase">
            Start Buy-In
          </Button>
          <span className="text-sm text-gray-500">
            Cashier module will handle buy-in in later phase
          </span>
        </div>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        {fieldGroups.map((fields, index) => (
          <Card key={index}>
            <div className="divide-y divide-gray-100">
              {fields.map(([label, key]) => (
                <div key={key} className="grid gap-1 py-3 sm:grid-cols-3 sm:gap-4">
                  <p className="text-sm font-medium text-gray-500">{label}</p>
                  <p className="text-sm font-semibold text-gray-900 sm:col-span-2">
                    {customer[key] || 'Not available'}
                  </p>
                </div>
              ))}
            </div>
          </Card>
        ))}
      </div>

      <Card>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <p className="text-sm font-medium text-gray-500">Created At</p>
            <p className="mt-1 text-sm font-semibold text-gray-900">
              {formatDateTime(customer.createdAt)}
            </p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Updated At</p>
            <p className="mt-1 text-sm font-semibold text-gray-900">
              {formatDateTime(customer.updatedAt)}
            </p>
          </div>
        </div>
      </Card>
    </div>
  )
}

export default CustomerProfile
