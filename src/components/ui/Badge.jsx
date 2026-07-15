import { cn } from "../../utils/cn";

const variants = {
  default: "bg-gray-100 text-gray-700 ring-gray-200",
  neutral: "bg-gray-100 text-gray-700 ring-gray-200",
  success: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  warning: "bg-amber-50 text-amber-800 ring-amber-200",
  danger: "bg-red-50 text-red-700 ring-red-200",
  info: "bg-blue-50 text-blue-700 ring-blue-200",
};

const Badge = ({ children, variant = "default", className = "" }) => {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset",
        variants[variant] || variants.default,
        className
      )}
    >
      {children}
    </span>
  );
};

export default Badge;
