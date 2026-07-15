import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import PageHeader from '../../components/layout/PageHeader'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import Badge from '../../components/ui/Badge'
import { createStockItem, getStockItems } from '../../api/storeApi'
import { STOCK_STATUSES } from '../../constants/storeConstants'
import { getStockStatusBadgeVariant, isLowStock } from '../../utils/storeUtils'

const stockStatuses = Object.values(STOCK_STATUSES)

const StockManagement = () => {
  const [items, setItems] = useState([])
  const [filters, setFilters] = useState({ search: '', category: '', status: '' })
  const [showForm, setShowForm] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    defaultValues: {
      itemName: '',
      category: '',
      currentStock: '',
      minimumStock: '',
      unit: '',
      location: '',
      remarks: '',
    },
  })

  const loadStock = async () => {
    setIsLoading(true)
    setError('')

    try {
      const data = await getStockItems(filters)
      setItems(data)
    } catch (err) {
      setError(err.message || 'Failed to load stock items.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadStock()
  }, [filters])

  const updateFilter = (key, value) => {
    setFilters((current) => ({ ...current, [key]: value }))
  }

  const categories = Array.from(new Set(items.map((item) => item.category).filter(Boolean)))

  const onSubmit = async (data) => {
    setIsSubmitting(true)
    setMessage('')
    setError('')

    try {
      const item = await createStockItem({
        ...data,
        currentStock: Number(data.currentStock || 0),
        minimumStock: Number(data.minimumStock || 0),
      })
      setMessage(`${item.itemName} added to stock.`)
      reset()
      setShowForm(false)
      await loadStock()
    } catch (err) {
      setError(err.message || 'Failed to add stock item.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Stock Management"
        description="Monitor store stock, low stock levels, and item locations."
        actions={<Button onClick={() => setShowForm((value) => !value)}>{showForm ? 'Close Form' : 'Add Stock Item'}</Button>}
      />

      <Card>
        <div className="grid gap-4 md:grid-cols-3">
          <Input label="Search Item" value={filters.search} onChange={(event) => updateFilter('search', event.target.value)} placeholder="Code, item, category" />
          <Input label="Category" value={filters.category} onChange={(event) => updateFilter('category', event.target.value)} placeholder="Enter category" list="stock-categories" />
          <datalist id="stock-categories">
            {categories.map((category) => <option key={category} value={category} />)}
          </datalist>
          <div>
            <label htmlFor="stockStatus" className="mb-2 block text-sm font-medium text-gray-700">Stock Status</label>
            <select id="stockStatus" value={filters.status} onChange={(event) => updateFilter('status', event.target.value)} className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">All statuses</option>
              {stockStatuses.map((status) => <option key={status} value={status}>{status}</option>)}
            </select>
          </div>
        </div>
      </Card>

      {showForm && (
        <Card>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-900">Add Stock Item</h2>
            <div className="grid gap-4 md:grid-cols-3">
              <Input label="Item Name" required {...register('itemName', { required: 'Item name is required' })} error={errors.itemName?.message} disabled={isSubmitting} />
              <Input label="Category" required {...register('category', { required: 'Category is required' })} error={errors.category?.message} disabled={isSubmitting} />
              <Input label="Current Stock" type="number" min="0" required {...register('currentStock', { required: 'Current stock is required', min: { value: 0, message: 'Current stock must be 0 or more' } })} error={errors.currentStock?.message} disabled={isSubmitting} />
              <Input label="Minimum Stock" type="number" min="0" required {...register('minimumStock', { required: 'Minimum stock is required', min: { value: 0, message: 'Minimum stock must be 0 or more' } })} error={errors.minimumStock?.message} disabled={isSubmitting} />
              <Input label="Unit" required {...register('unit', { required: 'Unit is required' })} error={errors.unit?.message} disabled={isSubmitting} />
              <Input label="Location" required {...register('location', { required: 'Location is required' })} error={errors.location?.message} disabled={isSubmitting} />
              <div className="md:col-span-3">
                <label htmlFor="remarks" className="mb-2 block text-sm font-medium text-gray-700">Remarks</label>
                <textarea id="remarks" rows={3} disabled={isSubmitting} {...register('remarks')} className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <Button type="button" variant="secondary" onClick={() => setShowForm(false)} disabled={isSubmitting}>Cancel</Button>
              <Button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Saving...' : 'Save Item'}</Button>
            </div>
          </form>
        </Card>
      )}

      {message && <Card className="border-green-200 bg-green-50"><p className="text-sm text-green-700">{message}</p></Card>}
      {error && <Card className="border-red-200 bg-red-50"><p className="text-sm text-red-700">{error}</p></Card>}

      <Card className="overflow-hidden p-0">
        {isLoading && <p className="p-6 text-sm text-gray-600">Loading stock items...</p>}
        {!isLoading && !error && items.length === 0 && (
          <div className="p-6 text-center">
            <p className="font-semibold text-gray-900">No stock items found.</p>
            <p className="mt-1 text-sm text-gray-600">Add a stock item to begin tracking store inventory.</p>
          </div>
        )}
        {!isLoading && items.length > 0 && (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {['Item Code', 'Item Name', 'Category', 'Current Stock', 'Minimum Stock', 'Unit', 'Location', 'Status', 'Remarks'].map((header) => (
                    <th key={header} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">{header}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {items.map((item) => (
                  <tr key={item.id} className={isLowStock(item) ? 'bg-amber-50/40' : 'hover:bg-gray-50'}>
                    <td className="whitespace-nowrap px-4 py-3 text-sm font-semibold text-gray-900">{item.itemCode}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-700">{item.itemName}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-700">{item.category}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-700">
                      {item.currentStock}
                      {isLowStock(item) && <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-700">Low</span>}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-700">{item.minimumStock}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-700">{item.unit}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-700">{item.location}</td>
                    <td className="whitespace-nowrap px-4 py-3"><Badge variant={getStockStatusBadgeVariant(item.status)}>{item.status}</Badge></td>
                    <td className="px-4 py-3 text-sm text-gray-700">{item.remarks || 'Not available'}</td>
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

export default StockManagement
