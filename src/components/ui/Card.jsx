import { cn } from "../../utils/cn";

const Card = ({ children, className = '', onClick = null, hoverable = false }) => {
  const baseStyles = 'rounded-lg border border-gray-200 bg-white p-5 shadow-sm sm:p-6'
  const hoverStyles = hoverable ? 'transition hover:border-blue-200 hover:shadow-md cursor-pointer' : ''
  const clickableStyles = onClick ? 'cursor-pointer' : ''

  return (
    <div className={cn(baseStyles, hoverStyles, clickableStyles, className)} onClick={onClick}>
      {children}
    </div>
  )
}

export default Card
