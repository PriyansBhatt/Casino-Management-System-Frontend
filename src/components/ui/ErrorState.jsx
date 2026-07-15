import Button from './Button'

const ErrorState = ({
  title = 'Something went wrong',
  description = 'Please try again.',
  onRetry,
}) => {
  return (
    <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-center">
      <h3 className="text-base font-semibold text-red-900">{title}</h3>
      {description && <p className="mt-2 text-sm text-red-700">{description}</p>}
      {onRetry && (
        <div className="mt-5">
          <Button type="button" variant="danger" onClick={onRetry}>
            Retry
          </Button>
        </div>
      )}
    </div>
  )
}

export default ErrorState
