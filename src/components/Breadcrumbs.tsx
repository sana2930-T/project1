import React from "react";
import { Link, useLocation } from "react-router-dom";
import { ChevronRight, Home } from "lucide-react";

const routeNames: Record<string, string> = {
  dashboard: "Overview Dashboard",
  sources: "Water Sources",
  map: "Water-Risk Map",
  measurements: "Quality Measurements",
  alerts: "Early Warnings & Alerts",
  inspections: "Field Inspections",
  laboratory: "Laboratory Reports",
  analytics: "Analytics & Compliance",
};

export const Breadcrumbs: React.FC = () => {
  const location = useLocation();
  const pathnames = location.pathname.split("/").filter((x) => x);

  if (pathnames.length === 0) return null;

  return (
    <nav aria-label="Breadcrumb" className="mb-4">
      <ol className="flex items-center gap-1.5 text-xs text-slate-500 flex-wrap">
        <li>
          <Link
            to="/dashboard"
            className="flex items-center gap-1 text-slate-600 hover:text-teal-600 transition-colors"
          >
            <Home className="w-3.5 h-3.5" />
            <span>Home</span>
          </Link>
        </li>

        {pathnames.map((segment, index) => {
          const to = `/${pathnames.slice(0, index + 1).join("/")}`;
          const isLast = index === pathnames.length - 1;
          const label = routeNames[segment] || segment;

          return (
            <React.Fragment key={to}>
              <li className="text-slate-400">
                <ChevronRight className="w-3.5 h-3.5" />
              </li>
              <li>
                {isLast ? (
                  <span className="font-semibold text-slate-900 capitalize">
                    {label}
                  </span>
                ) : (
                  <Link
                    to={to}
                    className="text-slate-600 hover:text-teal-600 capitalize transition-colors"
                  >
                    {label}
                  </Link>
                )}
              </li>
            </React.Fragment>
          );
        })}
      </ol>
    </nav>
  );
};
