import Card from '../ui/Card'
import { cn } from '../../utils/cn'

const variants = {
  default: 'border-gray-200 bg-white text-gray-900',
  success: 'border-green-200 bg-green-50 text-green-950',
  warning: 'border-yellow-200 bg-yellow-50 text-yellow-950',
  danger: 'border-red-200 bg-red-50 text-red-950',
  info: 'border-blue-200 bg-blue-50 text-blue-950',
}

const KpiCard = ({ title, value, description, icon, variant = 'default' }) => {
  return (
    <Card className={cn('border', variants[variant] || variants.default)}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium opacity-75">{title}</p>
          <p className="mt-2 text-2xl font-bold">{value ?? 'Not available'}</p>
          {description && <p className="mt-2 text-sm opacity-75">{description}</p>}
        </div>
        {icon && <div className="text-2xl">{icon}</div>}
      </div>
    </Card>
  )
}

export default KpiCard
