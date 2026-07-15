import Button from './Button'
import Card from './Card'

const TableToolbar = ({ title, description, children, onReset, resetLabel = 'Reset Filters' }) => {
  return (
    <Card>
      <div className="flex flex-col gap-4">
        {(title || description || onReset) && (
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              {title && <h2 className="text-base font-semibold text-gray-900">{title}</h2>}
              {description && <p className="mt-1 text-sm text-gray-600">{description}</p>}
            </div>
            {onReset && (
              <Button type="button" variant="secondary" onClick={onReset}>
                {resetLabel}
              </Button>
            )}
          </div>
        )}
        {children}
      </div>
    </Card>
  )
}

export default TableToolbar
