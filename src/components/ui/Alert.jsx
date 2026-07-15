import { cn } from '../../utils/cn'

const variants = {
  info: 'border-blue-200 bg-blue-50 text-blue-900',
  success: 'border-green-200 bg-green-50 text-green-900',
  warning: 'border-amber-200 bg-amber-50 text-amber-900',
  danger: 'border-red-200 bg-red-50 text-red-900',
}

const Alert = ({ variant = 'info', title, children, className = '' }) => {
  return (
    <div className={cn('rounded-lg border p-4 text-sm shadow-sm', variants[variant], className)}>
      {title && <p className="font-semibold">{title}</p>}
      {children && <div className={title ? 'mt-1' : ''}>{children}</div>}
    </div>
  )
}

export default Alert
