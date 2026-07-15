const EmptyState = ({ title = 'No data found', description, action }) => {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-gray-300 bg-gray-50/70 p-8 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-xs font-semibold text-gray-500 ring-1 ring-gray-200">
        None
      </div>
      <h3 className="mt-4 text-base font-semibold text-gray-900">{title}</h3>
      {description && <p className="mt-2 max-w-md text-sm text-gray-600">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}

export default EmptyState
