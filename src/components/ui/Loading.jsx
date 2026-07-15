const Loading = ({ message = 'Loading...', size = 'md' }) => {
  const sizeStyles = {
    sm: 'w-6 h-6',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
  }

  return (
    <div className="flex flex-col items-center justify-center h-full min-h-96">
      <div className={`${sizeStyles[size]} border-4 border-gray-200 border-t-blue-600 rounded-full animate-spin`}></div>
      {message && <p className="mt-4 text-gray-600 text-lg">{message}</p>}
    </div>
  )
}

export default Loading
