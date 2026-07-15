import { cn } from '../../utils/cn'

const variants = {
  success: 'border-green-200 bg-green-50 text-green-900',
  error: 'border-red-200 bg-red-50 text-red-900',
  warning: 'border-amber-200 bg-amber-50 text-amber-900',
  info: 'border-blue-200 bg-blue-50 text-blue-900',
}

const Toast = ({ toast, onClose }) => {
  return (
    <div className={cn('rounded-lg border p-4 shadow-lg', variants[toast.type] || variants.info)}>
      <div className="flex items-start justify-between gap-4">
        <div>
          {toast.title && <p className="text-sm font-semibold">{toast.title}</p>}
          {toast.message && <p className="mt-1 text-sm opacity-90">{toast.message}</p>}
        </div>
        <button
          type="button"
          onClick={() => onClose(toast.id)}
          className="rounded px-2 text-sm font-semibold opacity-70 hover:opacity-100"
          aria-label="Close notification"
        >
          x
        </button>
      </div>
    </div>
  )
}

export default Toast
