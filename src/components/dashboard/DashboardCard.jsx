import { cn } from '../../utils/cn'

const variants = {
  default: 'border-gray-200 bg-white text-gray-900',
  success: 'border-green-200 bg-green-50 text-green-900',
  warning: 'border-amber-200 bg-amber-50 text-amber-900',
  danger: 'border-red-200 bg-red-50 text-red-900',
  info: 'border-blue-200 bg-blue-50 text-blue-900',
}

const iconVariants = {
  default: 'bg-gray-100 text-gray-700',
  success: 'bg-green-100 text-green-700',
  warning: 'bg-amber-100 text-amber-700',
  danger: 'bg-red-100 text-red-700',
  info: 'bg-blue-100 text-blue-700',
}

const DashboardCard = ({
  title,
  value,
  description,
  icon,
  variant = 'default',
  footer,
}) => {
  return (
    <div className={cn('rounded-lg border p-5 shadow-sm transition hover:shadow-md', variants[variant] || variants.default)}>
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm font-medium opacity-75">{title}</p>
          <p className="mt-2 break-words text-2xl font-bold">{value}</p>
        </div>
        {icon && (
          <div
            className={cn(
              'flex h-10 w-10 shrink-0 items-center justify-center rounded-md text-sm font-bold',
              iconVariants[variant] || iconVariants.default
            )}
          >
            {icon}
          </div>
        )}
      </div>

      {description && <p className="mt-3 text-sm opacity-80">{description}</p>}
      {footer && <div className="mt-4 border-t border-current/10 pt-3 text-xs opacity-75">{footer}</div>}
    </div>
  )
}

export default DashboardCard
