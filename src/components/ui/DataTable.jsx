import { useEffect, useMemo, useState } from 'react'
import Card from './Card'
import EmptyState from './EmptyState'
import PageLoader from './PageLoader'
import Pagination from './Pagination'

const DataTable = ({
  columns = [],
  rows = [],
  loading = false,
  emptyMessage = 'No records found.',
  actions,
  pageSize = 10,
  enablePagination = true,
  rowKey = 'id',
}) => {
  const [page, setPage] = useState(1)
  const totalPages = Math.max(1, Math.ceil(rows.length / pageSize))

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages)
    }
  }, [page, totalPages])

  const visibleRows = useMemo(() => {
    if (!enablePagination) return rows
    const start = (page - 1) * pageSize
    return rows.slice(start, start + pageSize)
  }, [enablePagination, page, pageSize, rows])

  if (loading) {
    return (
      <Card>
        <PageLoader message="Loading records..." />
      </Card>
    )
  }

  return (
    <Card className="overflow-hidden p-0">
      {rows.length === 0 ? (
        <div className="p-6">
          <EmptyState title={emptyMessage} description="Adjust filters or add new records to continue." />
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {columns.map((column) => (
                    <th
                      key={column.key}
                      scope="col"
                      className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500"
                    >
                      {column.label}
                    </th>
                  ))}
                  {actions && (
                    <th scope="col" className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Actions
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {visibleRows.map((row, rowIndex) => (
                  <tr key={row[rowKey] || row.reference || rowIndex} className="transition-colors hover:bg-blue-50/40">
                    {columns.map((column) => (
                      <td key={column.key} className="px-4 py-3 text-sm text-gray-700">
                        {column.render ? column.render(row) : row[column.key] ?? 'Not available'}
                      </td>
                    ))}
                    {actions && <td className="whitespace-nowrap px-4 py-3">{actions(row)}</td>}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {enablePagination && rows.length > pageSize && (
            <Pagination page={page} pageSize={pageSize} total={rows.length} onPageChange={setPage} />
          )}
        </>
      )}
    </Card>
  )
}

export default DataTable
