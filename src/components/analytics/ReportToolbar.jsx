import Button from '../ui/Button'
import Input from '../ui/Input'

const ReportToolbar = ({
  businessDate,
  onBusinessDateChange,
  onExport,
  exportLabel = 'Export CSV',
  children,
}) => {
  return (
    <div className="flex flex-col gap-4 rounded-lg border border-gray-200 bg-white p-4 shadow-sm lg:flex-row lg:items-end lg:justify-between">
      <div className="grid flex-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Input
          label="Business Date"
          value={businessDate || ''}
          onChange={(event) => onBusinessDateChange?.(event.target.value)}
          placeholder="YYYY-MM-DD or ALL"
        />
        {children}
      </div>
      {onExport && (
        <Button type="button" variant="outline" onClick={onExport}>
          {exportLabel}
        </Button>
      )}
    </div>
  )
}

export default ReportToolbar
