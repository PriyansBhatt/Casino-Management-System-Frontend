import Button from './Button'
import { cn } from '../../utils/cn'

const variantStyles = {
  default: 'border-blue-200',
  danger: 'border-red-200',
  warning: 'border-amber-200',
  success: 'border-green-200',
}

const confirmVariants = {
  default: 'primary',
  danger: 'danger',
  warning: 'primary',
  success: 'success',
}

const ConfirmDialog = ({
  isOpen,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'default',
  onConfirm,
  onCancel,
  isLoading = false,
}) => {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className={cn('w-full max-w-md rounded-lg border bg-white p-6 shadow-xl', variantStyles[variant])}>
        <h2 className="text-lg font-semibold text-gray-900">{title || 'Confirm action'}</h2>
        {description && <p className="mt-2 text-sm text-gray-600">{description}</p>}
        <div className="mt-6 flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
            {cancelLabel}
          </Button>
          <Button
            type="button"
            variant={confirmVariants[variant] || confirmVariants.default}
            onClick={onConfirm}
            disabled={isLoading}
          >
            {isLoading ? 'Processing...' : confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  )
}

export default ConfirmDialog
