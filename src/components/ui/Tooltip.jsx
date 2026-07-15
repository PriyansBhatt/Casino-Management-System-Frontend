const Tooltip = ({ label, children }) => {
  return (
    <span className="group relative inline-flex">
      {children}
      {label && (
        <span className="pointer-events-none absolute bottom-full left-1/2 z-20 mb-2 hidden -translate-x-1/2 whitespace-nowrap rounded bg-gray-900 px-2 py-1 text-xs text-white shadow group-hover:block">
          {label}
        </span>
      )}
    </span>
  )
}

export default Tooltip
