import { cn } from "../../utils/cn";

const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  disabled = false,
  className = '',
  ...props
}) => {
  const baseStyles =
    'inline-flex min-h-9 items-center justify-center gap-2 rounded-md font-semibold transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:pointer-events-none'

  const variants = {
    primary: 'bg-blue-700 text-white shadow-sm hover:bg-blue-800 focus:ring-blue-500',
    secondary: 'bg-gray-100 text-gray-800 hover:bg-gray-200 focus:ring-gray-500',
    danger: 'bg-red-600 text-white shadow-sm hover:bg-red-700 focus:ring-red-500',
    success: 'bg-green-600 text-white shadow-sm hover:bg-green-700 focus:ring-green-500',
    outline: 'border border-gray-300 bg-white text-gray-700 shadow-sm hover:bg-gray-50 focus:ring-gray-500',
    ghost: 'bg-transparent text-gray-700 hover:bg-gray-100 focus:ring-gray-500',
  }

  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-5 py-2.5 text-base',
  }

  const disabledStyles = disabled ? 'cursor-not-allowed opacity-60' : ''

  return (
    <button
      className={cn(baseStyles, variants[variant], sizes[size], disabledStyles, className)}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  )
}

export default Button
