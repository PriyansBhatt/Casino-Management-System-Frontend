import { Link, useLocation } from "react-router-dom";

const labelFromSegment = (segment) => {
  return segment
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

const Breadcrumb = () => {
  const location = useLocation();
  const segments = location.pathname.split("/").filter(Boolean);

  if (segments.length === 0) {
    return null;
  }

  return (
    <nav aria-label="Breadcrumb" className="text-sm text-gray-500">
      <ol className="flex flex-wrap items-center gap-2">
        <li>
          <Link to="/dashboard" className="hover:text-gray-900">
            Dashboard
          </Link>
        </li>
        {segments[0] !== "dashboard" &&
          segments.map((segment, index) => {
            const path = `/${segments.slice(0, index + 1).join("/")}`;
            const isLast = index === segments.length - 1;

            return (
              <li key={path} className="flex items-center gap-2">
                <span>/</span>
                {isLast ? (
                  <span className="font-medium text-gray-700">{labelFromSegment(segment)}</span>
                ) : (
                  <Link to={path} className="hover:text-gray-900">
                    {labelFromSegment(segment)}
                  </Link>
                )}
              </li>
            );
          })}
      </ol>
    </nav>
  );
};

export default Breadcrumb;
