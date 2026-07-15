import { forwardRef } from 'react'

const Input = forwardRef(
  (
    {
      type = 'text',
      placeholder = '',
      label = '',
      error = '',
      disabled = false,
      className = '',
      ...props
    },
    ref
  ) => {
    const baseStyles =
      'w-full rounded-lg border px-3 py-2 text-sm text-gray-900 shadow-sm transition-colors duration-200 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-0'

    const errorStyles = error
      ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20'
      : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500/20'

    const disabledStyles = disabled ? 'bg-gray-100 cursor-not-allowed opacity-75' : 'bg-white'

    return (
      <div className="w-full">
        {label && (
          <label className="mb-2 block text-sm font-medium text-gray-700">
            {label}
            {props.required && <span className="ml-1 text-red-500">*</span>}
          </label>
        )}
        <input
          ref={ref}
          type={type}
          placeholder={placeholder}
          disabled={disabled}
          className={`${baseStyles} ${errorStyles} ${disabledStyles} ${className}`}
          {...props}
        />
        {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
      </div>
    )
  }
)

Input.displayName = 'Input'

export default Input
