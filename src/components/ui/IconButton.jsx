import { cn } from "../../utils/cn";

const IconButton = ({ children, label, className = "", ...props }) => {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={cn(
        "inline-flex h-10 w-10 items-center justify-center rounded-md border border-gray-200 bg-white text-gray-700 transition hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2",
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
};

export default IconButton;
