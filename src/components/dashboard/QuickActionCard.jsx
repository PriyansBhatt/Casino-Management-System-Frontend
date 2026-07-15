import { useNavigate } from 'react-router-dom'

const QuickActionCard = ({ title, description, path, icon }) => {
  const navigate = useNavigate()

  return (
    <button
      type="button"
      onClick={() => navigate(path)}
      className="w-full rounded-lg border border-gray-200 bg-white p-5 text-left shadow-sm transition hover:border-blue-300 hover:bg-blue-50 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
    >
      <div className="flex items-start gap-4">
        {icon && (
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-blue-100 text-sm font-bold text-blue-700">
            {icon}
          </div>
        )}
        <div className="min-w-0">
          <p className="font-semibold text-gray-900">{title}</p>
          {description && <p className="mt-1 text-sm text-gray-600">{description}</p>}
        </div>
      </div>
    </button>
  )
}

export default QuickActionCard
